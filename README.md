# dustpeakclub - 프로젝트 설명서

## 프로젝트 개요

**dustpeakclub**은 사용자가 자신만의 플레이리스트와 앨범리스트를 만들고, 다른 사용자의 음악 취향을 탐색할 수 있는 음악 디깅 커뮤니티 플랫폼입니다. "Collect your dust, Build our peak."라는 컨셉처럼, 개인의 작은 음악 조각들이 모여 하나의 커다란 아카이브를 만드는 경험을 목표로 합니다.

사용자는 Spotify 검색을 통해 곡 또는 앨범을 찾아 리스트에 담고, 제목과 스토리, 태그를 붙여 공개 또는 비공개로 저장할 수 있습니다. 공개된 리스트는 피드에서 최신순 또는 인기순으로 탐색할 수 있으며, 좋아요, 북마크, 댓글, 팔로우 기능을 통해 사용자 간의 취향 교류가 가능합니다.

이 프로젝트는 **Next.js 기반 풀스택 애플리케이션**으로 구현되었습니다. 프론트엔드 UI, 서버 라우트, 인증, 데이터베이스 모델링, 외부 API 연동, SEO, 관리자 기능까지 하나의 코드베이스 안에서 구성했습니다.

---

## 기술 스택 및 사용 목적

### 프론트엔드

#### Next.js 16.1.6
- **사용 목적**: App Router 기반 라우팅, 서버 컴포넌트, Route Handler를 활용한 풀스택 웹 애플리케이션 구현
- **적용 위치**:
  - 메인 피드, 로그인, 온보딩, 마이페이지, 프로필, 리스트 상세 및 수정 페이지
  - `src/app/api` 하위 Route Handler를 통한 서버 API 구성
  - 동적 메타데이터와 `sitemap`, `robots` 설정을 통한 SEO 최적화

#### React 19.2.3
- **사용 목적**: 컴포넌트 기반 UI 구축 및 클라이언트 상호작용 구현
- **적용 위치**:
  - 음악 리스트 브라우저, 리스트 작성 폼, 상세 모달, 댓글, 프로필 영역 등
  - 서버 컴포넌트와 클라이언트 컴포넌트를 분리해 초기 렌더링과 인터랙션 균형 유지

#### TypeScript
- **사용 목적**: 타입 안정성 확보 및 API 데이터 구조 명확화
- **적용 위치**:
  - 리스트 타입, 피드 타입, 검색 결과, 상세 응답, 폼 입력값 등 공통 타입 정의
  - Supabase 인증 사용자와 Prisma 모델을 다루는 서버 로직의 타입 안정성 확보

#### Tailwind CSS 4.1.18
- **사용 목적**: 빠른 UI 스타일링과 반응형 레이아웃 구현
- **적용 위치**:
  - 로그인, 메인 피드, 카드형 리스트, 마이페이지, 관리자 페이지 등 전체 화면 스타일
  - 모바일 하단 내비게이션과 데스크톱 헤더를 포함한 반응형 UI 구성

#### Motion 12.30.0
- **사용 목적**: 화면 전환 및 UI 인터랙션 애니메이션 구현
- **적용 위치**:
  - 리스트 카드, 모달, 페이지 내 인터랙션 요소의 자연스러운 움직임 처리

#### Lucide React 0.563.0
- **사용 목적**: 일관된 아이콘 시스템 구성
- **적용 위치**:
  - 버튼, 내비게이션, 리스트 액션, 상태 표시 등 반복 UI 요소

#### next/font/local
- **사용 목적**: 로컬 폰트 최적화 및 일관된 한글 타이포그래피 제공
- **적용 위치**:
  - `PretendardVariable.woff2`를 전역 레이아웃에 적용

---

### 백엔드 및 데이터

#### Next.js Route Handler
- **사용 목적**: 별도 Express 서버 없이 Next.js 내부에서 API 엔드포인트 구현
- **적용 위치**:
  - `/api/music/search`: Spotify 음악 검색
  - `/api/music/lists`: 공개 리스트 피드 조회
  - `/api/music/playlist`, `/api/music/albumlist`: 리스트 생성, 조회, 수정, 삭제
  - `/api/user/*`: 닉네임, 온보딩, 계정 삭제
  - `/api/follows/*`: 사용자 팔로우 처리
  - `/api/admin/search-aliases`: 검색 별칭 관리자 기능

#### Prisma 7.3.0
- **사용 목적**: PostgreSQL 데이터베이스 접근 및 스키마 모델링
- **적용 위치**:
  - `User`, `Playlist`, `AlbumList`, `Track`, `Album`, `Tag`, `Follow` 등 핵심 모델 정의
  - 좋아요, 북마크, 댓글, 조회 이벤트, 추천 섹션 등 관계형 데이터 관리
  - 마이그레이션을 통한 데이터베이스 변경 이력 관리

