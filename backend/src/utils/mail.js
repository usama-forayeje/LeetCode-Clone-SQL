import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import { ApiError } from "./api-errors.js";

export const sendMail = async (options) => {
  var mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Task Manager",
      link: "https://mailgen.js/",
      // Optional product logo
      // logo: 'https://mailgen.js/img/logo.png'
    },
  });
  var emailText = mailGenerator.generatePlaintext(options.mailgenContent);
  var emailHtml = mailGenerator.generate(options.mailgenContent);

  const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAILTRAP_SENDER_ADDRESS, // sender address
    to: options.email, // list of receivers
    subject: options.subject, // Subject line
    text: emailText, // plain text body
    html: emailHtml, // html body
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ApiError(500, "Email not sent");
  }
};

export const verificationMailGenContent = async (username, verificationUrl) => {
  return {
    body: {
      name: username,
      intro: "Welcome to Task Manager! We're very excited to have you on board.",
      action: {
        instruction: "Please verify your email address to get started.",
        button: {
          color: "#22BC66",
          text: "Verify your email",
          link: verificationUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export const forgotPasswordMailGenContent = async (username, passwordResetUrl) => {
  return {
    body: {
      name: username,
      intro: "We got a request to reset your password",
      action: {
        instruction: "Please click the button below to rest your password.",
        button: {
          color: "#22BC66",
          text: "Reset your password",
          link: passwordResetUrl,
        },
      },
      outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
    },
  };
};

export const twoFactorAuthMailGenContent = async (username, otp) => {
  return {
    body: {
      name: username,
      intro: "We received a request to verify your identity via OTP.",
      action: {
        instruction: `Your OTP is:`,
        button: {
          color: "#22BC66",
          text: `${otp}`,  // Display OTP in the button itself
          link: "#", // OTP verification URL if needed
        },
      },
      outro: `This OTP will expire in 5 minutes. If you did not request this, please ignore this message.`,
      table: {
        data: [
          {
            OTP: `<strong style="font-size: 24px; color: #ff6b6b;">${otp}</strong>`, // Highlight OTP in big, bold, red color
          },
        ],
      },
      signature: "If you need assistance, feel free to reply to this email. We're happy to help.",
    },
  };
};

