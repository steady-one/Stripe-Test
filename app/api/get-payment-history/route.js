import { stripe } from '../../../lib/stripe';

// GET 요청을 처리하는 API 엔드포인트
export async function GET(request) {
  try {
    // 1. URL에서 쿼리 파라미터(searchParams)를 파싱합니다.
    const { searchParams } = new URL(request.url);
    // 2. "email" 쿼리 파라미터 값을 추출합니다.
    const email = searchParams.get('email');

    // 3. email 값이 제공되지 않으면 400 에러 응답을 반환합니다.
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
      });
    }

    // 4. 제공된 email로 Stripe에서 고객을 검색합니다.
    // 여러 고객이 검색될 경우 첫 번째 고객을 사용합니다.
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    });

    // 5. 검색된 고객 데이터가 없으면 404 에러 응답을 반환합니다.
    if (!customers.data || customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No customer found with the provided email.' }),
        { status: 404 }
      );
    }

    // 6. 검색된 고객의 첫 번째 고객의 ID를 추출합니다.
    const customerId = customers.data[0].id;

    // 7. 해당 고객의 PaymentIntent 목록을 조회합니다.
    // expand 옵션을 사용해 각 PaymentIntent에 연결된 Charge 데이터도 함께 가져옵니다.
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 20, // 최대 20개의 PaymentIntent 조회
      expand: ['data.charges.data'],
    });

    // 8. 각 PaymentIntent에서 필요한 정보를 추출하여 새로운 객체 배열(results)을 만듭니다.
    const results = paymentIntents.data.map((pi) => {
      let receipt_url = null;
      // PaymentIntent에 연결된 Charge 데이터가 있을 경우, 첫 번째 Charge의 receipt_url을 사용합니다.
      if (pi.charges && pi.charges.data && pi.charges.data.length > 0) {
        receipt_url = pi.charges.data[0].receipt_url || null;
      }
      return {
        id: pi.id, // PaymentIntent의 ID
        amount: pi.amount, // 결제 금액 (센트 단위)
        currency: pi.currency, // 통화 단위
        status: pi.status, // 결제 상태 (예: succeeded, pending 등)
        created: pi.created, // 생성 시각 (Unix timestamp)
        receipt_url, // 영수증 URL (존재할 경우)
        paymentType: pi.metadata.paymentType || null, // 메타데이터에 기록된 결제 유형
        metadata: pi.metadata, // 전체 메타데이터
      };
    });

    // 9. metadata에 paymentType 값이 존재하는 PaymentIntent만 필터링합니다.
    const filteredResults = results.filter((pi) => pi.paymentType !== null);

    // 10. 필터링된 결제 내역을 콘솔에 출력합니다.
    console.log('필터링된 결제 내역:', filteredResults);

    // 11. 필터링된 PaymentIntent 목록을 JSON 형태로 응답합니다.
    return new Response(JSON.stringify({ paymentIntents: filteredResults }), {
      status: 200,
    });
  } catch (error) {
    // 12. 처리 중 오류가 발생하면, 오류 메시지를 로그에 남기고 500 에러 응답을 반환합니다.
    console.error('Error retrieving payment history:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