#### PostgreSQL
- **사용 목적**: 사용자, 리스트, 음악 캐시, 소셜 액션 데이터를 안정적으로 저장
- **적용 위치**:
  - Supabase Auth 사용자 ID와 애플리케이션 `User` 모델 연결
  - 플레이리스트와 앨범리스트의 항목 순서, 공개 범위, 삭제 상태, 조회수 관리
  - 복합 유니크 인덱스를 활용해 중복 좋아요, 중복 북마크, 중복 팔로우 방지

#### @prisma/adapter-pg 7.3.0
- **사용 목적**: Prisma와 PostgreSQL 연결 구성
- **적용 위치**:
  - `DATABASE_URL` 기반 데이터베이스 연결
  - 서버 런타임에서 Prisma Client 재사용

#### Supabase Auth
- **사용 목적**: OAuth 기반 사용자 인증과 세션 관리
- **적용 위치**:
  - Google 로그인 처리
  - OAuth 콜백에서 Supabase 세션 생성 후 애플리케이션 DB 사용자 동기화
  - 닉네임이 없는 신규 사용자를 온보딩 페이지로 이동
  - 서버 컴포넌트와 Route Handler에서 현재 로그인 사용자 확인

#### @supabase/ssr 0.8.0 / @supabase/supabase-js 2.93.3
- **사용 목적**: Next.js App Router 환경에서 쿠키 기반 Supabase 세션 처리
- **적용 위치**:
  - 서버 클라이언트와 브라우저 클라이언트 분리
  - 미들웨어 성격의 `proxy.ts`에서 세션 갱신
  - 계정 삭제 시 Service Role Key를 활용한 Auth 사용자 삭제

#### Spotify Web API
- **사용 목적**: 곡, 앨범, 아티스트 검색 데이터 제공
- **적용 위치**:
  - 리스트 작성 및 수정 화면의 음악 검색
  - Spotify Client Credentials Flow를 통한 서버 사이드 토큰 발급
  - 검색 결과를 내부 UI 규격인 `id`, `name`, `artist`, `albumImageUrl` 형태로 정규화
  - 검색한 곡과 앨범 정보를 내부 DB에 캐시해 리스트 상세와 피드에서 재사용

---

### 인프라 및 배포

#### Vercel
- **사용 목적**: Next.js 애플리케이션 배포 및 호스팅
- **적용 위치**:
  - `dustpeakclub.vercel.app` 기준 메타데이터 구성
  - App Router, 서버 컴포넌트, Route Handler 배포

#### Supabase
- **사용 목적**: 인증 서비스와 PostgreSQL 데이터베이스 운영
- **적용 위치**:
  - OAuth 인증 제공자 관리
  - PostgreSQL 데이터베이스 호스팅
  - Supabase 사용자 ID를 서비스 내부 사용자 모델의 기본 키로 사용

---

## 주요 기능 및 구현 방식

### 1. 소셜 로그인 및 온보딩
- **Google OAuth 로그인**: Supabase Auth를 사용해 Google 계정으로 로그인
- **OAuth 콜백 검증**: 인증 코드 누락, provider 오류, state 오류, rate limit 등 다양한 실패 케이스를 분류해 사용자에게 안내
- **DB 사용자 동기화**: Supabase Auth 사용자 정보를 Prisma `User` 모델에 생성 또는 갱신
- **닉네임 온보딩**: 신규 사용자 또는 닉네임 미설정 사용자를 `/onboarding`으로 이동

### 2. 음악 리스트 작성
- **플레이리스트 작성**: Spotify 곡 검색 결과를 선택해 순서가 있는 곡 리스트 생성
- **앨범리스트 작성**: Spotify 앨범 검색 결과를 선택해 앨범 단위 리스트 생성
- **태그 관리**: 태그를 정리하고 중복을 제거한 뒤 `Tag` 모델에 upsert
- **공개 범위 설정**: `PUBLIC`, `PRIVATE` 값을 통해 공개 피드 노출 여부 제어
- **중복 항목 제거**: 같은 Spotify ID를 가진 곡 또는 앨범이 하나의 리스트에 중복 저장되지 않도록 처리

### 3. 리스트 피드 및 탐색
- **통합 피드**: 플레이리스트와 앨범리스트를 `ListFeed` 모델로 통합해 최신순 탐색 제공
- **타입별 필터링**: 전체, 플레이리스트, 앨범리스트 단위로 조회
- **인기순 정렬**: 좋아요 수와 생성일 기준으로 인기 리스트 정렬
- **커서 기반 페이지네이션**: 최신순 피드는 base64url 커서를 사용해 무한 스크롤에 적합한 조회 방식 구현
- **미리보기 이미지**: 리스트에 포함된 곡 또는 앨범 커버를 카드 미리보기로 사용

### 4. 리스트 상세 및 상호작용
- **상세 조회**: 리스트 제목, 스토리, 작성자, 태그, 음악 항목, 댓글, 좋아요 상태를 함께 조회
- **좋아요**: 사용자별 중복 좋아요를 복합 키로 방지
- **북마크**: 사용자가 다시 보고 싶은 리스트를 저장
- **댓글**: 리스트별 댓글 작성, 수정, 삭제 흐름 구현
- **조회수 카운트**: 작성자 본인 조회는 제외하고, 로그인 사용자는 userId, 비로그인 사용자는 deviceId 기준으로 24시간에 한 번만 카운트

