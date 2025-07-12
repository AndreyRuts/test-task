"use client";

import "./globals.css";
import Nav from "@/components/Navigation";
import { NextUIProvider } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#121212] text-white">
        <NextUIProvider>
          <main>
            <Nav />
            {children}
          </main>
          <Toaster position="top-right" />
        </NextUIProvider>
      </body>
    </html>
  );
}
