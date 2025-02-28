import { stripe } from '../../../lib/stripe';

// GET 요청을 처리하는 API 엔드포인트
export async function GET(request) {
  // 요청 URL에서 쿼리 파라미터(searchParams)를 파싱합니다.
  const { searchParams } = new URL(request.url);
  // URL의 "email" 쿼리 파라미터 값을 가져옵니다.
  const email = searchParams.get('email');

  // email이 제공되지 않은 경우, 400 상태 코드와 함께 에러 메시지 반환
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required.' }), {
      status: 400,
    });
  }

  try {
    // 제공된 email로 Stripe 고객을 검색합니다.
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    });

    // 검색된 고객 데이터가 없거나 결과 배열이 비어있으면 404 에러 반환
    if (!customers.data || customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No customer found with the provided email.' }),
        { status: 404 }
      );
    }

    // 검색된 고객 목록 중 첫 번째 고객의 ID를 추출합니다.
    const customerId = customers.data[0].id;

    return new Response(JSON.stringify({ customerId }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
