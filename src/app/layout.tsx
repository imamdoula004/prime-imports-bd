import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ConditionalNavbar, ConditionalFooter, ConditionalCart, ConditionalWaitlist, ConditionalBottomNav, ConditionalLiveChat, ConditionalFilterSidebar } from "@/components/layout/FrontendWrappers";
import { OfferBanner } from "@/components/ui/OfferBanner";
import { MemberAuthProvider } from "@/context/MemberAuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prime Imports BD | Premium Global Snacks & Cosmetics",
  description: "Curated imported chocolates, premium snacks, global beverages, and luxury cosmetics directly to your door in Bangladesh.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 selection:bg-brand-blue-600/30 overflow-x-hidden`}>
        <MemberAuthProvider>
          <div className="flex-1 w-full mx-auto relative flex flex-col bg-white">
            <ConditionalNavbar />
            <div className="flex-1 pt-16 md:pt-20 pb-24 md:pb-0">
              <main className="flex-1">
                {children}
              </main>
            </div>
            <ConditionalFooter />
          </div>
          <ConditionalBottomNav />
          <ConditionalCart />
          <ConditionalWaitlist />
          <ConditionalLiveChat />
          <ConditionalFilterSidebar />
          <OfferBanner />
        </MemberAuthProvider>
      </body>
    </html>
  );
}
