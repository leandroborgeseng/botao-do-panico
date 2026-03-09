'use client';

import Link from 'next/link';

/** URL dos padrões externos contra abuso e exploração sexual infantil (CSAE). Atualize se necessário. */
const CSAE_EXTERNAL_URL =
  'https://support.google.com/googleplay/android-developer/answer/9888170';

export default function PadroesCsaPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        maxWidth: 720,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--color-link)', fontSize: 14 }}>
          ← Voltar
        </Link>
      </div>

      <h1 style={{ fontSize: 28, marginBottom: 8, color: 'var(--color-primary)' }}>
        Padrões contra abuso e exploração sexual infantil (CSAE)
      </h1>
      <p style={{ color: 'var(--color-gray)', marginBottom: 32, fontSize: 14 }}>
        Última atualização: março de 2026
      </p>

      <section style={{ marginBottom: 28 }}>
        <p style={{ marginBottom: 16 }}>
          O aplicativo Botão do Pânico está comprometido com a proteção de crianças e
          adolescentes e repudia qualquer forma de abuso ou exploração sexual infantil.
          O app não tolera conteúdo ou conduta que viole as normas de segurança infantil.
        </p>
        <p style={{ marginBottom: 16 }}>
          Seguimos os padrões publicados externamente contra abuso e exploração sexual
          infantil (CSAE). Consulte o documento oficial nos links abaixo:
        </p>
        <p>
          <a
            href={CSAE_EXTERNAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--color-link)',
              fontWeight: 500,
              textDecoration: 'underline',
            }}
          >
            Padrões CSAE — Políticas de segurança infantil (Google Play) →
          </a>
        </p>
      </section>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '32px 0' }} />
      <p style={{ fontSize: 13, color: 'var(--color-gray)' }}>
        <Link href="/" style={{ color: 'var(--color-link)' }}>Voltar ao início</Link>
        {' · '}
        <Link href="/politica-de-uso" style={{ color: 'var(--color-link)' }}>Política de uso</Link>
        {' · '}
        <Link href="/descadastramento" style={{ color: 'var(--color-link)' }}>Solicitar descadastramento</Link>
      </p>
    </div>
  );
}
