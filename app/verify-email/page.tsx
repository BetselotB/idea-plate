'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyEmailPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await user.reload();
      if (user.emailVerified) {
        router.replace("/dashboard");
      }
    }, 2000); // check every 2 seconds
    return () => clearInterval(interval);
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Verify your email</h1>
        <p className="text-gray-600 mb-2">Please check your inbox AND SPAM FOLDER!! and click the verification link.</p>
        <p className="text-gray-500">This page will redirect you to your dashboard once your email is verified.</p>
      </div>
    </div>
  );
} 