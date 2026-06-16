import DodoPayments from "dodopayments";

const dodoClient = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
  environment: process.env.DODO_ENVIRONMENT || 'test_mode',
});

export default dodoClient;