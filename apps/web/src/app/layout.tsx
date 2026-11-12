import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from "react";
import { cookies } from "next/headers";
import { AUTH_STORAGE_KEY, REFRESH_STORAGE_KEY } from "../lib/auth.client";
import { AuthProvider } from "../context/AuthContext";
import { UserDataProvider } from "../context/UserDataContext";
import IntroAnimation from "../components/IntroAnimation";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});
const rubikMarkerHatch = localFont({
  src: "../fonts/RubikMarkerHatch-Regular.ttf",
  variable: "--font-rubik-marker",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Kino+ | Stream Free Movies & TV Shows",
  description:
    "Cross-platform entertainment platform with Free Movies and TV Shows",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicon_io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  manifest: "/favicon_io/site.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(AUTH_STORAGE_KEY)?.value ||
    cookieStore.get(REFRESH_STORAGE_KEY)?.value ||
    null;

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon_io/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon_io/favicon-16x16.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon_io/apple-touch-icon.png"
        />
        <link rel="manifest" href="/favicon_io/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rubikMarkerHatch.variable} antialiased min-h-screen bg-[#0e1013] text-[#f1f5f9] selection:bg-[#f2545b] selection:text-white`}
      >
        <AuthProvider initialToken={token}>
          <UserDataProvider>
            <IntroAnimation />
            {children}
          </UserDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
