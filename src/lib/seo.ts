import type { Metadata } from 'next';

// 환경변수가 없을 때 사용
const DEFAULT_SITE_URL = 'https://dustpeakclub.vercel.app';

export const SITE_NAME = 'dustpeakclub';
export const SITE_TITLE = 'dustpeakclub | Collect your dust, Build our peak.';
export const SITE_DESCRIPTION ="흩날리는 먼지(Dust) 같은 개개인의 플레이리스트가 한곳에 모여, 거대한 아카이브의 봉우리(Peak)를 완성합니다. 'Dust Peak'는 티끌 모아 태산이 되듯, 우리 모두의 조각난 감상들을 엮어 가장 높은 음악적 경험을 공유하고자 합니다.";

// http:// 또는 https://로 시작하면 그대로 두고 아니면 붙인다.
// url 끝에 붙은 /제거
function normalizeUrl(raw: string) {
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
}

// 현재 사이트의 기준 URL
export function getSiteUrl() {
  const candidate =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_URL ??
    DEFAULT_SITE_URL;

  return normalizeUrl(candidate);
}

// 특정 경로를 절대 URL로 변환
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
      canonical: '/', // 대표주소 설정
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
    category: 'music', // 사이트 성향/카테고리
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
