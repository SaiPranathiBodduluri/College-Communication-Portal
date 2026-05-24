const bcrypt = require('bcrypt');

function generateNumericOTP(length = 6) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) otp += digits[Math.floor(Math.random() * 10)];
  return otp;
}

async function hashOTP(otp) {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
}

async function verifyHashedOTP(otp, hash) {
  return bcrypt.compare(otp, hash);
}

module.exports = { generateNumericOTP, hashOTP, verifyHashedOTP };
