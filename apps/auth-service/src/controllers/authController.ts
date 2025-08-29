import { NextFunction, Request, Response } from "express";
import {
  handleForgotPassword,
  verifyForgotPasswordOtp,
} from "../utils/authHelper";
import {
  checkOtpRestrictions,
  sendOtp,
  trackOtpRequests,
  validateRegistrationData,
  verifyOtp,
} from "../utils/authHelper";
import prisma from "../../../../packages/libs/prisma";
import { AuthError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-08-27.basil",
});

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
      return next(new ValidationError("User already exists", 400));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-mail"); // Send OTP

    res.status(200).json({
      message: "OTP sent to email successfully. Please verify your email",
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;

    if (!email || !otp || !password || !name) {
      return next(new ValidationError("Missing required fields", 400));
    }

    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists!", 404));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Email and password are required", 400));
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new AuthError("User not found"));
    }

    if (!user.password) {
      return next(new ValidationError("Invalid password", 401));
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AuthError("Invalid password"));
    }

    // Access token always short-lived
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    // Refresh token expiry depends on rememberMe
    const refreshExpiry = rememberMe ? "30d" : "1d";
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: refreshExpiry }
    );

    // Set cookies with correct expiry
    setCookie(res, "access-token", accessToken, {
      maxAge: 15 * 60 * 1000,
    });

    setCookie(res, "refresh-token", refreshToken, {
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

//Refresh user token
export const refreshUserToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return new ValidationError(
        "UnAuthorized! No refresh token provided",
        401
      );
    }
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

    if (!decoded || !decoded.id || !decoded.role) {
      return new JsonWebTokenError("Invalid refresh token");
    }

    const user = await prisma.users.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return new AuthError("User not found");
    }
    const newAccessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );
    setCookie(res, "accessToken", newAccessToken);
    res.status(201).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthError("Invalid refresh token"));
    }
    next(error);
  }
};

// Get logged-in user details
export const getLoggedInUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

export const verifyOtpForForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return next(new ValidationError("Missing required fields", 400));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new ValidationError("User not found", 404));
    }

    if (user.password && (await bcrypt.compare(newPassword, user.password))) {
      return next(
        new ValidationError(
          "New password cannot be the same as old password",
          400
        )
      );
    }

    if (newPassword.length < 6) {
      return next(
        new ValidationError("Password must be at least 6 characters long", 400)
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

//Register a new seller
export const sellerRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegistrationData(req.body, "seller"); // Validating the registration data
    const { name, email, phone, country } = req.body;

    // Checking if the email already exists
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return next(new ValidationError("Seller already exists", 400));
    }
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "seller-activation-mail"); // Send OTP

    res.status(200).json({
      message: "OTP sent to email successfully. Please verify your email",
    });
  } catch (error) {
    res.status(500).json({ message: "Error registering seller", error });
  }
};
//Verify seller with OTP
export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone, country } = req.body;

    if (!email || !otp || !password || !name || !phone || !country) {
      return next(new ValidationError("Missing required fields", 400));
    }

    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return next(new ValidationError("Seller already exists!", 404));
    }

    await verifyOtp(email, otp, next);

    const hashedPassword = await bcrypt.hash(password, 10);

    const seller = await prisma.sellers.create({
      data: { name, email, password: hashedPassword, phone, country },
    });

    res.status(201).json({
      seller,
      message: "Seller registered successfully",
    });
  } catch (error) {
    next(error);
  }
};
//Create a new shop for the seller
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, category, sellerId, address, opening_hours, website } =
      req.body;

    if (!name || !category || !sellerId || !bio || !opening_hours || !address) {
      return next(new ValidationError("Missing required fields", 400));
    }
    const shopData: any = {
      name,
      bio,
      category,
      sellerId,
      opening_hours,
      address,
    };
    if (website && website.trim() !== "") {
      shopData.website = website;
    }

    const newShop = await prisma.shops.create({
      data: shopData,
    });

    res.status(201).json({
      success: true,
      message: "Shop created successfully",
      shop: newShop,
    });
  } catch (error) {
    next(error);
  }
};
//Create stripe connection for the seller
export const createStripeConnection = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;

    if (!sellerId) {
      return next(new ValidationError("Missing seller ID", 400));
    }
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
    });
    if (!seller) {
      return next(new ValidationError("Seller not found", 404));
    }

    // Create a Stripe account for the seller
    const account = await stripe.accounts.create({
      type: "express",
      email: seller.email,
      country: "AU",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    await prisma.sellers.update({
      where: { id: sellerId },
      data: { stripId: account.id },
    });
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:4200/success`,
      return_url: `http://localhost:4200/success`,
      type: "account_onboarding",
    });

    res.status(200).json({
      url: accountLink.url,
    });
  } catch (error) {
    next(error);
  }
};

// Login Seller
export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ValidationError("Missing required fields", 400));
    }

    const seller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (!seller) {
      return next(new ValidationError("Seller not found", 404));
    }

    const isValidPassword = await bcrypt.compare(password, seller.password);
    if (!isValidPassword) {
      return next(new ValidationError("Invalid password", 401));
    }

    //Generate access token and refresh token
    const token = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    //store refresh token and access token
    setCookie(res, "seller-refresh-token", refreshToken);
    setCookie(res, "seller-access-token", token);

    res.status(200).json({
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        country: seller.country,
      },
      token,
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

//Get logged in seller
export const getLoggedInSeller = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = req.seller;

    res.status(200).json({
      success: true,
      seller,
    });
  } catch (error) {
    next(error);
  }
};
