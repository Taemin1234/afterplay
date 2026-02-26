import { NextResponse } from 'next/server';
import { searchSpotify } from '@/lib/spotify';

type SpotifySearchItem = {
  id: string;
  name: string;
  artists?: Array<{ name: string }>;
  album?: { images?: Array<{ url: string }> };
  images?: Array<{ url: string }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const type = (searchParams.get('type') as 'track' | 'album') || 'track';

  if (query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const data = await searchSpotify(query, type);
    // 우리 UI 규격으로 변환
    const items = type === 'track' ? data?.tracks?.items ?? [] : data?.albums?.items ?? [];

    const results = (items as SpotifySearchItem[]).map((item) => ({
      id: item.id,
      name: item.name,
      artist: item.artists?.[0]?.name ?? '',
      albumImageUrl: type === 'track' ? item.album?.images?.[0]?.url : item.images?.[0]?.url,
    }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Spotify fetch error' }, { status: 500 });
  }
}
