"use client";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import GoogleButton from "../../components/widgets/googleButton";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

type FormData = {
  name: string;

  email: string;
  password: string;
};

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const [canResend, setCanResend] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });
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
  const signUpMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/user-registration`,
        data
      );
      return response.data;
    },
    onSuccess: (_, formData) => {
      setUserData(formData);
      setShowOtp(true);
      setCanResend(false);
      setTimer(60);
      startResendTimer();
      inputRefs.current.forEach((ref) => {
        if (ref) ref.value = "";
      });
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
  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      if (!userData) return;
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SERVER_URI}/api/verify-user`,
        {
          ...userData,
          otp: otp.join(""),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push("/login");
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
  const resendOtp = () => {
    if (userData) {
      signUpMutation.mutate(userData);
      startResendTimer();
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      signUpMutation.mutate(data);
    } catch (error) {
      setServerError("Sign up failed. Please try again.");
    }
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-green-950 text-center">
          Sign Up
        </h1>
        <p className="text-center text-sm text-gray-500 mt-1">
          Sign up to create an account and start shopping
        </p>

        {serverError && (
          <p className="bg-red-100 text-red-600 text-sm px-3 py-2 rounded mt-4">
            {serverError}
          </p>
        )}

        {!showOtp ? (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1 ">Name</label>
              <input
                type="name"
                {...register("name", {
                  required: "Name is required",
                })}
                className={`w-full border rounded-md px-4 py-2 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1 ">Email</label>
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  className={`w-full border rounded-md px-4 py-2 pr-10 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2 text-sm text-gray-500"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={signUpMutation.isPending}
              className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
            >
              {signUpMutation.isPending ? "Signing Up..." : "Sign Up"}
            </button>
            {/* Divider with OR */}
            <div className="flex items-center my-4">
              <hr className="flex-grow border-gray-300" />
              <span className="px-3 text-gray-500 text-sm">Or</span>
              <hr className="flex-grow border-gray-300" />
            </div>
            {/* Google Button */}
            <GoogleButton />
            {serverError && (
              <p className="text-red-500 text-sm mt-2">{serverError} </p>
            )}
            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-600 font-medium hover:underline"
              >
                Login
              </a>
            </p>
          </form>
        ) : (
          <div>
            <h2 className="text-xl text-center font-semibold text-green-950 mb-4 mt-4">
              Verify Your Email
            </h2>
            <p className="text-sm text-center text-gray-600 mb-4">
              We have sent a verification code to your email. Please enter the
              code below to verify your account.
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
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !digit && index > 0) {
                      const newOtp = [...otp];
                      newOtp[index - 1] = "";
                      setOtp(newOtp);
                      inputRefs.current[index - 1]?.focus();
                    } else if (
                      e.key === "ArrowRight" &&
                      index < otp.length - 1
                    ) {
                      inputRefs.current[index + 1]?.focus();
                    } else if (e.key === "ArrowLeft" && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  autoFocus={index === 0}
                  placeholder=""
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className="w-10 h-10 border rounded-md text-center bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>
            <button
              type="button"
              className="w-full bg-green-500 text-white font-semibold py-2 rounded-md hover:bg-green-600 transition-colors"
              disabled={verifyOtpMutation.isPending}
              onClick={() => {
                verifyOtpMutation.mutate();
              }}
            >
              {verifyOtpMutation.isPending ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="flex items-center justify-center mt-4">
              <button
                onClick={() => {
                  resendOtp();
                  setCanResend(true);
                  setTimer(60);
                }}
                disabled={!canResend}
                className={`text-sm text-green-600 hover:underline ${
                  !canResend ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                Resend OTP
              </button>
              {canResend && (
                <span className="text-sm text-gray-500">
                  Resend available in {timer}s
                </span>
              )}
            </div>
            {serverError && (
              <p className="text-red-500 text-sm mt-2">{serverError} </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignUp;
