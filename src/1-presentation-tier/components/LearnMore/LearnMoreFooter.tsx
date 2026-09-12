import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
// Adjust this path based on exactly where this file is saved in your project structure!
import Logo2 from '../../../assets/Frame 100.svg';

export function LearnMoreFooter() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 pb-12 pt-16 dark:border-slate-800/80 dark:bg-[#070d1a]">
      {/* Subtle glowing top border from landing page */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent dark:via-sky-500/30" />
      
      <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-16 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 gap-10 border-b border-slate-200 pb-16 dark:border-slate-800/80 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          
          {/* BRANDING (Expanded to col-span-6 to balance the two link columns below) */}
          <div className="flex flex-col justify-between space-y-6 lg:col-span-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <img src={Logo2} alt="ILOPRISAA" className="h-10 w-auto object-contain" />
                <div className="border-l border-slate-300 pl-3.5 dark:border-slate-700/80" />
              </div>
              <p className="max-w-sm text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                The centralized eligibility and accreditation framework for
                member educational institutions in Iloilo City.
                Operating under Republic Act 10173.
              </p>
            </div>
          </div>
          
          {/* GOVERNANCE COLUMN */}
          <div className="flex flex-col space-y-3.5 lg:col-span-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              Governance
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/about" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                  About ILOPRISAA
                </Link>
              </li>
              <li>
                <span className="block text-slate-500 dark:text-slate-500">Participating Schools</span>
              </li>
              <li>
                <span className="block text-slate-500 dark:text-slate-500">Eligibility Bylaws</span>
              </li>
            </ul>
          </div>
          
          {/* COMPLIANCE & POLICY COLUMN */}
          <div className="flex flex-col space-y-3.5 lg:col-span-3">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
              Compliance &amp; Policy
            </div>
            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/privacy-policy" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/usage-policy" className="block transition-colors hover:text-blue-600 dark:hover:text-sky-400">
                  Usage Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* BOTTOM BAR */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 font-mono text-xs text-slate-500 dark:text-slate-400 lg:flex-row">
          <p className="text-center lg:text-left">
            © {new Date().getFullYear()} Iloilo Private Schools Athletic Association. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              RA 10173 Compliant · Region VI Athletic Administration
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}