import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const creepster = localFont({
  src: "../../public/fonts/Creepster-Regular.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-creepster",
});

const inter = localFont({
  src: "../../public/fonts/Inter-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Story Scroll Horror",
  description: "Scroll through a horror story and star in it. Your camera never leaves your browser.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${creepster.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
