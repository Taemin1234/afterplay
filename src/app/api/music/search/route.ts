import { NextResponse } from 'next/server';
import { searchSpotify } from '@/lib/spotify';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = (searchParams.get('type') as 'track' | 'album') || 'track';

  if (!query) return NextResponse.json([]);

  try {
    const data = await searchSpotify(query, type);
    
    // Spotify 응답 데이터를 우리 UI 규격(MusicItem)으로 변환
    const items = type === 'track' ? data.tracks.items : data.albums.items;
    
    const results = items.map((item: any) => ({
      id: item.id, // Spotify ID는 문자열입니다.
      name: item.name,
      artist: item.artists[0].name,
      // 곡 검색일 땐 item.album.images, 앨범 검색일 땐 item.images 사용
      albumImageUrl: type === 'track' ? item.album.images[0]?.url : item.images[0]?.url,
    }));

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Spotify fetch error' }, { status: 500 });
  }
}