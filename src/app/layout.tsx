import type { Metadata, Viewport } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";
import localFont from 'next/font/local'
import { buildDefaultMetadata } from '@/lib/seo';

const pretendard = localFont({
  src: '../fonts/PretendardVariable.woff2',
  display: 'swap',
  variable: '--font-pretendard',
});


export const metadata: Metadata = buildDefaultMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const GTM_ID = "GTM-M4CXMC7F";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <GoogleTagManager gtmId={GTM_ID} />
      <body>{children}</body>
    </html>
  );
}
