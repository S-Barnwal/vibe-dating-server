import { Resend } from "resend";

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing from environment variables"
    );
  }

  return new Resend(apiKey);
};

const getFromEmail = () => {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Vibe <onboarding@resend.dev>"
  );
};


// =====================================================
// PASSWORD RESET OTP EMAIL
// =====================================================

export const sendPasswordResetOtp = async ({
  email,
  otp,
}) => {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Your Vibe password reset code",

    text: `Your Vibe password reset code is ${otp}. This code expires in 10 minutes.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 520px;
        margin: auto;
        padding: 32px;
      ">
        <h1 style="color: #6D3DF5;">
          Vibe 💜
        </h1>

        <h2>Password Reset</h2>

        <p>
          We received a request to reset your Vibe password.
        </p>

        <p>
          Your verification code is:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          background: #FFF9F5;
          color: #6D3DF5;
          text-align: center;
          border-radius: 12px;
        ">
          ${otp}
        </div>

        <p>
          This code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you didn't request a password reset,
          you can safely ignore this email.
        </p>

        <p style="color: #716D78;">
          — Team Vibe
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Password reset email error:", error);
    throw new Error(error.message || "Unable to send password reset email");
  }

  return data;
};


// =====================================================
// EMAIL VERIFICATION OTP
// =====================================================

export const sendEmailVerificationOtp = async ({
  email,
  otp,
}) => {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Verify your Vibe email 💜",

    text: `Your Vibe email verification code is ${otp}. This code expires in 10 minutes.`,

    html: `
      <div style="
        font-family: Arial, sans-serif;
        max-width: 520px;
        margin: auto;
        padding: 32px;
        color: #17151C;
      ">
        <h1 style="color: #6D3DF5;">
          Vibe 💜
        </h1>

        <h2>Verify your email</h2>

        <p>
          Welcome to Vibe!
        </p>

        <p>
          Please use the verification code below
          to verify your email address.
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          letter-spacing: 8px;
          padding: 20px;
          margin: 24px 0;
          background: #FFF9F5;
          color: #6D3DF5;
          text-align: center;
          border-radius: 12px;
        ">
          ${otp}
        </div>

        <p>
          This verification code will expire in
          <strong>10 minutes</strong>.
        </p>

        <p>
          If you didn't create a Vibe account,
          you can safely ignore this email.
        </p>

        <p style="color: #716D78;">
          — Team Vibe
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Email verification error:", error);
    throw new Error(error.message || "Unable to send verification email");
  }

  return data;
};