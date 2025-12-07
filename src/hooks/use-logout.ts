"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function logout() {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to log out.");
      }
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Unable to log out. Try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return { logout, isLoggingOut };
}

