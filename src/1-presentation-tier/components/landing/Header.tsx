import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo2 from '../../../assets/Frame 100.svg';
// 1. Import smoothScrollTo here:
import { NAV_LINKS, smoothScrollTo } from './functions';

const LEARN_MORE_NAV_LINKS = [
  { id: 'why', label: 'Why ILOPRISAA' },
  { id: 'workflow', label: 'How it works' },
  { id: 'roles', label: 'Roles' },
  { id: 'features', label: 'Features' },
] as const;

type HeaderProps = {
  variant?: 'landing' | 'learn-more';
};

export function Header({ variant }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isLearnMore = variant === 'learn-more' || location.pathname === '/learn-more';
  const navLinks = isLearnMore ? LEARN_MORE_NAV_LINKS : NAV_LINKS;
  const renderedNavLinks = isLearnMore ? [{ id: 'home', label: 'Home' }, ...navLinks] : navLinks;
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(isLearnMore ? 'why' : 'home');
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  
  const navRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const isClickScrolling = useRef(false);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isClickScrolling.current) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-81px 0px -60% 0px', threshold: 0 }
    );

    navLinks.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [navLinks]);

  useEffect(() => {
    const activeIndex = renderedNavLinks.findIndex((link) => link.id === activeSection);
    const activeEl = navRefs.current[activeIndex];

    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: 1,
      });
    }
  }, [activeSection, renderedNavLinks]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();

    if (isLearnMore && id === 'home') {
      navigate('/');
      return;
    }

    isClickScrolling.current = true;
    setActiveSection(id);
    smoothScrollTo(id);

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 1000);
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:bg-[#0b1120]/80 ${scrolled ? 'border-slate-200 dark:border-slate-800/80' : 'border-transparent'}`}>
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8 xl:px-12">
        <a href={isLearnMore ? '/' : '#home'} onClick={(e) => handleNavClick(e, 'home')} className="group flex shrink-0 items-center gap-3">
          <img src={Logo2} alt="ILOPRISAA" className="h-9 w-auto object-contain" />
        </a>
        
        <nav className="relative hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 px-2 py-1 shadow-inner backdrop-blur-md dark:border-slate-700/50 dark:bg-[#131f37]/70 lg:flex">
          <div
            className="absolute inset-y-1 rounded-full bg-white shadow-sm transition-all duration-300 ease-out dark:bg-slate-800"
            style={{ left: `${indicatorStyle.left}px`, width: `${indicatorStyle.width}px`, opacity: indicatorStyle.opacity }}
          />

          {renderedNavLinks.map((link, i) => (
            <a
              key={link.id}
              ref={(el) => { navRefs.current[i] = el; }}
              href={isLearnMore && link.id === 'home' ? '/' : `#${link.id}`}
              onClick={(e) => handleNavClick(e, link.id)}
              className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-300 ${
                activeSection === link.id
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* 3. This button already calls scrollToAccess, so it automatically gets the new animation! */}
     <button
        onClick={(e) => {
            e.preventDefault();
            isLearnMore ? navigate('/login') : smoothScrollTo('access');
        }}
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_28px_rgba(59,130,246,0.65)] active:scale-95"
        >
        Sign in
        </button>
      </div>
    </header>
  );
}