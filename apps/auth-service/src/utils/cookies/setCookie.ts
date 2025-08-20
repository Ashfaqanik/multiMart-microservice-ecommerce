import { Response, CookieOptions } from "express";

export const setCookie = (
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
) => {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    ...options,
  });
};
