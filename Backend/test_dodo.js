import 'dotenv/config';
import DodoPayments from 'dodopayments';

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: 'live_mode'
});

async function test() {
  try {
    const checkout = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PRO_PRODUCT_ID,
          quantity: 1,
        },
      ],
      payment_link: true,
      success_url: `http://localhost:5173/payment-success?plan=PRO`,
      metadata: {
        userId: 'test_user_id',
        plan: 'PRO',
      },
    });
    console.log("Success:", checkout);
  } catch (err) {
    console.error("Error:", err.message);
    if (err.response) console.error("Response:", err.response.data);
  }
}

test();
