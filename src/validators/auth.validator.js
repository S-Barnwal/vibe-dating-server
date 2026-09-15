const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


// =====================================================
// SIGNUP VALIDATION
// =====================================================

export const validateSignup = ({
  name,
  email,
  password,
  confirmPassword,
}) => {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = "Name is required";
  } else if (name.trim().length < 2) {
    errors.name =
      "Name must be at least 2 characters";
  } else if (name.trim().length > 50) {
    errors.name =
      "Name cannot exceed 50 characters";
  }

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 6) {
    errors.password =
      "Password must be at least 6 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword =
      "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword =
      "Passwords do not match";
  }

  return errors;
};


// =====================================================
// LOGIN VALIDATION
// =====================================================

export const validateLogin = ({
  email,
  password,
}) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!password) {
    errors.password = "Password is required";
  }

  return errors;
};


// =====================================================
// CHANGE PASSWORD VALIDATION
// =====================================================

export const validateChangePassword = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword =
      "Current password is required";
  }

  if (!newPassword) {
    errors.newPassword =
      "New password is required";
  } else if (newPassword.length < 6) {
    errors.newPassword =
      "New password must be at least 6 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword =
      "Please confirm your new password";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword =
      "Passwords do not match";
  }

  if (
    currentPassword &&
    newPassword &&
    currentPassword === newPassword
  ) {
    errors.newPassword =
      "New password must be different from current password";
  }

  return errors;
};


// =====================================================
// FORGOT PASSWORD VALIDATION
// =====================================================

export const validateForgotPassword = ({
  email,
}) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  return errors;
};


// =====================================================
// VERIFY PASSWORD RESET OTP VALIDATION
// =====================================================

export const validateVerifyResetOtp = ({
  email,
  otp,
}) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!otp) {
    errors.otp = "OTP is required";
  } else if (!/^\d{6}$/.test(otp)) {
    errors.otp = "OTP must be 6 digits";
  }

  return errors;
};


// =====================================================
// VERIFY EMAIL OTP VALIDATION
// =====================================================

export const validateVerifyEmailOtp = ({
  email,
  otp,
}) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!otp) {
    errors.otp = "OTP is required";
  } else if (!/^\d{6}$/.test(otp)) {
    errors.otp = "OTP must be 6 digits";
  }

  return errors;
};


// =====================================================
// RESET PASSWORD VALIDATION
// =====================================================

export const validateResetPassword = ({
  email,
  newPassword,
  confirmPassword,
}) => {
  const errors = {};

  if (!email || !email.trim()) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email";
  }

  if (!newPassword) {
    errors.newPassword =
      "New password is required";
  } else if (newPassword.length < 6) {
    errors.newPassword =
      "New password must be at least 6 characters";
  }

  if (!confirmPassword) {
    errors.confirmPassword =
      "Please confirm your new password";
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword =
      "Passwords do not match";
  }

  return errors;
};