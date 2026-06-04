import type { Metadata } from 'next';

const EFFECTIVE_DATE = '2026년 6월 4일';
const CONTACT_EMAIL = 'contact@dustpeakclub.com';

export const metadata: Metadata = {
  title: '이용약관',
  description: 'DustpeakClub 이용약관',
  alternates: {
    canonical: '/terms',
  },
};

const sections = [
  {
    title: '1. 목적',
    items: [
      '본 약관은 DustpeakClub이 제공하는 음악 리스트 작성, 공유, 검색, 커뮤니티 서비스의 이용 조건과 절차, 이용자와 서비스의 권리 및 의무를 정하는 것을 목적으로 합니다.',
    ],
  },
  {
    title: '2. 서비스의 내용',
    items: [
      '이용자는 플레이리스트, 앨범리스트, 태그, 댓글 등을 작성하고 공개 또는 비공개로 관리할 수 있습니다.',
      '이용자는 다른 사용자의 공개 콘텐츠를 검색, 조회하고 좋아요, 북마크, 팔로우 등 커뮤니티 기능을 사용할 수 있습니다.',
      '서비스는 Spotify API 등 외부 음악 정보 제공 서비스를 활용해 음악, 앨범, 아티스트 정보를 표시할 수 있습니다.',
    ],
  },
  {
    title: '3. 회원가입 및 계정',
    items: [
      '회원가입은 Google 로그인 등 서비스가 제공하는 인증 방식을 통해 이루어집니다.',
      '이용자는 자신의 계정을 안전하게 관리해야 하며, 계정 사용으로 발생한 활동에 대한 책임을 집니다.',
      '타인의 계정 또는 허위 정보를 사용하거나 부정한 방법으로 계정을 생성해서는 안 됩니다.',
    ],
  },
  {
    title: '4. 이용자의 콘텐츠',
    items: [
      '이용자는 자신이 작성한 콘텐츠에 대한 권리와 책임을 가집니다.',
      '이용자가 공개로 설정한 콘텐츠는 다른 이용자에게 노출될 수 있으며, 서비스 내 검색, 목록, 프로필 화면 등에 표시될 수 있습니다.',
      '비공개로 설정한 콘텐츠는 원칙적으로 다른 이용자에게 공개되지 않습니다. 다만 서비스 운영, 보안, 법령 준수, 장애 대응을 위해 필요한 범위에서 처리될 수 있습니다.',
      '이용자는 자신이 권리를 보유하지 않거나 타인의 권리를 침해하는 콘텐츠를 게시해서는 안 됩니다.',
      'DustpeakClub은 서비스 운영, 노출, 저장, 검색, 공유 기능 제공을 위해 이용자가 게시한 콘텐츠를 필요한 범위에서 사용할 수 있습니다.',
    ],
  },
  {
    title: '5. 금지행위',
    items: [
      '타인의 권리, 명예, 사생활을 침해하는 행위',
      '불법, 음란, 혐오, 차별, 폭력적 표현 등 공공질서에 반하는 콘텐츠를 게시하는 행위',
      '서비스의 정상적인 운영을 방해하거나 보안상 취약점을 악용하는 행위',
      '자동화된 방식으로 과도한 요청을 보내거나 데이터를 무단 수집하는 행위',
      '타인을 사칭하거나 허위 정보를 게시하는 행위',
    ],
  },
  {
    title: '6. 콘텐츠 및 계정의 제한',
    items: [
      'DustpeakClub은 약관 또는 법령을 위반한 콘텐츠를 숨김, 삭제하거나 계정 이용을 제한할 수 있습니다.',
      '반복적이거나 중대한 위반이 있는 경우 사전 통지 없이 서비스 이용이 제한될 수 있습니다.',
      '이용자는 계정 삭제 기능 또는 문의를 통해 탈퇴를 요청할 수 있습니다.',
    ],
  },
  {
    title: '7. 서비스 변경 및 중단',
    items: [
      'DustpeakClub은 서비스 개선, 운영상 필요, 외부 API 정책 변경 등에 따라 서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.',
      '서비스의 중요한 변경 또는 중단이 있는 경우 가능한 범위에서 사전에 안내합니다.',
    ],
  },
  {
    title: '8. 외부 서비스',
    items: [
      '서비스에는 Google, Supabase, Spotify, Vercel 등 외부 서비스가 연동될 수 있습니다.',
      '외부 서비스의 장애, 정책 변경, 데이터 제공 제한으로 인해 일부 기능이 제한될 수 있습니다.',
      '외부 서비스 이용에는 해당 서비스의 약관과 정책이 함께 적용될 수 있습니다.',
    ],
  },
  {
    title: '9. 책임 제한',
    items: [
      'DustpeakClub은 이용자가 게시한 콘텐츠의 정확성, 적법성, 신뢰성을 보증하지 않습니다.',
      '이용자 간 또는 이용자와 제3자 간 발생한 분쟁은 당사자 간 해결을 원칙으로 합니다.',
      'DustpeakClub은 천재지변, 외부 서비스 장애, 이용자의 귀책사유 등으로 발생한 손해에 대해 관련 법령이 허용하는 범위 내에서 책임을 제한합니다.',
    ],
  },
  {
    title: '10. 문의',
    items: [`서비스 이용 관련 문의는 ${CONTACT_EMAIL}으로 연락해 주세요.`],
  },
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl py-6 sm:py-10">
      <header className="border-b border-slate-800 pb-6">
        <p className="text-sm font-medium text-[#39ff14]">Terms of Service</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">이용약관</h1>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          본 약관은 DustpeakClub 서비스를 이용하는 데 필요한 기본적인 권리와 책임을 정합니다.
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
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39ff14]/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <section className="rounded-md border border-slate-800 bg-black/20 p-4 text-sm leading-6 text-zinc-400">
          본 약관은 서비스 운영 상황과 관련 법령의 변경에 따라 개정될 수 있습니다. 중요한 변경이 있는 경우 서비스
          내 공지 또는 적절한 방법으로 안내합니다.
        </section>
      </div>
    </article>
  );
}
