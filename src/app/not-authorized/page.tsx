"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sun, Moon, ShieldOff } from "lucide-react";
import { useTheme } from "@/lib/theme";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function NotAuthorizedPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </Button>
      <div className="text-center space-y-6">
        <ShieldOff className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="text-3xl page-title">Not Authorized</h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          You do not have permission to access this page. Please contact your
          administrator if you believe this is an error.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              try {
                await fetch(`${API_URL}/api/v1/auth/logout`, {
                  method: "POST",
                  credentials: "include",
                });
              } catch {}
              router.push("/");
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
