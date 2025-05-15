import { AppError } from "./";
import { Request, Response } from "express";

export const errorMiddleware = (err: Error, req: Request, res: Response) => {
  // Check if the error is an instance of a specific error class
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url}: ${err.message}`);
    // Handle other types of errors
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  // Log the error details
  console.error("Error occurred:", err);

  return res.status(500).json({
    error: "Internal Server Error",
  });
};
