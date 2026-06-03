import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FileCheck, Shield, Users } from 'lucide-react';
import { useAuthStore } from '../../2-application-tier/stores/authStore';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
        <span className="text-xl font-bold text-blue-400 tracking-wide">ILOPRISAA</span>
        <Link
          to={isAuthenticated && role ? `/${role}` : '/login'}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition"
        >
          {isAuthenticated ? 'Go to portal' : 'Sign in'}
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Document Management for PRISAA Athletes
        </h1>
        <p className="mt-4 text-slate-300 max-w-2xl mx-auto text-lg">
          Upload credentials, meet deadlines, and get verified by coaches and the committee—before game day.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold shadow-lg"
          >
            Athlete / Staff Login
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Feature
          icon={<FileCheck className="w-8 h-8 text-blue-400" />}
          title="Athletes"
          text="Submit documents, scan to auto-fill forms, and track approval status."
        />
        <Feature
          icon={<Users className="w-8 h-8 text-green-400" />}
          title="Coaches"
          text="Review assigned athletes and forward submissions for eligibility."
        />
        <Feature
          icon={<Shield className="w-8 h-8 text-purple-400" />}
          title="Committee"
          text="Set event deadlines and confirm athlete eligibility for competitions."
        />
        <Feature
          icon={<Calendar className="w-8 h-8 text-amber-400" />}
          title="Calendar"
          text="Games, document cutoffs, waivers, and forms—one shared schedule."
        />
      </section>

      <footer className="border-t border-slate-700 py-6 text-center text-sm text-slate-500">
        ILOPRISAA Document Management System
      </footer>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-left">
      {icon}
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
