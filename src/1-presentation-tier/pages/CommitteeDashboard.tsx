// src/1-presentation-tier/pages/CommitteeDashboard.tsx
import { lazy, Suspense, useState } from 'react';
import {  FileCheck } from 'lucide-react';
import { PortalShell } from '../components/layout/PortalShell';

const PendingReviews = lazy(() => import('./committee-views/PendingReviews'));

export default function CommitteeDashboard() {
  const [activeTab, setActiveTab] = useState('pending');

  let TabContent = null;
  switch (activeTab) {
    case 'pending':
      TabContent = <PendingReviews />;
      break;
    default:
      TabContent = <PendingReviews />;
  }

  return (
    <PortalShell
  portalTitle="Committee Portal"
  navGroups={[
    {
      label: null,
      items: [
        { id: 'pending', label: 'Pending Reviews', icon: <FileCheck className="w-5 h-5" />, active: activeTab === 'pending', onClick: () => setActiveTab('pending') },
      ],
    },
  ]}
>
      <div className="p-8">
        <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Loading…</div>}>
          {TabContent}
        </Suspense>
      </div>
    </PortalShell>
  );
}