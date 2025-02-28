import CheckoutForm from '../../components/checkout';
import { stripe } from '../../lib/stripe';

export default async function CardRegistrationPage({ searchParams }) {
  const email = searchParams.email || 'test@example.com';

  // 이메일로 기존 고객을 검색합니다.
  const customers = await stripe.customers.search({
    query: `email:"${email}"`,
  });
  console.log('검색된 고객들:', customers.data);

  // 기존 고객이 있다면 첫 번째 고객을 사용하고, 없으면 새로 생성합니다.
  let customer;
  if (customers.data && customers.data.length > 0) {
    customer = customers.data[0];
  } else {
    customer = await stripe.customers.create({ email });
  }

  // 해당 고객에 대한 SetupIntent를 생성 (카드 등록용)
  const setupIntent = await stripe.setupIntents.create({
    customer: customer.id,
    usage: 'off_session',
  });
  console.log('SetupIntent:', setupIntent);
  console.log('사용할 고객:', customer);

  return (
    <div>
      <h1>카드 등록 페이지</h1>
      {/* 생성된 SetupIntent의 client_secret과 customer.id를 CheckoutForm에 전달 */}
      <CheckoutForm
        clientSecret={setupIntent.client_secret}
        customerId={customer.id}
      />
    </div>
  );
}
