import type { Metadata, Viewport } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={pretendard.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
