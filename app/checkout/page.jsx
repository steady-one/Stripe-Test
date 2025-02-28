'use client';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useSearchParams } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

// 보너스율 및 라벨 설정
const bonusRates = {
  100: 0, // 0%
  1000: 0.02, // 2%
  10000: 0.05, // 5%
};

const bonusLabels = {
  100: '보너스 없음',
  1000: '보너스 2% (1,000 충전 시 20 추가)',
  10000: '보너스 5% (10,000 충전 시 500 추가)',
};

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [creditQuantities, setCreditQuantities] = useState({
    100: 0,
    1000: 0,
    10000: 0,
  });

  // 수량 증가 함수
  const incrementQuantity = (pkg) => {
    setCreditQuantities((prev) => ({
      ...prev,
      [pkg]: prev[pkg] + 1,
    }));
  };

  // 수량 감소 함수
  const decrementQuantity = (pkg) => {
    setCreditQuantities((prev) => ({
      ...prev,
      [pkg]: prev[pkg] > 0 ? prev[pkg] - 1 : 0,
    }));
  };

  // 총 충전 크레딧 계산 (보너스 포함)
  const totalCredits = Object.entries(creditQuantities).reduce(
    (acc, [pkg, quantity]) => {
      const base = parseInt(pkg, 10);
      const bonusRate = bonusRates[pkg] || 0;
      // bonusCredits = base * bonusRate * quantity
      const bonusCredits = base * bonusRate * quantity;
      return acc + base * quantity + bonusCredits;
    },
    0
  );

  // 총 금액은 보너스 제외, 1크레딧당 1달러
  const totalPrice = Object.entries(creditQuantities).reduce(
    (acc, [pkg, quantity]) => acc + parseInt(pkg, 10) * quantity,
    0
  );

  const handleCheckout = async () => {
    setLoading(true);
    // 구매할 항목 구성: 수량이 0보다 큰 항목만 포함
    const items = Object.entries(creditQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([pkg, quantity]) => ({ package: pkg, quantity }));

    if (!email || items.length === 0) {
      alert('이메일과 구매할 크레딧을 선택해주세요.');
      setLoading(false);
      return;
    }

    // API Route에 이메일과 구매 항목(items)을 전달
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, items }),
    });
    const data = await response.json();
    if (data.sessionId) {
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
      if (error) console.error('리다이렉트 에러:', error);
    } else {
      console.error('세션 생성 에러:', data.error);
    }
    setLoading(false);
  };

  // 공통 스타일 정의
  const productBoxStyle = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    width: '200px',
    height: '100px',
    textAlign: 'center',
    backgroundColor: '#fff',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  const labelStyle = {
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'block',
  };

  const bonusStyle = {
    fontSize: '12px',
    color: '#555',
    marginBottom: '8px',
  };

  const buttonStyle = {
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  };

  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: '2rem',
        fontFamily: 'sans-serif',
      }}
    >
      <h1>크레딧 충전</h1>
      <div style={{ margin: '1rem' }}>
        {/* 상품 박스들을 한 줄에 정렬 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '2rem',
            marginBottom: '1rem',
          }}
        >
          {/* 100 크레딧 박스 */}
          <div style={productBoxStyle}>
            <div style={labelStyle}>100 크레딧</div>
            <div style={bonusStyle}>{bonusLabels['100']}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                style={buttonStyle}
                onClick={() => decrementQuantity('100')}
              >
                –
              </button>
              <span style={{ margin: '0 8px' }}>{creditQuantities['100']}</span>
              <button
                style={buttonStyle}
                onClick={() => incrementQuantity('100')}
              >
                +
              </button>
            </div>
          </div>
          {/* 1000 크레딧 박스 */}
          <div style={productBoxStyle}>
            <div style={labelStyle}>1000 크레딧</div>
            <div style={bonusStyle}>{bonusLabels['1000']}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                style={buttonStyle}
                onClick={() => decrementQuantity('1000')}
              >
                –
              </button>
              <span style={{ margin: '0 8px' }}>
                {creditQuantities['1000']}
              </span>
              <button
                style={buttonStyle}
                onClick={() => incrementQuantity('1000')}
              >
                +
              </button>
            </div>
          </div>
          {/* 10000 크레딧 박스 */}
          <div style={productBoxStyle}>
            <div style={labelStyle}>10000 크레딧</div>
            <div style={bonusStyle}>{bonusLabels['10000']}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                style={buttonStyle}
                onClick={() => decrementQuantity('10000')}
              >
                –
              </button>
              <span style={{ margin: '0 8px' }}>
                {creditQuantities['10000']}
              </span>
              <button
                style={buttonStyle}
                onClick={() => incrementQuantity('10000')}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 총 충전 크레딧 및 총 금액 표시 */}
        <div style={{ marginBottom: '1rem', fontSize: '18px' }}>
          <strong>총 충전 크레딧:</strong> {totalCredits.toFixed(0)} 크레딧
          <br />
          <strong>총 금액:</strong> ${totalPrice}
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? '로딩 중...' : '결제 진행'}
        </button>
      </div>
    </div>
  );
}
