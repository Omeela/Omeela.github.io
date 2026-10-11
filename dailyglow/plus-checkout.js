/* DailyGlow Plus sandbox checkout. No private keys in browser. */
(() => {
  const button = document.getElementById('plusCheckout');
  const status = document.getElementById('plusCheckoutStatus');
  if (!button || !status) return;
  button.addEventListener('click', async () => {
    const stored = JSON.parse(localStorage.getItem('dailyglow-auth-v3') || 'null');
    if (!stored?.access_token) { status.textContent = 'Please log in to DailyGlow first.'; return; }
    button.disabled = true;
    status.textContent = 'Opening secure Stripe test checkout…';
    try {
      const response = await fetch('https://qiblcmoqjxgolakdrgpx.supabase.co/functions/v1/create-plus-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + stored.access_token },
        body: '{}'
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.message || 'Checkout unavailable');
      const target = new URL(payload.url);
      if (target.protocol !== 'https:' || !(['checkout.stripe.com', 'checkout.stripe.dev'].includes(target.hostname))) throw new Error('Unexpected checkout address');
      window.location.assign(target.href);
    } catch (error) {
      status.textContent = error.message || 'Could not open checkout.';
      button.disabled = false;
    }
  });
})();
