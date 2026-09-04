import { useState } from 'react';
import { SCHOOLS, SchoolChip, Reveal } from './functions';

export function MemberInstitutions() {
  const [isMarqueePaused, setIsMarqueePaused] = useState(false);
  
  return (
<section 
  className="w-full border-b border-slate-200 bg-slate-50 py-12 dark:border-slate-800/80 dark:bg-[#070d1a]" 
  id="institutions"
>      <div className="mx-auto max-w-[1600px] px-4 md:px-8 xl:px-12">
        <Reveal className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              THE TEAMS
            </span>
            <h2 className="font-sora text-xl font-bold text-slate-900 dark:text-white">Participating Institutions</h2>
          </div>
        </Reveal>
        
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
          <div
            className="flex items-center gap-4 py-2"
            style={{ width: 'max-content', animation: 'iloprisaa-marquee 34s linear infinite', animationPlayState: isMarqueePaused ? 'paused' : 'running' }}
            onMouseEnter={() => setIsMarqueePaused(true)}
            onMouseLeave={() => setIsMarqueePaused(false)}
          >
            {[...SCHOOLS, ...SCHOOLS].map((school, i) => (
              <SchoolChip key={`${school.code}-${i}`} school={school} hidden={i >= SCHOOLS.length} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}