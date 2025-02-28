import Stripe from 'stripe';
import { stripe } from '../../../lib/stripe';

// DELETE 요청을 처리하는 API 엔드포인트
export async function DELETE(request) {
  // 1. 요청 URL에서 쿼리 파라미터를 파싱합니다.
  const { searchParams } = new URL(request.url);
  // 2. 'paymentMethodId' 파라미터 값을 추출합니다.
  const paymentMethodId = searchParams.get('paymentMethodId');

  // 3. paymentMethodId가 제공되지 않은 경우, 400 에러 응답을 반환합니다.
  if (!paymentMethodId) {
    return new Response(
      JSON.stringify({ error: 'Payment method ID is required.' }),
      { status: 400 }
    );
  }

  try {
    // 4. Stripe API를 사용하여 지정된 결제 수단을 detach 합니다.
    // detach를 수행하면, 해당 결제 수단이 고객과 연결된 상태에서 분리됩니다.
    const detachedPaymentMethod = await stripe.paymentMethods.detach(
      paymentMethodId
    );

    // 5. detach가 성공하면, 성공 메시지와 detach된 결제 수단 정보를 포함하여 응답합니다.
    return new Response(
      JSON.stringify({
        message: 'Payment method removed successfully.',
        detachedPaymentMethod,
      }),
      { status: 200 }
    );
  } catch (error) {
    // 6. 처리 중 오류가 발생하면, 500 에러와 함께 오류 메시지를 반환합니다.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
