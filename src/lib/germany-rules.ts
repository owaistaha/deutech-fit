/**
 * German work-permission facts that get injected into the Gemini prompt.
 * These change every January, so check them yearly against
 * https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card
 * and update RULES_YEAR + the numbers below.
 */
export const RULES_YEAR = 2026

export const BLUE_CARD_MIN_SALARY_EUR = 50_700 // standard occupations
export const BLUE_CARD_MIN_SALARY_SHORTAGE_EUR = 45_934.2 // shortage occupations (incl. IT) & recent graduates

export const GERMANY_RULES_BRIEF = `
German work-permission rules (as of ${RULES_YEAR}; this is guidance, not legal advice):
- Student (§ 16b AufenthG): may work 140 full days or 280 half days per year. A "Werkstudent" job is
  compatible only if it is max. 20 hours/week during lecture periods (full-time allowed in semester breaks).
  Mandatory internships (Pflichtpraktikum) required by the study program do not count against the limit;
  voluntary internships do. Full-time permanent roles are NOT compatible while studying.
- Language course (§ 16f): work is very restricted; most jobs are LOW fit.
- Job seeker / post-study (§ 20): graduates of German universities may take any employment during the
  18-month search period, then convert to § 18a/18b/18g once they have a qualified job offer.
- Opportunity Card / Chancenkarte (§ 20a): may work up to 20 h/week plus 2-week trial employments
  while searching for a qualified job.
- Skilled worker (§ 18a / § 18b): needs a job matching the recognised qualification.
- EU Blue Card (§ 18g): recognised degree + gross annual salary of at least
  EUR ${BLUE_CARD_MIN_SALARY_EUR.toLocaleString("en-US")} (standard) or EUR ${BLUE_CARD_MIN_SALARY_SHORTAGE_EUR.toLocaleString("en-US")}
  (shortage occupations such as IT/engineering, and graduates within 3 years of graduation).
  IT specialists without a degree can qualify with 3+ years of relevant experience at the lower threshold.
- Permanent residence and EU/EEA/Swiss citizens: no work restrictions.
`.trim()
