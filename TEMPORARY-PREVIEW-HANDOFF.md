# Temporary GitHub Pages review site

This repository is temporarily deployed through GitHub Pages so the client can review changes before their Cloudflare account is ready.

## Important temporary safeguards

- `index.html` contains `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`.
- Do not add a `robots.txt` file that blocks crawlers: Google must be able to fetch the page to see the `noindex` directive.
- Do not submit the GitHub Pages URL to search engines or include it in a sitemap.
- The contact form now posts to `/api/contact` (a Cloudflare Pages Function, see `functions/api/contact.js`). GitHub Pages serves static files only, so on the review site the form will show the error state — that is expected and does not indicate a bug.

## When the client Cloudflare account is ready

Only after the user explicitly confirms that the production Cloudflare site is configured and live:

1. Deploy the site to the client-owned Cloudflare Pages account (build output directory: repository root; `functions/` is picked up automatically as Pages Functions).
2. Add `RESEND_API_KEY` as an encrypted environment variable in the Cloudflare Pages project settings, using the client's Resend account, and confirm the sending domain is verified in Resend. Then verify the live contact-form endpoint (`/api/contact`) actually delivers an email.
3. Remove the temporary `noindex` meta tag from `index.html` on the production branch.
4. Disable GitHub Pages in the repository settings.
5. Remove the `gh-pages` review branch if it is no longer needed.
6. Confirm the GitHub Pages URL no longer serves the review site.

Do not perform these steps before explicit user confirmation.