### 5. 프로필, 팔로우, 마이페이지
- **프로필 페이지**: 닉네임 슬러그 기반 사용자 프로필 조회
- **팔로우 시스템**: `Follow` 모델에서 팔로워와 팔로잉 관계 관리
- **마이페이지**: 내가 만든 리스트, 좋아요한 리스트, 북마크한 리스트를 확인
- **대시보드 인사이트**: 작성 리스트 수, 조회수, 좋아요 수, 자주 사용한 아티스트 및 앨범 등 사용자 활동 통계 제공
- **계정 삭제**: 사용자 데이터를 삭제 상태로 처리하고, Supabase Auth 사용자 삭제까지 연동

### 6. 관리자 기능
- **검색 별칭 관리**: 아티스트명, 곡명, 앨범명 등의 별칭을 관리해 검색 품질 개선
- **관리자 권한 확인**: `Role` enum의 `ADMIN` 값을 기준으로 관리자 페이지 접근 제어
- **추천 섹션 모델링**: 플레이리스트, 앨범리스트, 아티스트리스트 추천 섹션을 확장 가능하도록 분리 설계

### 7. SEO 및 공유 최적화
- **기본 메타데이터**: 서비스 이름, 설명, Open Graph, Twitter 메타데이터 구성
- **상세 페이지 메타데이터**: 플레이리스트와 앨범리스트 제목, 작성자, 첫 커버 이미지를 기반으로 공유 정보 생성
- **robots / sitemap**: 검색 엔진 접근 정책과 사이트맵 제공
- **canonical URL**: 주요 페이지의 정규 URL 설정

---

## 프로젝트 구조

```text
dustpeakclub/
├── prisma/
│   ├── schema.prisma        # Prisma 데이터 모델
│   └── migrations/          # 데이터베이스 마이그레이션
├── scripts/
│   └── test-database.ts     # DB 연결 테스트 스크립트
├── src/
│   ├── app/
│   │   ├── (main)/          # 메인 서비스 라우트
│   │   ├── api/             # Next.js Route Handler API
│   │   ├── auth/            # 로그인 및 OAuth 콜백
│   │   ├── onboarding/      # 신규 사용자 닉네임 설정
│   │   ├── globals.css      # 전역 스타일
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   ├── robots.ts        # robots 설정
│   │   └── sitemap.ts       # sitemap 생성
│   ├── components/
│   │   ├── admin/           # 관리자 UI
│   │   ├── layout/          # 헤더, 하단 내비게이션 등 레이아웃 컴포넌트
│   │   └── ui/              # atoms, molecules, organisms 구조의 UI 컴포넌트
│   ├── fonts/               # 로컬 폰트
│   ├── lib/                 # Prisma, Spotify, SEO, 리스트 비즈니스 로직
│   ├── types/               # 공통 타입 정의
│   └── utils/
│       └── supabase/        # Supabase server/client/admin 클라이언트
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 실행 방법

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일에 아래 값이 필요합니다.

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLIC_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
```

### 3. Prisma Client 생성 및 마이그레이션

```bash
npm run postinstall
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

---

## 주요 스크립트

```bash
npm run dev       # 개발 서버 실행
npm run build     # 프로덕션 빌드
npm run start     # 프로덕션 서버 실행
npm run lint      # ESLint 검사
npm run db:test   # 데이터베이스 연결 테스트
npm run db:studio # Prisma Studio 실행
```

---

## 핵심 성과 및 학습 내용

1. **Next.js 풀스택 구조 이해**: App Router, 서버 컴포넌트, Route Handler를 하나의 서비스 흐름으로 구성
2. **외부 인증 연동**: Supabase Auth 기반 OAuth 로그인과 자체 DB 사용자 모델 동기화 구현
3. **관계형 데이터 모델링**: 리스트, 음악 항목, 태그, 좋아요, 북마크, 댓글, 팔로우, 조회 이벤트를 관계형 스키마로 설계
4. **외부 API 통합**: Spotify Client Credentials Flow를 활용해 음악 검색과 내부 캐시 데이터 구조 연결
5. **사용자 경험 개선**: 커서 기반 피드, 모달 상세, 반응형 내비게이션, 활동 대시보드 구성
6. **운영 기능 확장**: 관리자 검색 별칭, 추천 섹션 모델, SEO 메타데이터 등 서비스 운영에 필요한 기반 마련

---

## 배포 정보

- **애플리케이션**: Vercel
- **인증**: Supabase Auth
- **데이터베이스**: Supabase PostgreSQL
- **음악 데이터**: Spotify Web API

---

dustpeakclub은 개인의 음악 취향을 리스트 형태로 기록하고, 다른 사람의 음악 아카이브를 탐색하며, 작은 감상들이 모여 더 큰 음악적 경험이 되도록 설계한 음악 커뮤니티 프로젝트입니다.
