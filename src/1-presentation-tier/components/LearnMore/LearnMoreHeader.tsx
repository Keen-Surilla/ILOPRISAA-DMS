import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
// Adjust the path to your logo based on where you save this file!
import Logo2 from '../../../assets/Frame 100.svg'; 

export function LearnMoreHeader() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { path: '/about', label: 'About ILOPRISAA' },
    { path: '/privacy-policy', label: 'Privacy Policy' },
    { path: '/terms-of-service', label: 'Terms of Service' },
    { path: '/usage-policy', label: 'Usage Policy' },
  ];

  return (
    <header 
      className={`sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:bg-[#0b1120]/80 ${
        scrolled ? 'border-b border-slate-200 dark:border-slate-800/80' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 w-full max-w-[1600px] items-center justify-between gap-4 px-4 md:px-8 xl:px-12">
        
        {/* LOGO */}
        <Link to="/home" className="group flex shrink-0 items-center gap-3 focus:outline-none">
          <img src={Logo2} alt="ILOPRISAA" className="h-9 w-auto object-contain" />
        </Link>
        
        {/* PILL NAVIGATION */}
        <nav className="relative hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 px-2 py-1 shadow-inner backdrop-blur-md dark:border-slate-700/50 dark:bg-[#131f37]/70 lg:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`relative z-10 rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA BUTTON */}
        <div className="flex items-center space-x-4">
          <Link
            to="/home"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all hover:bg-blue-500 hover:shadow-[0_0_28px_rgba(59,130,246,0.65)] active:scale-95"
          >
            Portal &rarr;
          </Link>
        </div>
      </div>
    </header>
  );
}