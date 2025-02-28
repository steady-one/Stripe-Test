'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChargeButton({ email }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const router = useRouter();
  const handleCharge = async () => {
    setLoading(true);
    setMessage('');
    setReceiptUrl('');

    try {
      const res = await fetch('/api/create-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.error) {
        setMessage('Error: ' + data.error);
      } else {
        setMessage('결제가 성공적으로 완료되었습니다!');
        if (data.receiptUrl) {
          setReceiptUrl(data.receiptUrl);
        }
      }
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
  };
  const goToHome = () => {
    router.push('/');
  };

  return (
    <div>
      <button onClick={handleCharge} disabled={loading}>
        {loading ? '결제 처리 중...' : '청구하기'}
      </button>
      <button onClick={goToHome}>홈으로 돌아가기</button>

      {message && <p>{message}</p>}
    </div>
  );
}
