import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import prisma from "@packages/libs/prisma";

const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies["access-token"] ||
      req.cookies["seller-access-token"] ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      id: string;
      role: "user" | "seller";
    };

    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({ message: "Invalid token" });
    }
    let account;

    if (decoded.role === "user") {
      account = await prisma.users.findUnique({
        where: { id: decoded.id },
      });

      req.user = account;
    } else if (decoded.role === "seller") {
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });

      req.seller = account;
    }
    if (!account) {
      return res.status(401).json({ message: "Account not found" });
    }
    req.role = decoded.role;
    return next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export default isAuthenticated;
