# Temporary GitHub Pages review site

This repository is temporarily deployed through GitHub Pages so the client can review changes before their Cloudflare account is ready.

## Important temporary safeguards

- `index.html` contains `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">`.
- Do not add a `robots.txt` file that blocks crawlers: Google must be able to fetch the page to see the `noindex` directive.
- Do not submit the GitHub Pages URL to search engines or include it in a sitemap.

## When the client Cloudflare account is ready

Only after the user explicitly confirms that the production Cloudflare site is configured and live:

1. Deploy the site to the client-owned Cloudflare Pages account.
2. Verify the production domain and the live contact-form endpoint.
3. Remove the temporary `noindex` meta tag from `index.html` on the production branch.
4. Disable GitHub Pages in the repository settings.
5. Remove the `gh-pages` review branch if it is no longer needed.
6. Confirm the GitHub Pages URL no longer serves the review site.

Do not perform these steps before explicit user confirmation.
