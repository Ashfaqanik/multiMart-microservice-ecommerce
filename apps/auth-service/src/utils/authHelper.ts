import { validationError } from "../../../../packages/error-handler";
import crypto from "crypto";
import redis from "../../../../packages/libs/redis";
import { sendEmail } from "./sendEmail";
import { NextFunction } from "express";
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
        `Account locked due to too many attempts! Try agin after 30 minutes`
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
