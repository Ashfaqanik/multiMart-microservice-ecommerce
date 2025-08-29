import express, { Router } from "express";
import {
  forgotPassword,
  loginUser,
  refreshUserToken,
  resetUserPassword,
  userRegistration,
  verifyUser,
  verifyOtpForForgotPassword,
  getLoggedInUser,
  sellerRegistration,
  verifySeller,
  createShop,
  getLoggedInSeller,
  createStripeConnection,
  loginSeller,
} from "../controllers/authController";
import isAuthenticated from "@packages/middleware/isAuthenticated";
import { isSeller, isUser } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-user-token", refreshUserToken);
router.get("/logged-in-user", isAuthenticated, isUser, getLoggedInUser);
// Password reset routes
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-otp", verifyOtpForForgotPassword);
router.post("/seller-registration", sellerRegistration);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/connect-stripe", createStripeConnection);
router.post("/login-seller", loginSeller);
router.get("/logged-in-seller", isAuthenticated, isSeller, getLoggedInSeller);

export default router;
