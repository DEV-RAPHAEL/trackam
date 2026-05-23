import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  title: "Trackam CRM | Master Your Business Flow",
  description: "The premium CRM for Nigerian enterprises. Track leads, deals, and invoices with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
