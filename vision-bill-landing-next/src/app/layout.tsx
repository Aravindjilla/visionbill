import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VisionBill — AI-Powered Retail Intelligence",
  description: "Transform messy paper receipts into digital assets and effortless social splits with AI vision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <body className="min-h-screen bg-[#F8F9FA] selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}

