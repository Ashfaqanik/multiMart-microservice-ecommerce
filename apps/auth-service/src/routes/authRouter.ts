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
} from "../controllers/authController";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-user-token", refreshUserToken);
router.get("/logged-in-user", isAuthenticated, getLoggedInUser);
// Password reset routes
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-otp", verifyOtpForForgotPassword);

export default router;
