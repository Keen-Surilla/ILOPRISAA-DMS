import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { MemberInstitutions } from '../components/landing/MemberInstitutions';
import { HowItWorks } from '../components/landing/HowItWorks';
import { RolesSection } from '../components/landing/RolesSection';
import { StateMachineSection } from '../components/landing/StateMachineSection';
import { AccessSection } from '../components/landing/AccessSection';
import { Footer } from '../components/landing/Footer';


export default function LandingPage() {
  return (
<div className="min-h-screen font-inter antialiased bg-slate-50 text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
        <Header />

      <main className="w-full pt-20">
        <Hero />
        <MemberInstitutions />
        <HowItWorks />
        <RolesSection />
        <StateMachineSection />
        <AccessSection />
      </main>

      <Footer />
    </div>
  );
}