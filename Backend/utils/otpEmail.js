export const otpEmail = ({ otp }) => {
  return `
  <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
    <div style="max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:10px;">

      <h2 style="color:#2563eb;">🔐 Password Reset OTP</h2>

      <p>You requested to reset your password.</p>

      <h1 style="letter-spacing:5px;color:#111;">
        ${otp}
      </h1>

      <p>This OTP will expire in 15 minutes.</p>

      <hr/>

      <small style="color:#888;">
        HelpyFy Security System
      </small>

    </div>
  </div>
  `;
};