# Beam Music: sign up, upload, sell downloads

Stack: static site + Netlify Functions + Supabase (accounts, database, private file storage) + Paystack (cards and mobile money in Ghana).
Money flow: the buyer pays your Paystack account. You keep FEE_PERCENT (default 20%) and owe the rest to the artist (shown in their Earnings box; you pay them out).

## 1. Supabase (free tier is fine)
1. Create a project at supabase.com. Open SQL Editor, paste supabase.sql, run it.
2. Authentication > Providers > Email: keep enabled. Authentication > URL Configuration: add your Netlify URL (and later your domain) as Site URL.
3. Settings > API: copy the Project URL, the anon key (goes in public/index.html), and the service_role key (secret, goes only in Netlify).

## 2. Paystack
1. Sign up at paystack.com/gh and complete business verification so you can go live.
2. Settings > API Keys: copy the Secret key.
3. Settings > API Keys & Webhooks: set the webhook URL to https://YOUR-SITE/api/paystack-webhook

## 3. Netlify
1. Edit public/index.html: replace PASTE_SUPABASE_URL and PASTE_SUPABASE_ANON_KEY.
2. Put this folder on GitHub, then in Netlify: Add new site > Import from Git. Or run `npx netlify deploy --prod`.
3. Site configuration > Environment variables:
   SUPABASE_URL, SUPABASE_SERVICE_KEY, PAYSTACK_SECRET_KEY, and optionally FEE_PERCENT (20), CURRENCY (GHS), SITE_URL (your final https URL).
4. Redeploy. Test with Paystack's test keys first (sk_test_...), then swap in live keys.

## 4. When you buy the domain
Netlify > Domain management > Add a domain. Follow its DNS steps (HTTPS is automatic). Then update SITE_URL, the Paystack webhook URL, and the Supabase Site URL to the new domain.

## Before you launch publicly
- Write Terms and a Privacy policy. Artists must confirm they own what they upload, and you need a way to take down infringing songs.
- You are holding other people's money until payout: get advice on tax and any licensing that applies in Ghana, and keep payouts on a regular schedule. `paid_out` in the purchases table is there to track them.
- Paid songs cannot be previewed yet (only buyers can play them). A 30-second preview clip is the natural next feature.

## Artist profiles
Every account can have a public profile page (photo, name, location, About text, website and Instagram), edited from "Edit profile".
Profiles are stored in Netlify Database (the table is created automatically on deploy from `netlify/database/migrations`) and photos in Netlify Blobs, so no extra Supabase SQL is needed. The profile functions use the same `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` variables to check who is logged in.
