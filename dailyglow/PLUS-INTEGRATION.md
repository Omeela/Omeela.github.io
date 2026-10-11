# DailyGlow Plus integration — sandbox development

This branch is **not deployed**. Do not enable real payments until the entire checkout/entitlement flow has been tested.

## Existing pieces
- `dailyglow/plus-subscriptions.sql`: private, user-readable subscription status table. Run it in the DailyGlow Supabase project's SQL editor.
- `supabase/functions/stripe-webhook/index.ts`: verifies the Stripe-Signature header using the webhook signing secret and handles subscription lifecycle notifications. Deploy as Supabase Edge Function `stripe-webhook`, with JWT verification **disabled for this webhook only** because Stripe does not send a Supabase JWT. Signature verification in the function is mandatory.

## Required secrets (Supabase, not GitHub)
- `STRIPE_WEBHOOK_SECRET`: the endpoint signing secret from the Stripe Sandbox webhook destination.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: supplied by Supabase Edge Functions or configured as function secrets. Never put the service role key in the browser or GitHub repository.

## Important unfinished work
1. Verify whether Stripe Managed Payments supports the required webhook and checkout metadata workflow for this account. The existing standalone test Payment Link **does not identify the signed-in DailyGlow user**, so it cannot safely unlock Plus.
2. Build an authenticated checkout-creation endpoint that validates the Supabase access token, associates Stripe checkout with the actual authenticated user, and places `dailyglow_user_id` in **subscription metadata**. Never trust a client-provided user ID. Use only Stripe Sandbox keys while testing.
3. Ensure webhook events are handled idempotently and out-of-order deliveries cannot regress subscription status; reconcile authoritative subscription state with Stripe's API. The initial webhook is a draft, not production-ready.
4. Add a browser-side subscription-status query and premium feature gates, with free fallback when status cannot be verified. Add real premium benefits before charging.
5. Test signup, paid checkout, renewal, failed payment, cancellation, refunds, and re-login. Confirm that payment without a linked DailyGlow account cannot grant access.
6. Switch to live Stripe credentials only after all checks pass and the owner explicitly approves the launch.

**Do not paste Stripe secret keys or Supabase service role keys into chat, HTML, JavaScript, or GitHub.**
