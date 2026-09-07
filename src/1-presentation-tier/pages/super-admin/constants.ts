export type SectionId = 'overview' | 'watchlist' | 'accounts' | 'institutions' | 'audit' | 'invitations';
export type ComplianceStatus = 'verified' | 'pending' | 'discrepancy' | 'expired';
export type AccountRole = 'Super Admin' | 'School Admin' | 'Committee Chair';
export type AccountStatus = 'Active' | 'Suspended';
export type AuditEventType = 'trg_transition' | 'auth_grant' | 'policy_override' | 'suspension_lock';

export interface Account {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  institution: string;
  institutionSub: string;
  status: AccountStatus;
  lastAuth: string;
  protected?: boolean;
}

export interface School {
  code: string;
  name: string;
  location: string;
  division: 'Tertiary & Secondary' | 'Tertiary' | 'Secondary';
  admin: string;
  adminPending?: boolean;
  adminVacant?: boolean;
  quotaUsed: number;
  quotaMax: number;
  clearance: number;
}

export interface WatchlistItem {
  code: string;
  name: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  actionLabel: string;
}

export interface ForensicEntry {
  time: string;
  actor: string;
  summary: string;
  event: 'pass' | 'pending' | 'flagged';
  target: string;
  hash: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditEventType;
  target: string;
  institution: string;
  hash: string;
}

export interface Invitation {
  id: string;
  name: string;
  email: string;
  role: 'School Admin' | 'Committee Member';
  institution: string;
  expiresAt: number;
  revoked?: boolean;
}

export const STATUS_STYLES: Record<ComplianceStatus, { dot: string; text: string; bg: string; border: string; label: string }> = {
  verified: { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50/50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30', label: 'Verified' },
  pending: { dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50/50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', label: 'Pending Review' },
  discrepancy: { dot: 'bg-rose-500', text: 'text-rose-700 dark:text-rose-400', bg: 'bg-rose-50/50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/30', label: 'Discrepancy' },
  expired: { dot: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50/50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/30', label: 'Expired' },
};

export const SEVERITY_STYLES: Record<WatchlistItem['severity'], { text: string; badge: string }> = {
  critical: { text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600 shadow-sm shadow-rose-500/20' },
  high: { text: 'text-rose-500 dark:text-rose-400', badge: 'bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30' },
  medium: { text: 'text-amber-600 dark:text-amber-400', badge: 'bg-white dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' },
  low: { text: 'text-slate-500 dark:text-slate-400', badge: 'bg-white dark:bg-slate-800 hover:bg-slate-800 hover:text-white text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600' },
};

export const EVENT_STYLES: Record<AuditEventType, string> = {
  trg_transition: 'text-emerald-600 dark:text-emerald-400',
  auth_grant: 'text-amber-600 dark:text-amber-400',
  policy_override: 'text-blue-600 dark:text-blue-400',
  suspension_lock: 'text-rose-600 dark:text-rose-400',
};

// MOCK DATA (Truncated for brevity, insert your full INITIAL_ACCOUNTS, INITIAL_SCHOOLS, WATCHLIST, FORENSIC_FEED, AUDIT_LOG, INITIAL_INVITATIONS arrays here)
export const INITIAL_ACCOUNTS: Account[] = [/* ... your data ... */];
export const INITIAL_SCHOOLS: School[] = [/* ... your data ... */];
export const WATCHLIST: WatchlistItem[] = [/* ... your data ... */];
export const FORENSIC_FEED: ForensicEntry[] = [/* ... your data ... */];
export const AUDIT_LOG: AuditLogEntry[] = [/* ... your data ... */];
export const INITIAL_INVITATIONS: Invitation[] = [/* ... your data ... */];