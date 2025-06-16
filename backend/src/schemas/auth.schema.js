// src/schemas/auth.schema.js
import { z } from "zod";

// Password regexes for strong password validation
const passwordStrengthRegexes = {
  lowercase: /[a-z]/,
  number: /[0-9]/,
};

export const signUpSchema = z
  .object({
    fullname: z.string().min(2, { message: "Full name must be at least 2 characters." }).trim(),
    email: z.string().email({ message: "Please enter a valid email address." }).trim().toLowerCase(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(passwordStrengthRegexes.lowercase, { message: "Password must contain at least one lowercase letter." })
      .regex(passwordStrengthRegexes.number, { message: "Password must contain at least one number." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Password is required." }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }).trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." })
      .regex(passwordStrengthRegexes.lowercase, { message: "Password must contain at least one lowercase letter." })
      .regex(passwordStrengthRegexes.number, { message: "Password must contain at least one number." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, { message: "Old password is required." }),
    newPassword: z
      .string()
      .min(8, { message: "New password must be at least 8 characters." })
      .regex(passwordStrengthRegexes.lowercase, { message: "New password must contain at least one lowercase letter." })
      .regex(passwordStrengthRegexes.uppercase, { message: "New password must contain at least one uppercase letter." })
      .regex(passwordStrengthRegexes.number, { message: "New password must contain at least one number." })
      .regex(passwordStrengthRegexes.specialChar, { message: "New password must contain at least one special character." }),
    confirmNewPassword: z.string(), // Added for client-side confirmation
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: "New password must be different from the old one.",
    path: ["newPassword"],
  });

export const googleAuthSchema = z.object({
  token: z.string().min(1, { message: "Google ID token is required." }),
});