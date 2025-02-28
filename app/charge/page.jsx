'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ChargeButton from '../../components/chargeButton';

const paymentTypeLabels = {
  credit: '크레딧 결제',
  postpaid: '후불 결제',
  기타: '기타 결제', // paymentType이 없는 경우
};

export default function ChargePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);

  // 이메일이 있으면 해당 이메일로 고객 ID를 조회합니다.
  useEffect(() => {
    if (email) {
      async function fetchCustomerId() {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/get-customer?email=${encodeURIComponent(email)}`
          );
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            setCustomerId(data.customerId);
          }
        } catch (err) {
          setError('고객 정보를 불러오는데 실패했습니다.');
        }
        setLoading(false);
      }
      fetchCustomerId();
    } else {
      setError('이메일이 제공되지 않았습니다.');
    }
  }, [email]);

  // customerId가 확보되면 결제 내역을 불러옵니다.
  useEffect(() => {
    if (customerId) {
      async function fetchPaymentHistory() {
        try {
          const res = await fetch(
            `/api/get-payment-history?email=${encodeURIComponent(email)}`
          );
          const data = await res.json();
          if (data.error) {
            setError(data.error);
          } else {
            // API가 metadata.paymentType 및 metadata.items를 포함한 PaymentIntent 데이터를 반환한다고 가정합니다.
            setPaymentHistory(data.paymentIntents);
          }
        } catch (err) {
          setError('결제 내역을 불러오는데 실패했습니다.');
        }
      }
      fetchPaymentHistory();
    }
  }, [customerId, email]);

  // paymentType 별로 그룹화 (paymentType이 없는 경우 "기타"로 그룹화)
  const groupedHistory = paymentHistory.reduce((acc, pi) => {
    const type = pi.paymentType || '기타';
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(pi);
    return acc;
  }, {});

  // 각 PaymentIntent의 metadata.items를 파싱하여 구매 상품 정보를 생성하는 함수
  const getProductInfo = (pi) => {
    if (pi.metadata && pi.metadata.items) {
      try {
        const items = JSON.parse(pi.metadata.items);
        return items
          .map((item) => `${item.package} 크레딧 x ${item.quantity}`)
          .join(', ');
      } catch (err) {
        return pi.metadata.items; // 파싱 실패 시 그대로 반환
      }
    }
    return '-';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>AWS 사용량 기반 청구 페이지</h1>
      {email && <p>등록된 이메일: {email}</p>}
      {loading && <p>고객 정보를 불러오는 중...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {customerId ? (
        <>
          <ChargeButton email={email} customerId={customerId} />
          <h2 style={{ marginTop: '2rem' }}>결제 내역</h2>
          {paymentHistory.length > 0 ? (
            // 그룹별 테이블들을 가로로 나열하기 위해 flex 컨테이너 사용
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '2rem',
                overflowX: 'auto',
              }}
            >
              {Object.entries(groupedHistory).map(([type, intents]) => {
                const displayLabel = paymentTypeLabels[type] || type;
                return (
                  <div key={type} style={{ minWidth: '300px' }}>
                    <h3 style={{ textAlign: 'center' }}>
                      {displayLabel} 결제 내역
                    </h3>
                    <div style={{ height: '500px', overflowY: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              결제 ID
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              금액
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              상태
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              결제 날짜
                            </th>
                            <th
                              style={{
                                border: '1px solid #ddd',
                                padding: '8px',
                              }}
                            >
                              구매 상품
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {intents.map((pi) => (
                            <tr key={pi.id}>
                              <td
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                }}
                              >
                                {pi.id}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                }}
                              >
                                ${(pi.amount / 100).toFixed(2)}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                }}
                              >
                                {pi.status}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                }}
                              >
                                {new Date(pi.created * 1000).toLocaleString()}
                              </td>
                              <td
                                style={{
                                  border: '1px solid #ddd',
                                  padding: '8px',
                                }}
                              >
                                {getProductInfo(pi)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>결제 내역이 없습니다.</p>
          )}
        </>
      ) : (
        !loading && <p>Customer ID를 불러올 수 없습니다.</p>
      )}
    </div>
  );
}
