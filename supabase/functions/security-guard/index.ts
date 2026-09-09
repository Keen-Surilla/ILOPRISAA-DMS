import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// --- IP-based thresholds ---
const SUSPICIOUS_THRESHOLD = 3;
const SUSPICIOUS_WINDOW_MIN = 10;
const SUSPICIOUS_BLOCK_MIN = 120; // 2h

const FLOOD_THRESHOLD = 15;
const FLOOD_WINDOW_MIN = 1;
const FLOOD_BLOCK_MIN = 60; // 1h

// --- Account-based thresholds (see note above on why this is short) ---
const LOGIN_FAIL_THRESHOLD = 5;
const LOGIN_FAIL_WINDOW_MIN = 15;
const ACCOUNT_LOCK_MIN = 15;

function getClientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

type RequestBody = {
  flagged?: boolean;
  checkOnly?: boolean;
  email?: string;
  loginFailed?: boolean;
  loginSucceeded?: boolean;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const ip = getClientIp(req);

  let body: RequestBody = {};
  try {
    body = await req.json();
  } catch {
    // Missing/empty body is fine.
  }

  const email = body.email ? normalizeEmail(body.email) : null;

  // --- 1. IP block check — always first, short-circuits everything else ---
  const { data: existingIpBlock } = await supabase
    .from('blocked_ips')
    .select('ip_address, expires_at')
    .eq('ip_address', ip)
    .maybeSingle();

  const ipBlocked =
    existingIpBlock && (!existingIpBlock.expires_at || new Date(existingIpBlock.expires_at) > new Date());

  if (ipBlocked) {
    return jsonResponse({ blocked: true, reason: 'ip_blocked', expiresAt: existingIpBlock!.expires_at });
  }

  // --- 2. Account lock check — only relevant if an email was sent ---
  if (email) {
    const { data: existingLock } = await supabase
      .from('account_lockouts')
      .select('expires_at')
      .eq('email', email)
      .maybeSingle();

    if (existingLock && (!existingLock.expires_at || new Date(existingLock.expires_at) > new Date())) {
      return jsonResponse({ blocked: false, accountLocked: true, accountExpiresAt: existingLock.expires_at });
    }
  }

  // checkOnly: report current status only. Logs nothing, counts nothing —
  // used for the on-page-load check so reloading never counts as an attempt.
  if (body.checkOnly) {
    return jsonResponse({ blocked: false, accountLocked: false });
  }

  // --- 3. Successful login: clear this account's failure history ---
  if (body.loginSucceeded && email) {
    await supabase.from('login_failures').delete().eq('email', email);
    return jsonResponse({ blocked: false, accountLocked: false });
  }

  // --- 4. Failed login: log it, check the per-account threshold ---
  if (body.loginFailed && email) {
    await supabase.from('login_failures').insert({ email });

    const since = new Date(Date.now() - LOGIN_FAIL_WINDOW_MIN * 60_000).toISOString();
    const { count: failCount } = await supabase
      .from('login_failures')
      .select('id', { count: 'exact', head: true })
      .eq('email', email)
      .gte('created_at', since);

    if ((failCount ?? 0) >= LOGIN_FAIL_THRESHOLD) {
      const expiresAt = new Date(Date.now() + ACCOUNT_LOCK_MIN * 60_000).toISOString();
      await supabase.from('account_lockouts').upsert({
        email,
        reason: 'repeated_failed_logins',
        locked_at: new Date().toISOString(),
        expires_at: expiresAt,
      });
      return jsonResponse({ blocked: false, accountLocked: true, accountExpiresAt: expiresAt });
    }

    return jsonResponse({ blocked: false, accountLocked: false });
  }

  // --- 5. IP-level logging (pre-flight check before every submit) ---
  await supabase.from('security_incidents').insert({
    ip_address: ip,
    event_type: body.flagged ? 'suspicious_input' : 'attempt',
  });

  const suspiciousSince = new Date(Date.now() - SUSPICIOUS_WINDOW_MIN * 60_000).toISOString();
  const { count: suspiciousCount } = await supabase
    .from('security_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('event_type', 'suspicious_input')
    .gte('created_at', suspiciousSince);

  const floodSince = new Date(Date.now() - FLOOD_WINDOW_MIN * 60_000).toISOString();
  const { count: floodCount } = await supabase
    .from('security_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .gte('created_at', floodSince);

  let blockMinutes = 0;
  let reason = '';

  if ((suspiciousCount ?? 0) >= SUSPICIOUS_THRESHOLD) {
    blockMinutes = SUSPICIOUS_BLOCK_MIN;
    reason = 'repeated_suspicious_input';
  } else if ((floodCount ?? 0) >= FLOOD_THRESHOLD) {
    blockMinutes = FLOOD_BLOCK_MIN;
    reason = 'request_flood';
  }

  if (blockMinutes > 0) {
    const expiresAt = new Date(Date.now() + blockMinutes * 60_000).toISOString();
    await supabase.from('blocked_ips').upsert({
      ip_address: ip,
      reason,
      blocked_at: new Date().toISOString(),
      expires_at: expiresAt,
    });
    return jsonResponse({ blocked: true, reason, expiresAt });
  }

  return jsonResponse({ blocked: false, accountLocked: false });
});