// Spotify API는 보안을 위해 1시간마다 만료되는 Access Token을 요구. 토큰을 자동으로 갱신하고 검색을 수행하는 유틸리티 생성
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

// 1. 액세스 토큰 가져오기
export const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
    // 넥스트js의 캐싱 기능을 활용해 1시간(3600초) 동안 토큰 재사용
    next: { revalidate: 3600 },
  });

  // 2. 검색 함수 (곡 또는 앨범)
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} ${detail}`);
  }

  const data = await response.json();
  if (!data?.access_token) {
    throw new Error('Spotify token response missing access_token');
  }

  return data as { access_token: string };
};

export const searchSpotify = async (query: string, type: 'track' | 'album') => {
  const { access_token } = await getAccessToken();

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=10&market=KR&locale=ko-KR,ko;q%3D0.9`,
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Spotify search failed: ${response.status} ${detail}`);
  }

  return response.json();
};
