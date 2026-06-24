import Link from 'next/link';

export default function Footer() {
  return (
    <footer data-site-footer className="border-t border-point/15 bg-app-bg/80">
      <div className="container mx-auto flex flex-col gap-4 px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-7 text-sm text-zinc-400 md:flex-row md:items-center md:justify-between md:pb-7">
        <div>
          <p className="font-mono text-base font-bold tracking-tighter text-white">
            <span className="text-point">Dustpeak</span>Club
          </p>
          <p className="mt-1 text-xs text-zinc-500">Collect your dust, Build our peak.</p>
        </div>

        <nav aria-label="서비스 정책" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm">
          <Link href="/privacy" className="transition-colors hover:text-point">
            개인정보처리방침
          </Link>
          <Link href="/terms" className="transition-colors hover:text-point">
            이용약관
          </Link>
          <a href="mailto:contact@dustpeakclub.com" className="transition-colors hover:text-point">
            문의
          </a>
        </nav>
      </div>
    </footer>
  );
}
