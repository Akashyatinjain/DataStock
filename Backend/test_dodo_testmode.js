import 'dotenv/config';
import DodoPayments from 'dodopayments';

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: 'test_mode'
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
      return_url: `http://localhost:5173/payment-success?plan=PRO`,
      metadata: {
        userId: 'test_user_id',
        plan: 'PRO',
      },
    });
    console.log("Success with return_url & payment_link:", checkout);
  } catch (err) {
    console.error("Error with return_url & payment_link:", err.message);
  }

  try {
    const checkout = await dodoClient.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PRO_PRODUCT_ID,
          quantity: 1,
        },
      ],
      return_url: `http://localhost:5173/payment-success?plan=PRO`,
      metadata: {
        userId: 'test_user_id',
        plan: 'PRO',
      },
    });
    console.log("Success with return_url only:", checkout);
  } catch (err) {
    console.error("Error with return_url only:", err.message);
  }
}

test();
