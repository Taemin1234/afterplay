import type { Metadata } from 'next';

const EFFECTIVE_DATE = '2026년 6월 4일';
const CONTACT_EMAIL = 'contact@dustpeakclub.com';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'DustpeakClub 개인정보처리방침',
  alternates: {
    canonical: '/privacy',
  },
};

const sections = [
  {
    title: '1. 수집하는 개인정보 항목',
    items: [
      '회원가입 및 로그인 시: 이메일 주소, 소셜 로그인 식별자, 이름 또는 프로필명, 프로필 이미지 등 Google 계정에서 제공되는 정보',
      '서비스 이용 시: 닉네임, 작성한 플레이리스트 및 앨범리스트, 댓글, 좋아요, 북마크, 팔로우 정보, 태그, 공개 여부 설정',
      '서비스 운영 과정에서: 접속 기록, 브라우저 및 기기 정보, IP 주소, 쿠키, 부정 이용 방지를 위한 이용 기록',
    ],
  },
  {
    title: '2. 개인정보의 이용 목적',
    items: [
      '회원 식별, 로그인 유지, 계정 관리 및 탈퇴 처리',
      '플레이리스트, 앨범리스트, 댓글, 좋아요, 북마크, 팔로우 등 커뮤니티 기능 제공',
      '검색, 추천, 정렬, 공개 프로필 등 서비스 경험 개선',
      '문의 대응, 공지 전달, 서비스 안정성 확보 및 부정 이용 방지',
    ],
  },
  {
    title: '3. 개인정보의 보유 및 이용 기간',
    items: [
      '회원 정보는 회원 탈퇴 시까지 보관하며, 탈퇴 요청이 완료되면 지체 없이 파기합니다.',
      '사용자가 직접 작성한 공개 콘텐츠는 서비스의 연속성과 다른 이용자의 이용 경험을 위해 삭제 또는 익명화되어 보관될 수 있습니다.',
      '관련 법령에 따라 보관이 필요한 정보는 해당 법령에서 정한 기간 동안 보관할 수 있습니다.',
    ],
  },
  {
    title: '4. 개인정보 처리 위탁',
    items: [
      'Supabase: 회원 인증, 데이터베이스, 파일 및 서비스 인프라 운영',
      'Vercel: 웹 애플리케이션 배포, 호스팅, 로그 처리',
    ],
  },
  {
    title: '5. 외부 서비스 이용',
    items: [
      'Google: Google OAuth 로그인 제공',
      'Spotify API: 음악, 앨범, 아티스트 등 외부 음악 정보 조회',
    ],
  },
  {
    title: '6. 개인정보의 제3자 제공',
    items: [
      'DustpeakClub은 이용자의 개인정보를 사전 동의 없이 제3자에게 제공하지 않습니다.',
      '다만 법령에 근거한 요청이 있거나 수사기관 등 정당한 권한을 가진 기관의 요청이 있는 경우 관련 법령에 따라 제공될 수 있습니다.',
    ],
  },
  {
    title: '7. 개인정보의 파기 절차 및 방법',
    items: [
      '개인정보의 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 해당 개인정보를 파기합니다.',
      '전자적 파일 형태의 개인정보는 복구 및 재생이 어렵도록 안전하게 삭제합니다.',
    ],
  },
  {
    title: '8. 이용자의 권리',
    items: [
      '이용자는 자신의 개인정보에 대해 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.',
      '회원은 서비스 내 계정 삭제 기능 또는 문의를 통해 탈퇴를 요청할 수 있습니다.',
      '권리 행사는 본 방침의 문의처를 통해 요청할 수 있으며, DustpeakClub은 관련 법령에 따라 처리합니다.',
    ],
  },
  {
    title: '9. 쿠키 및 유사 기술',
    items: [
      'DustpeakClub은 로그인 유지, 보안, 서비스 이용 편의를 위해 쿠키 또는 유사 기술을 사용할 수 있습니다.',
      '이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있으나, 이 경우 일부 기능 이용이 제한될 수 있습니다.',
    ],
  },
  {
    title: '10. 개인정보 보호를 위한 조치',
    items: [
      '개인정보 접근 권한을 필요한 범위로 제한합니다.',
      '인증 및 데이터 저장을 위해 신뢰할 수 있는 외부 인프라를 사용합니다.',
      '서비스 운영 과정에서 개인정보가 불필요하게 노출되지 않도록 관리합니다.',
    ],
  },
  {
    title: '11. 문의처',
    items: [
      `개인정보 관련 문의, 열람, 정정, 삭제, 탈퇴 요청은 ${CONTACT_EMAIL}으로 연락해 주세요.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl py-6 sm:py-10">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-sm font-medium text-point">Privacy Policy</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">개인정보처리방침</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          DustpeakClub은 이용자의 개인정보를 소중하게 다루며, 개인정보 보호 관련 법령에 따라 다음과 같이
          개인정보를 처리합니다.
        </p>
        <p className="mt-3 text-xs text-zinc-500">시행일: {EFFECTIVE_DATE}</p>
      </header>

      <div className="space-y-8 py-8">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-point/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-md border border-slate-800 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
          본 방침은 서비스 운영 방식, 법령, 외부 서비스 정책 변경에 따라 개정될 수 있습니다. 중요한 변경이 있는
          경우 서비스 내 공지 또는 적절한 방법으로 안내합니다.
        </section>
      </div>
    </article>
  );
}
