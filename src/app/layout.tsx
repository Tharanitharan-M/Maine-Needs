import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Maine Needs - Case Worker Portal",
  description: "A collaborative initiative between Maine Needs and Northeastern University's Roux Institute",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen w-full`}>
        <AuthProvider>
          <main className="flex-1 h-full w-full">
            {children}
          </main>
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
