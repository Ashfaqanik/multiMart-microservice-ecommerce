import * as React from "react";

const HeartIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="#2b6033"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 21s-6.35-4.35-9.09-7.09C1.42 11.42 1 9.6 1 8.14 1 5.14 3.42 3 6.43 3c1.74 0 3.41 1 4.57 2.5C12.16 4 13.83 3 15.57 3 18.58 3 21 5.14 21 8.14c0 1.46-.42 3.28-1.91 5.77C18.35 16.65 12 21 12 21z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default HeartIcon;
