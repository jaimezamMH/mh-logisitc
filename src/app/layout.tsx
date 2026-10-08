import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { esSoloLectura } from "@/lib/auth-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MH Logística",
  description: "Panel de operaciones de importación y transporte de Machinery Hunters",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const soloLectura = await esSoloLectura();
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex bg-background text-ink-primary overflow-hidden">
        <Sidebar soloLectura={soloLectura} />
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <MobileNav />
          {children}
        </div>
      </body>
    </html>
  );
}
