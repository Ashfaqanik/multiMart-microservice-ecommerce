"use client";
import { AlignLeft, ChevronDown } from "lucide-react";
import React from "react";
import { navItems } from "../../../config/constants";
import Link from "next/link";
import ProfileIcon from "apps/customer-ui/src/assets/svg/profile-icon";
import CartIcon from "apps/customer-ui/src/assets/svg/cart-icon";
import HeartIcon from "apps/customer-ui/src/assets/svg/heart-icon";
import useUser from "../../../hooks/useUser";

const HeaderBottom = () => {
  const [show, setShow] = React.useState(false);
  const [isSticky, setIsSticky] = React.useState(false);
  const { user, isLoading } = useUser();

  //Tracking scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky ? "fixed top-0 left-0 z-[100] bg-white shadow-lg" : "relative"
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? "pt-3" : "py-0"
        } `}
      >
        {/* All Dropdown items */}
        <div
          className={`w-[210px] sm:w-[230px] md:w-[250px] lg:w-[260px] ${
            isSticky && "-mb-2"
          } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-green-300`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-semibold">All Departments</span>
          </div>
          <ChevronDown color="white" />
        </div>

        {/* Dropdown menu */}
        {show && (
          <div
            className={`absolute ${
              isSticky ? "top-[70px]" : "top-[50px]"
            } left-0 w-[210px] sm:w-[230px] md:w-[250px] lg:w-[260px] bg-white shadow-lg z-10`}
          >
            <ul>
              <li className="py-2 px-2 hover:bg-slate-100 cursor-pointer">
                Electronics
              </li>
              <li className="py-2 px-2 hover:bg-slate-100 cursor-pointer">
                Fashion
              </li>
              <li className="py-2 px-2 hover:bg-slate-100 cursor-pointer">
                Home & Kitchen
              </li>
              <li className="py-2 px-2 hover:bg-slate-100 cursor-pointer">
                Sports & Outdoors
              </li>
              <li className="py-2 px-2 hover:bg-slate-100 cursor-pointer">
                Health & Beauty
              </li>
            </ul>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {navItems.map((i: NavItemsTypes, index: number) => (
            <Link
              key={index}
              href={i.href}
              className="text-green-950 hover:text-green-500 font-medium"
            >
              {i.title}
            </Link>
          ))}
        </div>
        <div>
          {isSticky && (
            <div className="flex items-center gap-8 mr-6 mb-3">
              <div className="flex items-center ml-6 gap-2">
                <Link href="/wishlist" className="relative">
                  <HeartIcon width={30} height={30} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                    3
                  </span>
                </Link>
              </div>
              <Link href="/cart" className="relative mt-1">
                <CartIcon width={35} height={35} />

                {/* Cart badge count */}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full">
                  5
                </span>
              </Link>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
