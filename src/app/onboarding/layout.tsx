import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '닉네임 설정',
  description: '계정설정 페이지입니다..',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
