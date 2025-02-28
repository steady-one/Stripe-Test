'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CardElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Stripe Publishable Key로 Stripe 객체 초기화
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function CardRegistrationForm({ clientSecret, customerId }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsLoading(true);

    // SetupIntent를 사용하여 카드 정보를 등록
    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { email },
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      // 카드 등록 성공 후, 기본 결제 수단 업데이트 API 호출
      try {
        const res = await fetch('/api/update-default-payment-method', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            paymentMethodId: setupIntent.payment_method,
          }),
        });
        const data = await res.json();
        if (data.error) {
          setMessage('기본 결제 수단 업데이트 실패: ' + data.error);
        } else {
          setMessage(
            '카드가 성공적으로 등록되고 기본 결제 수단으로 설정되었습니다!'
          );
          // router.push(`/`);
        }
      } catch (err) {
        setMessage('기본 결제 수단 업데이트 중 오류 발생: ' + err.message);
      }
    }
    setIsLoading(false);
  };

  return (
    <form id='card-registration-form' onSubmit={handleSubmit}>
      <div style={{ paddingBottom: '1rem' }}>
        <h2>카드 등록 테스트</h2>
      </div>

      <CardElement
        id='card-element'
        options={{ style: { base: { fontSize: '16px' } } }}
      />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          disabled={!stripe || isLoading}
          id='submit'
          style={{ marginTop: '1rem', width: '50%' }}
        >
          {isLoading ? '등록 중...' : '카드 등록하기'}
        </button>
      </div>
      {message && (
        <div id='card-message' style={{ marginTop: '1rem' }}>
          {message}
        </div>
      )}
    </form>
  );
}

export default function CheckoutForm({ clientSecret, customerId }) {
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#1d73c9',
      colorText: '#9f9fa8',
    },
  };
  const router = useRouter();
  const goHome = () => {
    router.push('/');
  };

  return (
    <Elements stripe={stripePromise} options={{ appearance, clientSecret }}>
      <CardRegistrationForm
        clientSecret={clientSecret}
        customerId={customerId}
      />
      <button
        onClick={goHome}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem', width: '100%' }}
      >
        홈으로 돌아가기
      </button>
    </Elements>
  );
}
