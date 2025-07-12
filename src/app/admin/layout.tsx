"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Always allow /admin/login to render immediately
    if (pathname === "/admin/login") {
      setChecked(true);
      return;
    }
    // For other admin pages, check login
    const loggedIn = typeof window !== "undefined" && localStorage.getItem("admin_logged_in") === "true";
    if (!loggedIn) {
      router.replace("/admin/login");
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  // Always render login page immediately
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }
  // For other admin pages, only render after check
  if (!checked) return null;
  return (
    <>{children}</>
  );
} 