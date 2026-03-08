'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, getApiUrl } from '@/lib/api';
import { setAuthCookie } from '@/lib/auth-cookie';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>('');

  useEffect(() => {
    setApiUrl(getApiUrl());
    console.log('[Login] NEXT_PUBLIC_API_URL (base):', getApiUrl());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('[Login] Tentando login:', { email, apiUrl: getApiUrl() });
    try {
      const { access_token, user } = await auth.login(email, password);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      setAuthCookie();
      const from = searchParams.get('from');
      const safeFrom = from && from.startsWith('/dashboard') ? from : '/dashboard';
      router.push(safeFrom);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar';
      console.error('[Login] Erro no login:', { err, message, apiUrl: getApiUrl() });
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'var(--color-background)',
      }}
    >
<div
          style={{
            width: '100%',
            maxWidth: 360,
            background: 'var(--color-background)',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            border: '1px solid var(--color-border)',
          }}
        >
        <div style={{ background: 'var(--color-primary)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
          <img
            src="/logo-prefeitura-franca.png"
            alt="Prefeitura de Franca"
            style={{ display: 'block', maxWidth: '100%', height: 72, objectFit: 'contain' }}
          />
        </div>
        <h1 style={{ marginBottom: 8, fontSize: 24, color: 'var(--color-primary)' }}>
          Botão do Pânico
        </h1>
        <p style={{ color: 'var(--color-gray)', marginBottom: 24, fontSize: 14 }}>
          Painel administrativo
        </p>
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(197,48,48,0.15)',
                color: 'var(--color-error)',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              {error}
              <div style={{ marginTop: 8, fontSize: 11, wordBreak: 'break-all', opacity: 0.9 }}>
                <strong>NEXT_PUBLIC_API_URL (valor usado):</strong> {apiUrl || '(vazio — variável não definida no build)'}
              </div>
            </div>
          )}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--color-text)' }}>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
              }}
            />
          </label>
          <label style={{ display: 'block', marginBottom: 24 }}>
            <span style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--color-text)' }}>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--color-background)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                color: 'var(--color-text)',
              }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              background: 'var(--color-primary)',
              border: 'none',
              borderRadius: 8,
              color: 'white',
              fontWeight: 600,
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--color-gray)', textAlign: 'center' }}>
            <a href="/politica-de-uso" style={{ color: 'var(--color-link)' }}>Política de uso</a>
            {' · '}
            <a href="/descadastramento" style={{ color: 'var(--color-link)' }}>Solicitar descadastramento</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
