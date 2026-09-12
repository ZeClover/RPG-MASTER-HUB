import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { QueryProvider } from "@/components/providers/query-provider";
import { ConnectivityListener } from "@/components/providers/connectivity-listener";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RPG Master Hub",
    template: "%s · RPG Master Hub",
  },
  description: "O sistema operacional para campanhas de RPG de longa duração.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RPG Master Hub",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <TooltipProvider delayDuration={200}>
            <ConnectivityListener />
            <ServiceWorkerRegister />
            {children}
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
