import { stripe } from '../../../lib/stripe';

// POST 요청을 처리하는 API 엔드포인트
export async function POST(request) {
  try {
    // 요청 본문에서 email과 items 데이터를 추출합니다.
    // items 예시: [{ package: '100', quantity: 2 }, { package: '1000', quantity: 1 }]
    const { email, items } = await request.json();

    // email, items가 존재하며 items가 배열이고 비어있지 않은지 검증합니다.
    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Email과 구매할 크레딧 정보를 제공해야 합니다.',
        }),
        { status: 400 }
      );
    }

    // 이메일로 기존 고객을 검색합니다.
    // 고객이 존재하지 않으면 새로 생성합니다.
    let customer;
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    });
    if (customers.data.length > 0) {
      // 검색된 고객 중 첫 번째 고객을 사용합니다.
      customer = customers.data[0];
    } else {
      // 고객이 없으면 새 고객을 생성합니다.
      customer = await stripe.customers.create({ email });
    }

    // 미리 정의된 가격 매핑 객체 (환경변수에 저장된 Price ID를 사용)
    const priceMapping = {
      100: process.env.STRIPE_PRICE_ID_100, // 예: 'price_100xxxx'
      1000: process.env.STRIPE_PRICE_ID_1000, // 예: 'price_1000xxxx'
      10000: process.env.STRIPE_PRICE_ID_10000, // 예: 'price_10000xxxx'
    };

    // items 배열을 순회하며, 각 항목에 대해 line_items 배열을 생성합니다.
    const line_items = items.map((item) => {
      // 선택한 크레딧 패키지에 해당하는 가격 ID 조회
      const priceId = priceMapping[item.package];
      if (!priceId) {
        // 잘못된 패키지일 경우 예외를 발생시킵니다.
        throw new Error(`잘못된 크레딧 패키지: ${item.package}`);
      }
      return {
        price: priceId,
        quantity: item.quantity,
      };
    });

    // Stripe Checkout 세션 생성
    // 결제 모드, 고객 정보, 구매 항목, 성공/취소 URL, 그리고 PaymentIntent의 메타데이터를 설정합니다.
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', // 단일 결제 모드 사용
      payment_method_types: ['card'], // 카드 결제만 허용
      customer: customer.id,
      line_items, // 구매할 상품 목록
      // 결제 성공 시 리디렉션될 URL (Checkout 세션 ID가 URL에 포함됩니다.)
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/charge?email=${email}&session_id={CHECKOUT_SESSION_ID}`,
      // 결제 취소 시 리디렉션될 URL
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      // PaymentIntent 생성 시 추가 정보(metadata)를 포함시킵니다.
      payment_intent_data: {
        metadata: {
          paymentType: 'credit', // 결제 유형을 크레딧 결제로 표시
          items: JSON.stringify(items), // 구매 항목 정보를 기록
        },
      },
    });

    // 생성된 Checkout 세션의 ID를 클라이언트에 반환합니다.
    return new Response(JSON.stringify({ sessionId: session.id }), {
      status: 200,
    });
  } catch (error) {
    // 오류 발생 시 콘솔에 로그를 남기고, 에러 메시지와 함께 500 상태 코드를 반환합니다.
    console.error('Checkout session 생성 오류:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
