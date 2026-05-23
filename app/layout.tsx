import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ToastContainer";

export const metadata: Metadata = {
  metadataBase: new URL("https://trackam.ng"),
  title: {
    default: "Trackam — Nigeria's #1 Business CRM Platform",
    template: "%s | Trackam CRM",
  },
  description:
    "Trackam is Nigeria's most complete business management CRM. Manage unlimited clients, track leads, close deals, issue Naira invoices, and run your entire team from one powerful dashboard. Trusted by 500+ Nigerian businesses.",
  keywords: [
    "CRM Nigeria",
    "Nigerian CRM software",
    "business management software Nigeria",
    "leads tracking Nigeria",
    "invoice software Nigeria",
    "Naira invoicing",
    "sales pipeline Nigeria",
    "client management Nigeria",
    "deal tracking",
    "Nigeria SaaS CRM",
    "small business Nigeria",
    "Trackam",
  ],
  authors: [{ name: "Trackam", url: "https://trackam.ng" }],
  creator: "Trackam",
  publisher: "Trackam",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://trackam.ng",
    siteName: "Trackam CRM",
    title: "Trackam — Nigeria's #1 Business CRM Platform",
    description:
      "Manage unlimited clients, close deals, issue Naira invoices, and track your entire sales pipeline. Built specifically for Nigerian businesses. Flat-fee pricing — no per-seat surprises.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trackam CRM Dashboard — Nigeria's Business Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trackam — Nigeria's #1 Business CRM Platform",
    description:
      "The CRM built for Nigerian businesses. Unlimited clients, deals, invoicing in Naira, team management — all for one flat fee.",
    images: ["/og-image.png"],
    creator: "@trackamng",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: "https://trackam.ng",
  },
  category: "Business Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NG">
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {/* Structured Data (JSON-LD) for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Trackam CRM",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://trackam.ng",
              description:
                "Nigeria's most complete business CRM. Manage clients, leads, deals, invoices, and teams from one platform.",
              offers: {
                "@type": "Offer",
                price: "1200000",
                priceCurrency: "NGN",
              },
              provider: {
                "@type": "Organization",
                name: "Trackam",
                url: "https://trackam.ng",
                areaServed: "NG",
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "Customer Support",
                  email: "hello@trackam.ng",
                  availableLanguage: ["English", "Yoruba", "Igbo", "Hausa"],
                },
              },
            }),
          }}
        />
      </head>
      <body style={{ fontFamily: "'Inter', sans-serif" }}>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
