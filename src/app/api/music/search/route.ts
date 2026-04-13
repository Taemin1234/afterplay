import { NextResponse } from 'next/server';
import { searchSpotify, type SpotifySearchType } from '@/lib/spotify';

type SpotifySearchItem = {
  id: string;
  name: string;
  artists?: Array<{ name: string }>;
  album?: { images?: Array<{ url: string }> };
  images?: Array<{ url: string }>;
};

function normalizeMarket(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}

function detectMarketFromAcceptLanguage(header: string | null): string | null {
  if (!header) return null;

  for (const chunk of header.split(',')) {
    const token = chunk.split(';')[0]?.trim();
    if (!token) continue;

    const localeParts = token.split('-');
    if (localeParts.length >= 2) {
      const region = normalizeMarket(localeParts[1]);
      if (region) return region;
    }

    const language = localeParts[0]?.toLowerCase();
    if (language === 'ko') return 'KR';
    if (language === 'en') return 'US';
    if (language === 'ja') return 'JP';
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const rawType = searchParams.get('type');
  const marketParam = normalizeMarket(searchParams.get('market'));
  const headerMarket = detectMarketFromAcceptLanguage(request.headers.get('accept-language'));
  const market = marketParam ?? headerMarket ?? 'KR';
  const type: SpotifySearchType =
    rawType === 'album' || rawType === 'artist' ? rawType : 'track';

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const data = await searchSpotify(query, type, { market });
    // 우리 UI 규격으로 변환
    const items =
      type === 'track'
        ? data?.tracks?.items ?? []
        : type === 'album'
          ? data?.albums?.items ?? []
          : data?.artists?.items ?? [];

    const results = (items as SpotifySearchItem[]).map((item) => ({
      id: item.id,
      name: item.name,
      artist: item.artists?.[0]?.name ?? '',
      albumImageUrl:
        type === 'track' ? item.album?.images?.[0]?.url : item.images?.[0]?.url,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('[api/music/search] Spotify fetch failed', { query, type, market, error });
    return NextResponse.json({ error: 'Spotify fetch error' }, { status: 500 });
  }
}
