import type { Metadata } from 'next';

const DEFAULT_SITE_URL = 'https://dustpeakclub.vercel.app';

export const SITE_NAME = 'dustpeakclub';
export const SITE_TITLE = 'dustpeakclub | 플레이리스트 아카이브';
export const SITE_DESCRIPTION =
  '플레이리스트와 앨범리스트를 만들고 공유하며, 취향을 발견하는 음악 아카이브 플랫폼입니다.';

function normalizeUrl(raw: string) {
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
}

export function getSiteUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_SITE_URL;

  return normalizeUrl(candidate);
}

export function buildUrl(pathname: string) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${path}`;
}

export function buildDefaultMetadata(): Metadata {
  const metadataBase = new URL(getSiteUrl());

  return {
    metadataBase,
    applicationName: SITE_NAME,
    title: {
      default: SITE_TITLE,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: '/',
      siteName: SITE_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      locale: 'ko_KR',
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
    category: 'music',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}
