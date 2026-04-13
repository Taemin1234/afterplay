// Spotify API는 보안을 위해 1시간마다 만료되는 Access Token을 요구.
// 토큰을 자동으로 갱신하고 검색을 수행하는 유틸리티.
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SEARCH_ENDPOINT = 'https://api.spotify.com/v1/search';
export type SpotifySearchType = 'track' | 'album' | 'artist';
type SpotifySearchOptions = {
  market?: string;
};

// Spotify 토큰 응답의 형태
type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
};

// 토근 재사용을 위해 저장
let cachedToken: { value: string; expiresAt: number } | null = null;

const getBasicAuthHeader = () => {
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing');
  }

  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
};

// 1. 액세스 토큰 가져오기
const requestAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: getBasicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} ${detail}`);
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  if (!data?.access_token) {
    throw new Error('Spotify token response missing access_token');
  }

  // 60초마다 바뀌는 토큰을 캐시에 저장
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + Math.max(data.expires_in - 60, 30) * 1000,
  };

  return data.access_token;
};

export const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  try {
    return await requestAccessToken();
  } catch (firstError) {
    // Retry once for intermittent startup/network errors.
    try {
      return await requestAccessToken();
    } catch {
      throw firstError;
    }
  }
};

// 2. 검색 함수 (곡 또는 앨범)
const requestSpotifySearch = async (
  accessToken: string,
  query: string,
  type: SpotifySearchType,
  options?: SpotifySearchOptions
) => {
  const market = options?.market && /^[A-Z]{2}$/.test(options.market) ? options.market : 'KR';
  const response = await fetch(
    `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&type=${type}&limit=10&market=${encodeURIComponent(market)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Spotify search failed: ${response.status} ${detail}`);
  }

  return response.json();
};

export const searchSpotify = async (query: string, type: SpotifySearchType, options?: SpotifySearchOptions) => {
  const firstToken = await getAccessToken();

  try {
    return await requestSpotifySearch(firstToken, query, type, options);
  } catch (firstError) {
    // If token became invalid, force-refresh token and retry once.
    cachedToken = null;

    try {
      const refreshedToken = await getAccessToken();
      return await requestSpotifySearch(refreshedToken, query, type, options);
    } catch {
      throw firstError;
    }
  }
};
