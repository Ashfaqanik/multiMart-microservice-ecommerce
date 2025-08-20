// components/icons/CartIcon.tsx
import * as React from "react";

const CartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2a5032"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6 6H4M6 6H20L19 13H7L6 6Z"
      stroke="#315e3d"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="9" cy="20" r="1" fill="#2e5638" />
    <circle cx="17" cy="20" r="1" fill="#2b5334" />
  </svg>
);
export default CartIcon;
