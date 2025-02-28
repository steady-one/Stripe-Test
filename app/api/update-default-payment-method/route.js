import { stripe } from '../../../lib/stripe';

// POST 요청을 처리하는 API 엔드포인트
export async function POST(request) {
  try {
    // 1. 요청 본문을 JSON으로 파싱하여 customerId와 paymentMethodId를 추출합니다.
    const { customerId, paymentMethodId } = await request.json();

    // 2. customerId와 paymentMethodId가 모두 제공되지 않으면 400 에러 응답을 반환합니다.
    if (!customerId || !paymentMethodId) {
      return new Response(
        JSON.stringify({ error: 'customerId와 paymentMethodId가 필요합니다.' }),
        { status: 400 }
      );
    }

    // 3. 주어진 customerId를 사용해 Stripe에서 고객 정보를 조회합니다.
    const customer = await stripe.customers.retrieve(customerId);

    // 4. 고객의 invoice_settings에 이미 기본 결제 수단(default_payment_method)이 설정되어 있는지 확인합니다.
    // 만약 기본 결제 수단이 설정되어 있다면, 업데이트 없이 그대로 응답합니다.
    if (
      customer.invoice_settings &&
      customer.invoice_settings.default_payment_method
    ) {
      return new Response(
        JSON.stringify({
          message: '이미 기본 결제 수단이 설정되어 있어 업데이트하지 않습니다.',
        }),
        { status: 200 }
      );
    }

    // 5. 기본 결제 수단이 없을 경우, 해당 paymentMethodId를 기본 결제 수단으로 설정하도록 고객 정보를 업데이트합니다.
    const updatedCustomer = await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // 6. 업데이트된 고객 정보를 JSON 형태로 응답합니다.
    return new Response(JSON.stringify({ updatedCustomer }), { status: 200 });
  } catch (error) {
    // 7. 처리 중 오류가 발생하면, 500 상태 코드와 함께 오류 메시지를 반환합니다.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
