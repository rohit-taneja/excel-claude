"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Could not log out. Please try again.");
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Log out"
      disabled={pending}
      onClick={handleLogout}
    >
      {pending ? <Spinner label="Logging out" /> : <LogOut />}
    </Button>
  );
}
