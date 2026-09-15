import nodemailer from "nodemailer";

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing from environment variables"
    );
  }

  return nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};


// =====================================================
// PASSWORD RESET OTP EMAIL
// =====================================================

export const sendPasswordResetOtp = async ({
  email,
  otp,
}) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Vibe" <${process.env.EMAIL_USER}>`,
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
};


// =====================================================
// EMAIL VERIFICATION OTP
// =====================================================

export const sendEmailVerificationOtp = async ({
  email,
  otp,
}) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: `"Vibe" <${process.env.EMAIL_USER}>`,
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
};