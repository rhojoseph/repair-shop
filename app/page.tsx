"use client";

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', background: '#f3f4f6',
      fontFamily: 'sans-serif', padding: '20px'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>🧵</div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>에벤에셀옷수선</h1>
        <p style={{ fontSize: '15px', color: '#666' }}>어떤 용도로 사용하시나요?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '320px' }}>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '20px', borderRadius: '16px', border: 'none',
            background: '#2563eb', color: 'white', fontSize: '18px',
            fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          🔑 사장님 입장
        </button>

        <button
          onClick={() => router.push('/customer')}
          style={{
            padding: '20px', borderRadius: '16px', border: '2px solid #e5e7eb',
            background: 'white', color: '#333', fontSize: '18px',
            fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }}
        >
          👤 고객님 입장
        </button>
      </div>

      <p style={{ marginTop: '40px', fontSize: '12px', color: '#aaa' }}>© 에벤에셀옷수선</p>
    </div>
  );
}
