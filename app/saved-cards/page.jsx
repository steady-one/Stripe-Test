'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SavedCardsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const newPaymentMethodId = searchParams.get('paymentMethodId');

  const [cards, setCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch(
          `/api/list-payment-methods?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        console.log(data);
        if (data.error) {
          setError(data.error);
        } else {
          setCards(data.paymentMethods);
        }
      } catch (err) {
        setError('저장된 카드 정보를 불러오는데 실패했습니다.');
      }
      setLoading(false);
    }
    fetchCards();
  }, [email]);

  const handleCheckboxChange = (id, checked) => {
    if (checked) {
      setSelectedCards((prev) => [...prev, id]);
    } else {
      setSelectedCards((prev) => prev.filter((cardId) => cardId !== id));
    }
  };

  const handleRemoveCards = async () => {
    try {
      for (const paymentMethodId of selectedCards) {
        await fetch(
          `/api/remove-payment-method?paymentMethodId=${encodeURIComponent(
            paymentMethodId
          )}`,
          { method: 'DELETE' }
        );
      }
      // 업데이트: 제거된 카드들을 목록에서 제거
      setCards((prev) =>
        prev.filter((card) => !selectedCards.includes(card.id))
      );
      setSelectedCards([]);
    } catch (err) {
      setError('카드를 제거하는 중 오류가 발생했습니다.');
    }
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
      <h1>저장된 카드 정보</h1>
      {email && <p>등록한 이메일: {email}</p>}
      {newPaymentMethodId && <p>새로 등록된 카드 ID: {newPaymentMethodId}</p>}
      {loading && <p>불러오는 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && cards.length === 0 && (
        <p>저장된 카드가 없습니다.</p>
      )}
      {!loading && !error && cards.length > 0 && (
        <>
          <ul>
            {cards.map((card) => (
              <li key={card.id} style={{ marginBottom: '1rem' }}>
                <label>
                  <input
                    type='checkbox'
                    onChange={(e) =>
                      handleCheckboxChange(card.id, e.target.checked)
                    }
                    checked={selectedCards.includes(card.id)}
                    style={{ marginRight: '8px' }}
                  />
                  <strong>{card.card.brand.toUpperCase()}</strong> 카드 (****{' '}
                  {card.card.last4})
                </label>
                <br />
                유효기간: {card.card.exp_month}/{card.card.exp_year}
              </li>
            ))}
          </ul>
          {selectedCards.length > 0 && (
            <button onClick={handleRemoveCards} style={{ marginTop: '1rem' }}>
              선택된 카드 제거하기
            </button>
          )}
        </>
      )}
      {/* 홈으로 돌아가기 버튼 */}
      <button
        onClick={goHome}
        style={{ marginTop: '2rem', padding: '0.5rem 1rem' }}
      >
        홈으로 돌아가기
      </button>
    </div>
  );
}
