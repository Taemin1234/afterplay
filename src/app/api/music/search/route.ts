import { NextResponse } from 'next/server';
import { expandSpotifySearchQueries, getLocalizedNames, localizedName } from '@/lib/music-localization';
import { searchSpotify, type SpotifySearchType } from '@/lib/spotify';

type SpotifySearchItem = {
  id: string;
  name: string;
  artists?: Array<{ id: string; name: string }>;
  album?: { id: string; name: string; images?: Array<{ url: string }> };
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
    const searchQueries = await expandSpotifySearchQueries(query, type);
    const responses = await Promise.all(searchQueries.map((searchQuery) => searchSpotify(searchQuery, type, { market })));
    // 우리 UI 규격으로 변환
    const items = responses.flatMap((data) =>
      type === 'track'
        ? data?.tracks?.items ?? []
        : type === 'album'
          ? data?.albums?.items ?? []
          : data?.artists?.items ?? []
    );

    const spotifyItems = [...new Map((items as SpotifySearchItem[]).map((item) => [item.id, item])).values()].slice(0, 10);
    const localizationRequests = spotifyItems.flatMap((item) => {
      const artist = item.artists?.[0];
      return [
        {
          type: type === 'track' ? 'TRACK_TITLE' as const : type === 'album' ? 'ALBUM_TITLE' as const : 'ARTIST_NAME' as const,
          spotifyId: item.id,
          canonical: item.name,
        },
        ...(artist && type !== 'artist'
          ? [{ type: 'ARTIST_NAME' as const, spotifyId: artist.id, canonical: artist.name }]
          : []),
      ];
    });
    const localizedNames = await getLocalizedNames(localizationRequests);

    const results = spotifyItems.map((item) => {
      const artist = item.artists?.[0];
      const entityAliasType = type === 'track' ? 'TRACK_TITLE' : type === 'album' ? 'ALBUM_TITLE' : 'ARTIST_NAME';
      const spotifyArtistName = artist?.name ?? '';

      return {
        id: item.id,
        name: localizedName(localizedNames, entityAliasType, item.id, item.name),
        spotifyName: item.name,
        artist: artist
          ? localizedName(localizedNames, 'ARTIST_NAME', artist.id, artist.name)
          : '',
        spotifyArtistName,
        artistId: artist?.id,
        albumId: type === 'track' ? item.album?.id : type === 'album' ? item.id : undefined,
        spotifyAlbumName: type === 'track' ? item.album?.name : type === 'album' ? item.name : undefined,
        albumImageUrl:
          type === 'track' ? item.album?.images?.[0]?.url : item.images?.[0]?.url,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('[api/music/search] Spotify fetch failed', { query, type, market, error });
    return NextResponse.json({ error: 'Spotify fetch error' }, { status: 500 });
  }
}
