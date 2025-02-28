import { stripe } from '../../../lib/stripe';

// POST 요청을 처리하는 API 엔드포인트
export async function POST(request) {
  try {
    // 요청 본문을 JSON으로 파싱하여 email 값을 추출합니다.
    const { email } = await request.json();

    // email이 전달되지 않은 경우, 에러 응답을 반환합니다.
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required.' }), {
        status: 400,
      });
    }

    // 전달받은 email을 이용해 Stripe에서 고객을 검색합니다.
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    });

    // 고객이 검색되지 않으면 에러 응답을 반환합니다.
    if (!customers.data || customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No customer found with the provided email.' }),
        { status: 404 }
      );
    }

    // 검색된 고객 목록 중 첫 번째 고객의 ID를 사용합니다.
    const customerId = customers.data[0].id;

    // 고객의 상세 정보를 조회하여 기본 결제 수단이 설정되어 있는지 확인합니다.
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethod =
      customer.invoice_settings?.default_payment_method;

    // 기본 결제 수단이 설정되어 있지 않으면 에러 응답을 반환합니다.
    if (!defaultPaymentMethod) {
      return new Response(
        JSON.stringify({
          error: 'Customer has no default payment method set.',
        }),
        { status: 400 }
      );
    }

    // 예시로 AWS 사용 비용을 $150로 설정합니다.
    const baseCostDollars = 150; // 기본 비용: $150

    // 기본 비용에 10%의 추가 요금을 적용하여 최종 비용을 계산합니다.
    const adjustedCostDollars = baseCostDollars * 1.1; // 예: 150 * 1.1 = 165달러

    // 최종 금액을 센트 단위로 변환합니다. (결제는 정수 형태의 센트 단위로 진행됩니다.)
    const amountInCents = Math.round(adjustedCostDollars * 100); // 예: 165 * 100 = 16500

    // PaymentIntent를 생성하여 결제를 진행합니다.
    // - off_session: 고객의 직접 개입 없이 결제 진행
    // - confirm: PaymentIntent 생성과 동시에 결제 시도
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      customer: customerId,
      payment_method: defaultPaymentMethod,
      off_session: true,
      confirm: true,
      metadata: {
        paymentType: 'postpaid', // 후불 결제임을 나타내는 메타데이터
        additionalInfo: 'AWS usage charges', // 추가 정보
      },
    });

    // PaymentIntent 생성에 성공하면, 해당 결과를 JSON 형태로 반환합니다.
    return new Response(JSON.stringify({ paymentIntent }), {
      status: 200,
    });
  } catch (error) {
    // 오류 발생 시 콘솔에 로그를 남기고, 500 에러 응답을 반환합니다.
    console.error('Charge creation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
