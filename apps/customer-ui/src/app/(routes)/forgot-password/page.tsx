"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

type FormData = {
  email: string;
  password: string;
};

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Timer for resend OTP
  const startResendTimer = () => {
    setCanResend(false);
    let countdown = 60;
    const interval = setInterval(() => {
      if (countdown <= 0) {
        clearInterval(interval);
        setCanResend(true);
      } else {
        setTimer(countdown);
        countdown -= 1;
      }
    }, 1000);
  };

  // Step 1 - Request OTP
  const requestOtpMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/forgot-password-user`,
        { email }
      );
      return response.data;
    },
    onSuccess: (_, { email }) => {
      setUserEmail(email);
      setStep("otp");
      setServerError(null);
      startResendTimer();
      setCanResend(false);
      setOtp(["", "", "", ""]);
    },
    onError: (error: AxiosError) => {
      if (error.response) {
        const data = error.response.data;
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? (data as { message?: string }).message
            : undefined;
        setServerError(message || "An error occurred. Please try again.");
      } else {
        setServerError("An error occurred. Please try again.");
      }
    },
  });

  // Step 2 - Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-forgot-password-otp`,
        {
          email: userEmail,
          otp: otp.join(""),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setStep("reset");
      setServerError(null);
    },
    onError: (error: AxiosError) => {
      if (error.response) {
        const data = error.response.data;
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? (data as { message?: string }).message
            : undefined;
        setServerError(message || "OTP verification failed. Please try again.");
      } else {
        setServerError("OTP verification failed. Please try again.");
      }
    },
  });

  // Step 3 - Reset Password
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!userEmail) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/reset-password-user`,
        {
          email: userEmail,
          newPassword: password,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      toast.success("Password reset successfully. Please login.");
      router.push("/login");
    },
    onError: (error: AxiosError) => {
      if (error.response) {
        const data = error.response.data;
        const message =
          typeof data === "object" && data !== null && "message" in data
            ? (data as { message?: string }).message
            : undefined;
        setServerError(message || "Password reset failed. Please try again.");
      } else {
        setServerError("Password reset failed. Please try again.");
      }
    },
  });

  // Resend OTP
  const resendOtp = () => {
    if (userEmail) {
      requestOtpMutation.mutate({ email: userEmail });
      startResendTimer();
    }
  };

  const onSubmitEmail = async (data: FormData) => {
    requestOtpMutation.mutate(data);
  };

  const onSubmitPassword = async (data: FormData) => {
    resetPasswordMutation.mutate({ password: data.password });
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1] flex items-center justify-center">
      {/* Step 1 - Email */}
      {step === "email" && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-green-950 text-center">
            Reset Password
          </h1>
          <p className="text-center text-sm text-gray-500 mt-4">
            To create a new password, please enter your email address and we'll
            email you an otp in a few minutes.
          </p>

          <form
            onSubmit={handleSubmit(onSubmitEmail)}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
                className={`w-full border rounded-md px-4 py-2 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={requestOtpMutation.isPending}
              className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              {requestOtpMutation.isPending ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
          {serverError && (
            <p className=" text-red-600 text-sm px-1 rounded mt-2">
              {serverError}
            </p>
          )}
          <p className="text-center text-sm text-gray-600 mt-3">
            Or back to?{" "}
            <a
              href="/login"
              className="text-green-600 font-medium hover:underline"
            >
              Login
            </a>
          </p>
        </div>
      )}

      {/* Step 2 - OTP */}
      {step === "otp" && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl text-center font-semibold text-green-950 mb-4">
            Verify Your Email
          </h2>
          <p className="text-sm text-center text-gray-600 mb-4">
            We have sent a verification code to your email. Please enter it
            below.
          </p>
          <div className="flex gap-2 mb-4 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    const newOtp = [...otp];
                    newOtp[index] = value;
                    setOtp(newOtp);
                    if (value && index < otp.length - 1) {
                      inputRefs.current[index + 1]?.focus();
                    }
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("Text").trim();
                  if (/^\d+$/.test(pasted) && pasted.length === otp.length) {
                    const newOtp = pasted.split("");
                    setOtp(newOtp);
                    newOtp.forEach((val, i) => {
                      if (inputRefs.current[i]) {
                        inputRefs.current[i]!.value = val;
                      }
                    });
                    inputRefs.current[otp.length - 1]?.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !digit && index > 0) {
                    const newOtp = [...otp];
                    newOtp[index - 1] = "";
                    setOtp(newOtp);
                    inputRefs.current[index - 1]?.focus();
                  } else if (e.key === "ArrowRight" && index < otp.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  } else if (e.key === "ArrowLeft" && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                autoFocus={index === 0}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                className="w-12 h-12 border rounded-md text-center text-lg bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            ))}
          </div>
          <button
            type="button"
            className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
            disabled={verifyOtpMutation.isPending}
            onClick={() => verifyOtpMutation.mutate()}
          >
            {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
          </button>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={resendOtp}
              disabled={!canResend}
              className={`text-sm text-green-600 hover:underline ${
                !canResend ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              Resend OTP
            </button>
            {!canResend && (
              <span className="text-sm text-gray-500">Resend in {timer}s</span>
            )}
          </div>
          {serverError && (
            <p className="text-red-500 text-sm mt-2 text-center">
              {serverError}
            </p>
          )}
        </div>
      )}

      {/* Step 3 - Reset Password */}
      {step === "reset" && (
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-green-950 text-center mb-4">
            Enter Your New Password
          </h1>
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className={`w-full border rounded-md px-4 py-2 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your new password"
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={resetPasswordMutation.isPending}
              className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              {resetPasswordMutation.isPending
                ? "Resetting Password..."
                : "Reset Password"}
            </button>
            {serverError && (
              <p className="text-red-500 text-sm mt-2">{serverError}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
