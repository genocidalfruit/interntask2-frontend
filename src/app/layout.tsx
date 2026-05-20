import type { Metadata, Viewport } from "next";
import { Ubuntu_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme";
import { PermissionProvider } from "@/lib/permissions";
import { ThemedToaster } from "@/components/ui/themed-toaster";

const ubuntuMono = Ubuntu_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Assets & Tickets",
  description: "Asset & Service Ticket Management System",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${ubuntuMono.variable} font-mono min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie.replace(/(?:(?:^|.*;)\\s*theme\\s*=\\s*([^;]*).*$)|^.*$/, "$1");
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <PermissionProvider>
            {children}
          <ThemedToaster />
          </PermissionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
