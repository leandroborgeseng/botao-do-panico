import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface SendPushResult {
  token: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private firebaseApp: import('firebase-admin').app.App | null = null;
  private readonly isMock: boolean;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const path = this.config.get('FIREBASE_SERVICE_ACCOUNT_PATH');
    const json = this.config.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (path || json) {
      try {
        const admin = require('firebase-admin');
        if (json) {
          const credentials = typeof json === 'string' ? JSON.parse(json) : json;
          this.firebaseApp = admin.initializeApp({ credential: admin.credential.cert(credentials) });
        } else if (path) {
          // path = absolute path to JSON file
          this.firebaseApp = admin.initializeApp({ credential: admin.credential.cert(resolve(process.cwd(), path)) });
        }
      } catch (e) {
        this.logger.warn('FCM init failed, using MOCK mode', e);
      }
    }
    this.isMock = !this.firebaseApp;
    if (this.isMock) {
      this.logger.log('FCM running in MOCK mode (no credentials). Push payloads will be logged.');
    }
  }

  private isExpoPushToken(token: string): boolean {
    return typeof token === 'string' && token.startsWith('ExponentPushToken[');
  }

  private async sendExpoPush(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<SendPushResult[]> {
    const results: SendPushResult[] = [];
    if (tokens.length === 0) return results;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(
          tokens.map((to) => ({
            to,
            title,
            body,
            sound: 'default',
            data: data ?? {},
          })),
        ),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) {
        const errText = await res.text();
        for (const token of tokens) {
          results.push({ token, success: false, error: `Expo API ${res.status}: ${errText}` });
        }
        return results;
      }
      const json = (await res.json()) as { data?: { status: string; message?: string }[] };
      const list = json.data ?? [];
      tokens.forEach((token, i) => {
        const item = list[i];
        const ok = item?.status === 'ok';
        results.push({ token, success: ok, error: ok ? undefined : item?.message ?? 'unknown' });
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      for (const token of tokens) {
        results.push({ token, success: false, error: message });
      }
    }
    return results;
  }

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<SendPushResult[]> {
    const results: SendPushResult[] = [];

    if (this.isMock) {
      for (const token of tokens) {
        this.logger.log(`[MOCK] Push payload: token=${token.slice(0, 20)}... title=${title} body=${body} data=${JSON.stringify(data)}`);
        results.push({ token, success: false, error: 'MOCK_MODE' });
      }
      return results;
    }

    if (tokens.length === 0) return results;

    const expoTokens = tokens.filter((t) => this.isExpoPushToken(t));
    const fcmTokens = tokens.filter((t) => !this.isExpoPushToken(t));

    const [expoResults, fcmResults] = await Promise.all([
      this.sendExpoPush(expoTokens, title, body, data),
      fcmTokens.length > 0 && this.firebaseApp
        ? (async () => {
            const messaging = this.firebaseApp!.messaging();
            const out: SendPushResult[] = [];
            for (const token of fcmTokens) {
              try {
                await messaging.send({
                  token,
                  notification: { title, body },
                  data: data || {},
                  android: { priority: 'high' },
                  apns: { payload: { aps: { sound: 'default', contentAvailable: true } } },
                });
                out.push({ token, success: true });
              } catch (err: unknown) {
                out.push({ token, success: false, error: err instanceof Error ? err.message : String(err) });
              }
            }
            return out;
          })()
        : Promise.resolve(
            fcmTokens.map((token) => ({ token, success: false as const, error: 'FCM not configured' })),
          ),
    ]);

    return [...expoResults, ...fcmResults];
  }

  async logResults(panicEventId: string, results: SendPushResult[]) {
    for (const r of results) {
      await this.prisma.panicNotificationLog.create({
        data: {
          panicEventId,
          targetToken: r.token,
          success: r.success,
          error: r.error ?? null,
        },
      });
    }
  }
}
