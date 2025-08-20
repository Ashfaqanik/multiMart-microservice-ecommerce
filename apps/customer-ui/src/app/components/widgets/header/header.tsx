"use client";
import Link from "next/link";
import React from "react";
import { Search } from "lucide-react";
import ProfileIcon from "../../../../assets/svg/profile-icon";
import HeartIcon from "apps/customer-ui/src/assets/svg/heart-icon";
import Image from "next/image";
import CartIcon from "apps/customer-ui/src/assets/svg/cart-icon";
import HeaderBottom from "./header-bottom";
import useUser from "../../../hooks/useUser";

const header = () => {
  // Simulating login state — replace this with actual authentication state
  const { user, isLoading } = useUser();

  return (
    <div className="w-full bg-white shadow-transparent">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div>
          <Link href="/">
            <Image
              src="/logo.png"
              alt="MultiMart Logo"
              width={180}
              height={20}
            />
          </Link>
        </div>

        {/* Search */}
        <div className="w-[50%] relative">
          <input
            type="text"
            placeholder="Search products.."
            className="w-full h-10 font-Montserrat px-4 border border-green-400 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="w-[50px] cursor-pointer flex items-center justify-center h-10 bg-green-300 absolute top-0 right-0">
            <Search color="#fff" />
          </div>
        </div>

        {/* Icons / Profile Section */}
        <div className="flex items-center gap-8 mr-6">
          {/* Wishlist */}
          <div className="flex items-center ml-6 gap-2">
            <Link href="/wishlist" className="relative">
              <HeartIcon width={30} height={30} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                3
              </span>
            </Link>
          </div>

          {/* Cart */}
          <Link href="/cart" className="relative mt-1">
            <CartIcon width={35} height={35} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
              5
            </span>
          </Link>

          {/* Profile or Sign Up */}
          {!isLoading && user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <ProfileIcon width={32} height={32} />
              </Link>
              <div>
                <span className="block font-medium">Hello</span>
                <span className="font-semibold">
                  {user?.name?.split(" ")[0]}
                </span>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-green-400 hover:bg-green-600 text-white rounded-md font-semibold transition"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Bottom border */}
      <div className="border-b border-b-green-100" />

      {/* Header Bottom */}
      <HeaderBottom />
    </div>
  );
};

export default header;
