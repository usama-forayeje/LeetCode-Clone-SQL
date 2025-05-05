import crypto from "crypto";
import jwt from "jsonwebtoken";

export const generateResetToken = () => {
  const unHashedToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  return { unHashedToken, hashedToken, tokenExpiry };
};

export const generateEmailToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
