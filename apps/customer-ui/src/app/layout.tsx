import Header from "./components/widgets/header/header";
import "./global.css";
import { Montserrat, Open_Sans } from "next/font/google";
import Providers from "./providers";

export const metadata = {
  title: "Welcome to MultiMart",
  description: "A comprehensive e-commerce platform",
};

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-heading",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  variable: "--font-body",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${openSans.variable}`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
