'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/dashboard');
    else router.replace('/login');
  }, [router]);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      Carregando...
    </div>
  );
}
