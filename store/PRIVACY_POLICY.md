# DeuTech Fit — Privacy Policy

_Last updated: 1 November 2026_

DeuTech Fit ("the extension") is a Chrome extension that analyzes job postings on LinkedIn and
StepStone against your CV. This policy explains what data the extension handles and where it goes.

## Summary

- The developer of DeuTech Fit **does not collect, receive, store or sell any of your data**. There is
  no DeuTech Fit server, account, analytics or advertising.
- Your settings and CV text are stored **only in your browser** (`chrome.storage.local`).
- When you click **Analyze**, the job posting and your CV text are sent **directly from your browser to
  Google's Gemini API**, using **your own API key**.

## Data the extension handles

| Data | Where it is stored | Where it is sent |
|---|---|---|
| Your Gemini API key | Your browser only | Google Gemini API (as authentication) |
| CV / resume text (extracted locally from your PDF) | Your browser only | Google Gemini API, when you click Analyze |
| German level, residence-permit type, target role | Your browser only | Google Gemini API, when you click Analyze |
| Job posting text (title, company, location, description) | Your browser only (last result) | Google Gemini API, when you click Analyze |
| Your PDF file | **Not stored.** Text is extracted on your device and the file is discarded | Nowhere |

To read the job you selected, the extension may also request that job's public posting page from
linkedin.com. The request sends no cookies or personal data.

## Google Gemini API

Analysis is performed by Google's Gemini API under **your** API key and your agreement with Google.
Google's handling of that data is governed by the
[Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms) and the
[Google Privacy Policy](https://policies.google.com/privacy). In particular:

- **If you are in the EEA, Switzerland or the UK**, Google applies its paid-service data terms even to
  free usage: your prompts and responses are not used to improve Google's products.
- **Elsewhere, on the free (unpaid) tier**, Google may use submitted content to improve its products,
  and human reviewers may read it. If you don't want that, use a paid Gemini API key, or remove
  sensitive details (phone number, address) from the CV text in Settings before analyzing.

## Donations

The "Buy me a coffee" button opens [buymeacoffee.com](https://buymeacoffee.com/owaistaha6h) in a new tab.
Donations are optional and handled entirely by Buy Me a Coffee under its own privacy policy. The
extension never sees or processes any payment information.

## Data retention and deletion

All data stays in your browser until you remove it. To delete everything, either:
- clear the fields in DeuTech Fit Settings and click Save, or
- uninstall the extension, which deletes all of its stored data.

## Data sharing

The developer does not sell, share or transfer your data to anyone. Data goes only to Google's Gemini
API, as described above, to provide the extension's single purpose.

## Children

The extension is not directed at children under 16.

## Changes

If this policy changes, the "Last updated" date above will be updated and the new version published at
this URL.

## Contact

Questions: **owaistaha67@gmail.com**
