import { validationError } from "../../../../packages/error-handler";
import crypto from "crypto";
import redis from "../../../../packages/libs/redis";
import { sendEmail } from "./sendEmail";
import { Request, Response, NextFunction } from "express";
import prisma from "../../../../packages/libs/prisma";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;

  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new validationError(`Missing required fields`);
  }
  if (!emailRegex.test(email)) {
    throw new validationError(`Invalid email format`);
  }
};

export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
) => {
  if (await redis.get(`otp_lock:${email}`)) {
    return next(
      new validationError(
        `Account locked due to too many attempts! Try again after 30 minutes`
      )
    );
  }
  if (await redis.get(`otp_spam_lock:${email}`)) {
    return next(
      new validationError(
        `Too many requests! Try again after 1 hour before requesting another OTP`
      )
    );
  }
  if (await redis.get(`otp_cooldown:${email}`)) {
    return next(
      new validationError(
        `Please wait for 1 minute before requesting another OTP`
      )
    );
  }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  const otpRequestKey = `otp_request_count:${email}`;
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");

  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); //Lock for 1 hour
    return next(
      new validationError(`Too many requests! Try again after 1 hour`)
    );
  }
  await redis.set(otpRequestKey, otpRequests + 1, "EX", 60); //Increment request count and set expiration to 1 minute
};

export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, "Verify Your Email", template, { name, otp });
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60);
};

export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (!storedOtp) {
    return next(new validationError("OTP expired or not found", 400));
  }

  const failedAttempts = parseInt(
    (await redis.get(`otp_failed_attempts:${email}`)) || "0"
  );

  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); // Lock for 30 min
      await redis.del(`otp_failed_attempts:${email}`);
      throw new validationError(
        "Account locked due to too many attempts! Try again after 30 minutes",
        403
      );
    }

    await redis.set(
      `otp_failed_attempts:${email}`,
      failedAttempts + 1,
      "EX",
      300
    ); // 5 min expiration
    throw new validationError(
      `Incorrect OTP. ${2 - failedAttempts} attempts left`,
      400
    );
  }

  // If OTP matches, clear related Redis keys
  await redis.del(`otp:${email}`);
  await redis.del(`otp_cooldown:${email}`);
  await redis.del(`otp_request_count:${email}`);
  await redis.del(`otp_lock:${email}`);
  await redis.del(`otp_spam_lock:${email}`);
  await redis.del(`otp_failed_attempts:${email}`);
  return true;
};

export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new validationError("Email is required", 400);
    }

    const user =
      userType === "user" &&
      (await prisma.users.findUnique({ where: { email } }));
    if (!user) {
      throw new validationError(`${userType} not found`, 404);
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(user.name, email, "forgot-password-user-mail");

    res.status(200).json({
      message: "OTP sent to email successfully. Please verify your account",
    });
  } catch (error) {
    next(error);
  }
};
export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return next(new validationError("Email and OTP are required", 400));
    }

    await verifyOtp(email, otp, next);

    res.status(200).json({
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (error) {
    next(error);
  }
};
