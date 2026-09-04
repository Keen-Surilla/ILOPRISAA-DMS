import { Network, Terminal } from 'lucide-react';
import { STATE_MACHINE_STATES, TRANSITIONS, StateCard, Reveal } from './functions';

export function StateMachineSection() {
  return (
    <section className="w-full border-y border-slate-200 bg-slate-50 py-24 dark:border-slate-800/80 dark:bg-[#070d1a]" id="state-machine">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 xl:px-12">
        <Reveal className="mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
            <Network className="h-3.5 w-3.5" aria-hidden="true" />
            Database invariant
          </div>
          <h2 className="mb-4 font-sora text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The core document verification state machine
          </h2>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Exactly five legal transition pairs, strictly enforced by a PostgreSQL trigger on{' '}
            <span className="font-mono text-sm text-blue-600 dark:text-blue-300">document_status_transitions</span>, mirrored in the
            frontend <span className="font-mono text-sm text-blue-600 dark:text-blue-300">documentStateMachine.ts</span> service, and
            recorded in <span className="font-mono text-sm text-blue-600 dark:text-blue-300">document_audit_log</span> on every
            transition.
          </p>
        </Reveal>
        
        <Reveal className="relative mb-12 overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-[#0f172a] dark:shadow-2xl md:p-10">
          <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]" style={{ backgroundSize: '20px 20px' }} />
          
          <div className="relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-4">
            {STATE_MACHINE_STATES.map((state) => (
              <StateCard key={state.step} state={state} />
            ))}
          </div>
          
          <div className="relative z-10 mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs dark:border-slate-800 dark:bg-[#0b1120] md:p-5">
            <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-3 text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <span className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                SQL trigger: trg_enforce_document_status_transition
              </span>
              <span className="text-blue-600 dark:text-blue-400">5 validated pairs</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-slate-700 dark:text-slate-300 md:grid-cols-5">
              {TRANSITIONS.map((t) => (
                <div key={t.n} className="rounded border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-[#131f37]/80">
                  <span className="block font-bold" style={{ color: t.color }}>
                    {t.n}. {t.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}