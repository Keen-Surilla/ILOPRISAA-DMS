import { ShieldCheck, Lock, Fingerprint, Users, ArrowRight } from 'lucide-react';
import HeroAthletes from '../../../assets/hero-athletes.png';
import { smoothScrollTo } from './functions';

export function Hero() {
  return (
    <div id="home" className="relative w-full overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[1100px] -translate-x-1/2 rounded-full blur-[140px]"
        style={{ background: 'linear-gradient(to bottom, rgba(37,99,235,0.2), rgba(14,165,233,0.1), transparent)' }}
      />
      <div className="pointer-events-none absolute right-[-100px] top-80 -z-10 h-[500px] w-[500px] rounded-full bg-cyan-600/15 blur-[140px]" />
      
      <section className="relative mx-auto w-full max-w-[1600px] px-4 pb-20 pt-16 md:px-8 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="z-10 flex flex-col lg:col-span-7">
            <div className="mb-6 flex w-fit items-center gap-2.5 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 shadow-sm backdrop-blur-xl dark:border-blue-500/30 dark:bg-[#131f37]/80 dark:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">The digital standard for Iloilo PRISAA.</span>
            </div>
            
            <h1 className="mb-6 font-sora text-4xl font-extrabold uppercase leading-[1.04] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
              Eligibility documents,
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm dark:from-blue-400 dark:via-sky-300 dark:to-cyan-300 dark:drop-shadow-[0_0_28px_rgba(59,130,246,0.4)]">
                verified
              </span>{' '}
              not chased.
            </h1>
            
            <p className="mb-8 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              Ditch the folders. ILOPRISAA DMS centralizes athlete credentials into a single, secured digital
              record. Coaches upload, the committee verifies, and athletes stay ready to play.
            </p>
            
            <div className="mb-10 flex flex-wrap items-center gap-4">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    smoothScrollTo('access');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95 dark:shadow-[0_0_28px_rgba(59,130,246,0.45)] dark:hover:shadow-[0_0_36px_rgba(59,130,246,0.7)]"
                >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
            
            {/* Update this <a> tag with an onClick to use the custom scroll animation */}
            <a
                href="#how-it-works"
                onClick={(e) => {
                e.preventDefault();
                smoothScrollTo('how-it-works');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-xl transition-all hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700/60 dark:bg-[#131f37]/80 dark:text-slate-200 dark:shadow-lg dark:hover:bg-[#223559] dark:hover:text-white"
            >
                See how it works
            </a>
            </div>
            
            <div className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-6 dark:border-slate-800/80 sm:grid-cols-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Invite-only access</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Lock className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Row-level secured</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Fingerprint className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">SHA-256 signed</span>
              </div>
            </div>
          </div>
          
          <div className="relative flex w-full items-center justify-center lg:col-span-5">
            <div className="relative w-full overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-500/30 dark:bg-[#0f172a] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85),0_0_35px_rgba(59,130,246,0.2)]">
              <img
                src={HeroAthletes}
                alt="ILOPRISAA student-athletes competing in track, basketball, volleyball, and swimming"
                className="h-[460px] w-full scale-[1.01] object-cover transition-transform duration-700 hover:scale-105 md:h-[520px]"
              />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent dark:from-[#0b1120] dark:via-[#0b1120]/45" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent dark:from-[#0b1120]/60" />
              
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3.5 py-1.5 backdrop-blur-md dark:border-blue-500/30 dark:bg-[#0b1120]/85">
                <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  ILOPRISAA
                </span>
              </div>
              
              <div className="absolute bottom-4 left-4 max-w-[230px] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur-2xl dark:border-slate-700/80 dark:bg-[#0f172a]/95 dark:shadow-[0_20px_45px_rgba(0,0,0,0.7)]">
                <div className="mb-1 flex items-center gap-1.5 text-blue-600 dark:text-sky-400">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Role matrix</span>
                </div>
                <div className="mb-1 font-sora text-sm font-bold leading-tight text-slate-900 dark:text-white">
                  4 enforced system roles
                </div>
                <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                  Admin · School Admin · Committee · Coach
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}