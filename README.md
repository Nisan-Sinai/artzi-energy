# Artzi Energy — bilingual solar website

A self-contained, static-site generator for a premium Hebrew/English solar-energy website, using Node 22+, no client-side framework or build dependencies. 50+ distinct routes **per locale**, including articles, guides, services, calculator, lead capture, privacy and accessibility notices.

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:4173/he/` or `/en/`.

## Verification

```bash
npm run lint
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

CI is required before merging. Do not merge while checks fail or remain unrun.

## Deployment

Vercel build: `npm run build`; output directory: `dist`. Preview deployment first. The historical standalone Vercel project `artzi-energy-studio` is separate from this Git repository; verify domain and ownership before any production cutover.

## Contact leads

Existing Supabase Edge Function: `submit-contact`, under project `edalkjxbodxyyhsomnlt`.

No service role keys are present client-side. Access to contact tables is blocked for anonymous browser roles via RLS. Production domains must be included in the Edge Function's explicit origin allowlist, and submit flows must pass E2E / rate limiting checks before production use.

## Publishing caveats

Photos are illustrative third-party Unsplash assets, not client projects. Verify usage rights, site facts, privacy controller details, retention policy, accessibility compliance and official business content before publishing. Lighthouse 95+ is a target, not an unverified claim. `robots.txt` intentionally disallows indexing during preview.
