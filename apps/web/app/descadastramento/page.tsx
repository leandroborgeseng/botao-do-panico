'use client';

import { useState } from 'react';
import Link from 'next/link';

function onlyDigits(s: string) {
  return s.replace(/\D/g, '');
}

function formatCpf(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function isValidCpf(cpf: string) {
  const d = onlyDigits(cpf);
  return d.length === 11 && !/^(\d)\1{10}$/.test(d);
}

export default function DescadastramentoPage() {
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    if (!isValidCpf(cpf)) {
      setMessage('Informe um CPF válido (11 dígitos).');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setMessage('Informe um e-mail válido.');
      return;
    }
    setStatus('loading');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    try {
      const res = await fetch(`${apiUrl}/auth/solicitar-descadastramento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: onlyDigits(cpf), email: email.trim() }),
      });
      const data = res.ok ? await res.json().catch(() => ({})) : null;
      if (res.ok) {
        setStatus('success');
        setMessage(data?.message || 'Solicitação recebida. Você receberá um e-mail para confirmar o descadastramento.');
      } else {
        setStatus('error');
        setMessage(data?.message || `Erro ao enviar solicitação (${res.status}). Tente novamente ou entre em contato.`);
      }
    } catch {
      setStatus('error');
      setMessage('Não foi possível enviar a solicitação no momento. Tente novamente ou entre em contato pelo e-mail de suporte.');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        maxWidth: 560,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--color-link)', fontSize: 14 }}>
          ← Voltar
        </Link>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 8, color: 'var(--color-primary)' }}>
        Solicitar descadastramento
      </h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 24, lineHeight: 1.5 }}>
        Você pode solicitar a exclusão permanente dos seus dados da plataforma Botão do Pânico.
        Envie seu CPF e e-mail cadastrado; enviaremos um link por e-mail para confirmar o descadastramento.
      </p>

      {status === 'success' ? (
        <div
          style={{
            padding: 20,
            background: '#e8f5e9',
            border: '1px solid var(--color-success)',
            borderRadius: 8,
            color: '#1b5e20',
          }}
        >
          {message}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="cpf" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              maxLength={14}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 16,
              }}
            />
          </div>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              E-mail cadastrado
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === 'loading'}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 16,
              }}
            />
          </div>
          {(message && status === 'error') && (
            <p style={{ color: 'var(--color-error)', fontSize: 14 }}>{message}</p>
          )}
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: 14,
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar solicitação'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 32, fontSize: 13, color: 'var(--color-gray)' }}>
        Ao confirmar pelo e-mail, sua conta e dados vinculados serão excluídos de forma permanente,
        em conformidade com a LGPD e políticas das lojas de aplicativos.
      </p>
    </div>
  );
}
