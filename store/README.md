# Submitting DeuTech Fit to the Chrome Web Store

| File | Use |
|---|---|
| `LISTING.md` | Every dashboard field, ready to paste: name, summary, descriptions (EN + DE), screenshots, permissions, privacy answers, reviewer notes |
| `PRIVACY_POLICY.md` | Privacy policy (Markdown) |
| `privacy.html` | Same policy as a page you can host. Its URL goes in the Privacy practices tab |

## Checklist

1. **Fill in the placeholders:** replace `[YOUR CONTACT EMAIL]` in `PRIVACY_POLICY.md` and `privacy.html`.
2. **Host the privacy policy.** Options:
   - Upload `privacy.html` to a free GitHub Pages repo, e.g. `https://<you>.github.io/deutech-fit/privacy.html`.
   - Or paste `PRIVACY_POLICY.md` into a public Notion / Google Docs page and use its share URL.
3. **Test on real pages:** run a full analysis on one LinkedIn job and one StepStone job using the prod build (`build/chrome-mv3-prod`).
4. **Build the zip:**
   ```bash
   npm run package
   ```
   This produces `build/chrome-mv3-prod.zip`.
5. **Register** at <https://chrome.google.com/webstore/devconsole> (one-time $5 fee) and click **New item**, then upload the zip.
6. Paste the fields from `LISTING.md`, upload the screenshots and promo tile, and add the reviewer test key.
7. **Submit for review.** First reviews usually take a few days. Broad host permissions (all of linkedin.com) can make the review take longer.

For each later update: bump `version` in `package.json`, run `npm run package`, then upload the new zip to the same item.
