'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      setError('CPF deve ter 11 dígitos.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await auth.register({ name: name.trim(), email: email.trim(), password, cpf: cpfDigits });
      router.push('/login?registered=1');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar');
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
          Cadastro
        </h1>
        <p style={{ color: 'var(--color-gray)', marginBottom: 24, fontSize: 14 }}>
          Crie sua conta no painel do Botão do Pânico
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
            </div>
          )}
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--color-text)' }}>Nome completo</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
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
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--color-text)' }}>CPF</span>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
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
            <span style={{ display: 'block', marginBottom: 6, fontSize: 14, color: 'var(--color-text)' }}>Senha (mín. 6 caracteres)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
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
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
          <p style={{ marginTop: 16, fontSize: 14, textAlign: 'center' }}>
            <Link href="/login" style={{ color: 'var(--color-link)', fontWeight: 600 }}>Já tem conta? Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
