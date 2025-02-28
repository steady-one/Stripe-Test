import { stripe } from '../../../lib/stripe';

// GET 요청을 처리하는 API 엔드포인트
export async function GET(request) {
  // 1. 요청 URL에서 쿼리 파라미터를 추출합니다.
  const { searchParams } = new URL(request.url);
  console.log('Request URL:', request.url);

  // 2. URL의 "email" 파라미터 값을 가져옵니다.
  const email = searchParams.get('email');
  // 3. 이메일이 제공되지 않으면 400 에러 응답을 반환합니다.
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is not provided.' }), {
      status: 400,
    });
  }

  // 4. 제공된 이메일을 기준으로 Stripe에서 고객을 검색합니다.
  const customers = await stripe.customers.search({
    query: `email:"${email}"`,
  });
  console.log('검색된 고객:', customers.data);

  // 5. 검색된 고객 데이터가 없거나 결과 배열이 비어있으면 404 에러 응답을 반환합니다.
  if (!customers.data || customers.data.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No customer found for the provided email.' }),
      { status: 404 }
    );
  }

  // 6. 검색된 고객 목록 중 첫 번째 고객의 ID를 사용합니다.
  const customerId = customers.data[0].id;

  try {
    // 7. 해당 고객의 카드 타입 결제 수단(Payment Methods)을 조회합니다.
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // 8. 각 Payment Method의 metadata에 paymentType 키가 존재하는 항목만 필터링합니다.
    const filteredPaymentMethods = paymentMethods.data.filter(
      (pm) => pm.metadata && pm.metadata.paymentType
    );

    // 9. 필터링된 Payment Methods를 JSON 형태로 응답합니다.
    return new Response(
      JSON.stringify({ paymentMethods: filteredPaymentMethods }),
      { status: 200 }
    );
  } catch (error) {
    // 10. 오류 발생 시, 500 에러 응답과 함께 오류 메시지를 반환합니다.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
