'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Redireciona para a página unificada de eventos. */
export default function ReceivedRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/events');
  }, [router]);
  return <p style={{ color: 'var(--color-text)' }}>Redirecionando...</p>;
}
