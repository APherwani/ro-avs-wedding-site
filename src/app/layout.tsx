import type { Metadata } from "next";
import { Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ro & Avs | Wedding Celebration",
  description:
    "Join us in celebrating the wedding of Rohini & Avinash. December 12, 2026.",
  openGraph: {
    title: "Ro & Avs | Wedding Celebration",
    description: "Join us in celebrating the wedding of Rohini & Avinash.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${cormorant.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
