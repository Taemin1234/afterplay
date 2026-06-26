import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
  { href: '/privacy', label: '개인정보처리방침', internal: true },
  { href: '/terms', label: '이용약관', internal: true },
  { href: 'https://www.instagram.com', label: 'Instagram', internal: false },
] as const;

export default function Footer() {
  return (
    <footer data-site-footer className="border-t border-point/15 bg-app-bg/80">
      <div className="container mx-auto flex flex-col items-start gap-4 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-7 text-sm text-white-600 md:flex-row md:justify-between md:pb-7">
        <div>
          <Image
            src="/logo_2line.png"
            alt="로고"
            width={160}
            height={57}
            className="h-auto w-[clamp(100px,16vw,160px)]"
            priority
          />
          <p className="mt-1 text-sm text-white">Collect your dust, Build our peak.</p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <nav aria-label="서비스 정보" className="flex flex-wrap items-center text-xs sm:text-sm">
            {navLinks.map((item, index) => {
              const className = [
                'transition-colors underline hover:text-point',
                index > 0 ? 'ml-3 border-l border-white/20 pl-3 sm:ml-4 sm:pl-4' : '',
              ].join(' ');

              return item.internal ? (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                </Link>
              ) : (
                <a key={item.href} href={item.href} className={className} target="_blank" rel="noreferrer">
                  {item.label}
                </a>
              );
            })}
          </nav>

          <a href="mailto:dustpeakclub@gmail.com" className="text-xs text-white/55 transition-colors hover:text-point">
            dustpeakclub@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
