import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./_lib/auth-provider";

export const metadata: Metadata = {
  title: "Decision Board",
  description:
    "Collaborative decision-making platform with Windows Phone aesthetics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
