import express, { Router } from "express";
import {
  forgotPassword,
  loginUser,
  resetUserPassword,
  userRegistration,
  verifyUser,
} from "../controllers/authController";
import { verifyForgotPasswordOtp } from "../utils/authHelper";

const router: Router = express.Router();

router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/forgot-password-user", forgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);

export default router;
