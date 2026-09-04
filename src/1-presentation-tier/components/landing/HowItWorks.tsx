import { PROCESS_STEPS, Reveal } from './functions';

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-[1600px] scroll-mt-[50px] border-b border-slate-200 px-4 py-20 dark:border-slate-800/80 md:px-8 xl:px-12" id="how-it-works">
      <Reveal>
        <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          The pipeline
        </span>
        <h2 className="mb-2 mt-1 font-sora text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          Three steps, one record
        </h2>
        <p className="max-w-2xl text-base text-slate-600 dark:text-slate-400">
          Your coach handles the upload, you always keep visibility into your own file.
        </p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PROCESS_STEPS.map((step) => (
            <div
              key={step.n}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 dark:border-slate-800 dark:bg-[#0f172a] dark:hover:border-blue-500/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:border-blue-500/30 dark:bg-blue-600/15 dark:text-blue-400">
                  <step.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="font-mono text-xl font-bold text-slate-300 dark:text-slate-600">{step.n}</span>
              </div>
              <div>
                <h3 className="mb-2 mt-4 font-sora text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}