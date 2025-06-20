
const otpGenerator = require('otp-generator')

//============= < GERERATE OTP >===================//
const generateOTP = () => {
    const otp = Number(otpGenerator.generate(5, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false, }));
    return otp;
}
module.exports = generateOTP;
