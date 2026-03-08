'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@/lib/api';
import { setAuthCookie, clearAuthCookie } from '@/lib/auth-cookie';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (!token || !u) {
      router.replace('/login');
      return;
    }
    setAuthCookie();
    setUser(JSON.parse(u));
  }, [router]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearAuthCookie();
    router.replace('/login');
  }

  if (!user) return <div style={{ padding: 40, color: 'var(--color-text)' }}>Carregando...</div>;

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      <aside
        style={{
          width: 220,
          background: 'var(--color-primary)',
          padding: 24,
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div style={{ background: 'var(--color-primary)', padding: '10px 12px', borderRadius: 8, marginBottom: 20 }}>
          <img
            src="/logo-prefeitura-franca.png"
            alt="Prefeitura de Franca"
            style={{ width: '100%', maxHeight: 56, objectFit: 'contain' }}
          />
        </div>
        <p style={{ fontWeight: 600, marginBottom: 4, color: 'white' }}>{user.name}</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginBottom: 24 }}>{user.email}</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link
            href="/dashboard"
            style={{
              padding: 10,
              borderRadius: 8,
              background: pathname === '/dashboard' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
            }}
          >
            Início
          </Link>
          <Link
            href="/dashboard/events"
            style={{
              padding: 10,
              borderRadius: 8,
              background: pathname?.startsWith('/dashboard/events') ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
            }}
          >
            Eventos de pânico
          </Link>
          <Link
            href="/dashboard/contacts"
            style={{
              padding: 10,
              borderRadius: 8,
              background: pathname === '/dashboard/contacts' ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white',
            }}
          >
            Meus contatos
          </Link>
          {isAdmin && (
            <Link
              href="/dashboard/logs"
              style={{
                padding: 10,
                borderRadius: 8,
                background: pathname === '/dashboard/logs' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
              }}
            >
              Logs / Auditoria
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/dashboard/users"
              style={{
                padding: 10,
                borderRadius: 8,
                background: pathname === '/dashboard/users' ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: 'white',
              }}
            >
              Usuários
            </Link>
          )}
        </nav>
        <button
          onClick={logout}
          style={{
            marginTop: 24,
            padding: '10px 16px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 8,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          Sair
        </button>
      </aside>
      <main style={{ flex: 1, padding: 32, background: 'var(--color-background)', color: 'var(--color-text)' }}>{children}</main>
    </div>
  );
}
