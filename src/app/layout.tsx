import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "List Guard — AI Compliance Scanner for Shopify & Etsy",
  description:
    "Never get fined or delisted again. AI scans your Shopify/Etsy store for GDPR, GPSR, Prop 65 & 2026 customs rules in 60 seconds. Built for small sellers.",
  keywords: [
    "compliance",
    "shopify",
    "etsy",
    "gdpr",
    "gpsr",
    "prop 65",
    "eu customs",
    "e-commerce compliance",
    "listing scanner",
  ],
  openGraph: {
    title: "List Guard — AI Compliance Scanner",
    description:
      "Stop losing sales to hidden 2026 compliance mistakes. AI scans your entire store.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark font-sans"
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0f1e" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
