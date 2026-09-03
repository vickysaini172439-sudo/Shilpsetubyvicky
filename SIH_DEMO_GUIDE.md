# ShilpSetu — SIH Demonstration Guide

A single, clear story: one artisan, one product, start to finish. Aim for
5-7 minutes. Do a full dry run at least once before the real demo, and once
with your laptop's WiFi turned off to confirm Demo Mode kicks in cleanly.

## Before you start

- Both servers running (`start_project.bat`, or the two manual commands).
- Optional: if you added a real `AI_API_KEY`, decide whether you want to
  show the "AI Generated" badge (real) or intentionally demo with WiFi off
  to show the honest "Demo Mode" fallback still working — either is a valid
  story, just be clear with judges about which one you're showing.

## The flow

1. **Landing page** — open `localhost:5173`, show the "Get Started" screen.
   Say: *"This is ShilpSetu — a virtual business manager for artisans."*

2. **Register** — fill in an artisan profile (name, phone, password,
   business name, craft category, description, location, state). Submit.
   Say: *"Registration collects everything needed for a business profile in
   one step — no separate onboarding flow."*

3. **Dashboard** — point out the Digital Readiness Score and checklist
   (currently low, since no products exist yet) and the quick-action tiles.

4. **Add Product** (My Products → + Add Product) — upload/take a product
   photo, give it a name and price, Publish.

5. **AI Product Photo Studio** — pick that product, adjust brightness/
   contrast, optionally toggle "Remove background," click Enhance with AI,
   show the Before/After, Save to Product.

6. **AI Multilingual Catalogue** — pick the product, tap 🎙️ Speak About
   Your Product, describe it in Hindi (or type it), click Create Catalogue
   with AI. Review the generated bilingual fields, point out the honest
   "Demo Mode" / "AI Generated" badge, edit anything, Save to Product.

7. **Smart Pricing** — enter material/labour/packaging/other costs, click
   Suggest a Price. Point out the explanation text and the "sample
   reference data" label. Apply the recommended price.

8. **AI Business Manager** — tap a suggested question like "How should I
   promote this product?" — show the contextual reply.

9. **Digitalise My Business** — add a WhatsApp number/social link,
   Publish the store.

10. **My Digital Store** — show the QR code and the "Share My Store"
    button. Open the public link (`/store/<slug>`) in a new tab — a
    visitor's view, no login required.

11. **Market Linkage** — show buyer-type suggestions matched to the
    product's category, and the general opportunities list.

12. **Back to Dashboard** — show the Digital Readiness Score has gone up,
    reflecting everything just completed.

## What to say if something breaks

Everything AI-related has an honest Demo Mode fallback built in — if a
network call fails, the app keeps working and clearly labels the fallback
rather than crashing. If the app itself has an error, stay calm, note it,
and move to the next step in the story; a working end-to-end flow matters
more than a single broken screen.

## Talking points that map to PS26090

- AI Image Enhancement → Photo Studio
- Multilingual Auto-Cataloguing + Voice → AI Catalogue
- Dynamic/Smart Pricing → Smart Pricing tool
- Virtual Business Manager → AI Business Manager chat
- Digital storefront creation → Digitalise My Business + My Digital Store
- Market linkage/readiness → Market Linkage + Digital Readiness Score
- Low-literacy-friendly interface → large buttons, icon+text nav, simple
  language throughout
- Year-round digital market access → the public storefront link/QR code
