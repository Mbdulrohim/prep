import type { Metadata } from "next";
import { Nunito } from "next/font/google"; // Using Nunito as requested
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "PREP - Professional Readiness Exam Platform",
  description:
    "The premier platform for professional nursing and midwifery exam preparation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
