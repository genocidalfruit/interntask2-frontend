"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";

export function ThemedToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-left"
      theme={theme}
      className="font-mono"
      toastOptions={{
        style: {
          fontFamily: "var(--font-mono), monospace",
          fontSize: "13px",
          backgroundColor:
            theme === "dark" ? "hsl(240 10% 3.9%)" : "hsl(40 10% 86%)",
          color: theme === "dark" ? "hsl(240 5% 88%)" : "hsl(240 10% 15%)",
          borderColor: theme === "dark" ? "hsl(240 4% 16%)" : "hsl(40 8% 68%)",
        },
        className: "font-mono",
        descriptionClassName: "font-mono opacity-80",
        classNames: {
          actionButton: "font-mono",
        },
      }}
      expand={false}
      visibleToasts={5}
    />
  );
}
