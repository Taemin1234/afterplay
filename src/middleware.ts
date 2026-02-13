import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 기본 응답 객체 생성
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // supabse 클라이언트 초기화
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 현재 유저 정보 가져오기 (세션 갱신 포함)
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 체크 로직 추가
  const { pathname } = request.nextUrl;
  
  // 비로그인 시 보호가 필요한 경로들
  const PROTECTED_ROUTES = ['/mypage', '/createList'];
  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // 로그인이 안 되었는데 보호된 경로에 접근하려 할 때
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    // 로그인 후 다시 이 페이지로 돌아오게 'next' 파라미터 추가
    url.searchParams.set('next', pathname); 
    return NextResponse.redirect(url);
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 대해 미들웨어 실행:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘)
     * - public 폴더 안의 파일들
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}