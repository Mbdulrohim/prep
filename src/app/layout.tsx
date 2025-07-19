import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: {
    default: "PREP - Nigerian Nursing Exam Preparation Platform",
    template: "%s | PREP",
  },
  description:
    "Comprehensive exam preparation platform for Nigerian nursing students. Practice with 10,000+ questions, AI-powered explanations, and university rankings.",
  keywords:
    "nursing exam, Nigeria, NANNM, RN, RM, RPHN, exam preparation, medical education, nursing students",
  authors: [{ name: "PREP Team" }],
  creator: "PREP Platform",
  publisher: "PREP Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PREP - Nigerian Nursing Exam Preparation Platform",
    description:
      "Master your nursing exams with 10,000+ practice questions, AI-powered help, and comprehensive study tools designed for Nigerian nursing students.",
    url: "/",
    siteName: "PREP",
    images: [
      {
        url: "/image.png",
        width: 1200,
        height: 630,
        alt: "PREP - Nigerian Nursing Exam Preparation Platform",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PREP - Nigerian Nursing Exam Preparation Platform",
    description:
      "Master your nursing exams with 10,000+ practice questions and AI-powered study tools.",
    images: ["/image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "education",
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
        <Analytics />
      </body>
    </html>
  );
}
