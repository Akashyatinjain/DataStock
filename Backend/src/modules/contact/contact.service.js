import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendContactMail = async ({
  name,
  email,
  message,
}) => {
  const response = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.SUPPORT_EMAIL,
    subject: `New Support Request - ${name}`,
    html: `
      <h2>New Contact Request</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>

      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  });

  return response;
};