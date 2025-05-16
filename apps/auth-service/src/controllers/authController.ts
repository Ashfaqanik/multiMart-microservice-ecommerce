import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
} from "../utils/authHelper";
import prisma from "../../../../packages/libs/prisma";
import { validationError } from "../../../../packages/error-handler";

//Register user
export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "user"); // Validate the registration data
    const { name, email } = req.body;

    // Check if the email already exists
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new validationError("User already exists", 400));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(email, name, "user-activation-mail,"); // Send OTP

    res.status(200).json({
      message: "OTP sent to email successfully. Please verify your email",
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};
