import DodoPayments from "dodopayments";

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: process.env.NODE_ENV === 'production' ? 'live_mode' : 'test_mode',
});

export default dodoClient;