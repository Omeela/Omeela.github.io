// Supabase Edge Function: stripe-webhook (Deno runtime)
// Deploy with JWT verification disabled ONLY for this endpoint.
// Configure STRIPE_WEBHOOK_SECRET in Supabase Edge Function secrets.
// Stripe's signing secret must never be committed to GitHub.
import { createClient } from 'npm:@supabase/supabase-js@2';

const encoder = new TextEncoder();
function hex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
async function signatureValid(payload: string, header: string, secret: string): Promise<boolean> {
  const fields = Object.fromEntries(header.split(',').map(p => p.trim().split('=', 2)));
  const timestamp = Number(fields.t);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = hex(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp + '.' + payload))));
  // Compare all provided v1 signatures, without returning early on mismatch.
  const candidates = header.split(',').filter(x => x.trim().startsWith('v1=')).map(x => x.trim().slice(3));
  return candidates.some(candidate => {
    if (candidate.length !== digest.length) return false;
    let diff = 0;
    for (let i = 0; i < digest.length; i++) diff |= digest.charCodeAt(i) ^ candidate.charCodeAt(i);
    return diff === 0;
  });
}
Deno.serve(async req => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !supabaseUrl || !serviceKey) return new Response('Server not configured', { status: 503 });
  const raw = await req.text();
  if (!await signatureValid(raw, req.headers.get('stripe-signature') || '', secret))
    return new Response('Invalid signature', { status: 400 });
  let event;
  try { event = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
  // An authenticated checkout-creation endpoint must create subscriptions with
  // metadata.dailyglow_user_id set to the Supabase auth user ID. Do NOT accept
  // a user ID directly from an untrusted browser or arbitrary Payment Link.
  const allowed = new Set(['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted']);
  if (!allowed.has(event.type)) return new Response('Ignored', { status: 200 });
  const sub = event.data?.object;
  const userId = sub?.metadata?.dailyglow_user_id;
  if (!userId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
    return new Response('Subscription not linked to DailyGlow user', { status: 422 });
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { error } = await db.from('dailyglow_subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    stripe_subscription_id: sub.id,
    status: event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status,
    current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) return new Response('Database write failed', { status: 500 });
  return new Response('OK', { status: 200 });
});
