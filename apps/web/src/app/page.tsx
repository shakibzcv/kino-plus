import React from "react";
import { cookies } from "next/headers";
import { AUTH_STORAGE_KEY, REFRESH_STORAGE_KEY } from "../lib/auth.client";
import HomeClient from "../components/HomeClient";

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 🌟 Home Page Server Component
 * Inspects session cookies and OAuth query tokens
 * to determine the initial SSR view, then hands off to HomeClient.
 */
export default async function Home({ searchParams }: HomePageProps) {
  const cookieStore = await cookies();
  const resolvedParams = searchParams ? await searchParams : {};
  const tokenFromQuery =
    typeof resolvedParams?.token === "string"
      ? resolvedParams.token
      : undefined;
  const refreshTokenFromQuery =
    typeof resolvedParams?.refreshToken === "string"
      ? resolvedParams.refreshToken
      : undefined;

  const authToken =
    cookieStore.get(AUTH_STORAGE_KEY)?.value ||
    cookieStore.get(REFRESH_STORAGE_KEY)?.value ||
    tokenFromQuery ||
    refreshTokenFromQuery;

  const isAuthenticated = Boolean(authToken && authToken.trim().length > 0);

  return <HomeClient initialAuthenticated={isAuthenticated} />;
}
