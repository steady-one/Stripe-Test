'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Test from '../public/card.json';

import Lottie from 'react-lottie';

export default function IndexPage() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const isEmailValid = email.trim().length > 0;

  const navigateTo = (path) => {
    // 이메일을 쿼리 파라미터로 전달 (필요에 따라 수정하세요)
    router.push(`${path}?email=${encodeURIComponent(email)}`);
  };

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: require('../public/card.json'),
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice',
    },
  };

  return (
    <div style={{ padding: '2rem', width: '500px', margin: '0 auto' }}>
      <h1>메인 페이지</h1>
      <div>
        <Lottie options={defaultOptions} height={400} width={400} />
      </div>
      <input
        type='email'
        placeholder='이메일 주소를 입력하세요'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          padding: '0.5rem',
          width: '100%',
          marginBottom: '1rem',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => navigateTo('/saved-cards')}
          disabled={!isEmailValid}
          style={{ padding: '0.5rem 1rem' }}
        >
          저장된 카드
        </button>
        <button
          onClick={() => navigateTo('/card-registration')}
          disabled={!isEmailValid}
          style={{ padding: '0.5rem 1rem' }}
        >
          카드 등록
        </button>
        <button
          onClick={() => navigateTo('/charge')}
          disabled={!isEmailValid}
          style={{ padding: '0.5rem 1rem' }}
        >
          청구하기
        </button>
        <button
          onClick={() => navigateTo('/checkout')}
          disabled={!isEmailValid}
          style={{ padding: '0.5rem 1rem' }}
        >
          결제하기
        </button>
      </div>
    </div>
  );
}
