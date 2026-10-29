---
name: reproductive-potential-challenge
description: Product, clinical-safety, privacy and cultural context for the Abu Dhabi "[Fertility] Reproductive Potential" challenge (longitudinal view of reproductive health, direction of change not a fertility score, modifiable vs non-modifiable factors, intention-aware options, clinician and population views, granular consent, non-discrimination). Use for ANY design, spec, planning, coding, copywriting, data-model, AI/LLM prompt, UX, testing or review work in the Masar project, and whenever the user mentions reproductive potential, trajectory, PCOS, male factor, lifestyle and fertility, preconception counselling, fertility preservation, Health Age, Malaffi, or consent for reproductive data.
---

# Reproductive Potential Challenge — Build Context

Every feature in this project must serve the challenge below and respect its guardrails. Re-check the **Build Checklist** at the end before finishing any change. Domain detail (domains, rules, triggers, evidence labels, metrics, UAE context) lives in [reference.md](reference.md); the original brief is in [challenge-brief.md](challenge-brief.md).

## The challenge (one line)

How can we help individuals and health systems identify changes in reproductive potential earlier and translate them into timely, evidence-informed and personalized choices?

## Problem analysis

**What already exists:** age, cycle history, conditions (PCOS, thyroid, endometriosis), metabolic markers, AMH/semen results, Health Age, screening programmes, wellness apps. Data generation is largely solved.

**The real gap:** nobody watches the *direction of change* for people who are not yet trying to conceive, and nobody owns the moment a signal should become a conversation. The journey breaks in five places:
1. **Timing** — meaningful assessment happens only when trying or already struggling.
2. **Fragmentation** — history, lifestyle, conditions, labs and device data live in different places.
3. **Misjudgement** — people over- or under-estimate; single labs (e.g. AMH) get read as verdicts.
4. **Clinician blind spot** — no simple way to see who would benefit from earlier counselling.
5. **Trust** — reproductive data is intimate; fear of discrimination (employment, insurance, family) blocks sharing.

**Stakeholders:** individuals 18+ of any sex and intention (not planning, maybe later, trying, pregnant), couples, GPs, OB/GYN, urology/andrology, endocrinology, IVF and preconception clinics, DoH / programme administrators, labs and wellness platforms.

**Core tensions:**
| Tension | Resolution principle |
|---|---|
| Early awareness vs anxiety | Direction + confidence per domain, calm semantics, no alarms, no score |
| Simplicity vs honesty | Plain language plus explicit uncertainty and missing data; never round to certainty |
| Personalisation vs prescription | Intention-aware *options*, never a personal medical recommendation |
| Lifestyle empowerment vs pseudoscience | Modifiable factors shown with evidence strength; framed as wellbeing education |
| Clinician usefulness vs clinician burden | One-pager with provenance and gaps; clinician keeps every decision |
| System insight vs individual privacy | Aggregates with small-cell suppression; purpose-limited consent |

## Non-negotiable guardrails

### 1. No score, no verdict
- Never compute or display a fertility score, pregnancy probability, "fertile/infertile" label or any single number summarising reproductive potential.
- Output is per-domain **direction** (Improving / Stable / Shifting / Discuss / Unknown) plus **confidence** (High / Moderate / Low / InsufficientData).
- **False-reassurance guard:** InsufficientData can never render as Stable. Say "Not enough information to say."
- Labs are shown against reference ranges "to discuss with your clinician", never interpreted as fertility status.

### 2. Three-tier boundary (label every screen and message)
- **Education** — general reproductive health, lifestyle, what tests are. Fully automatable.
- **Decision support** — the person's own trajectory explained, options listed neutrally by intention. No recommendation of a specific option.
- **Clinical advice** — interpretation of results, testing decisions, treatment, fertility preservation decisions. **Only qualified clinicians.** Software routes, never substitutes.

### 3. Modifiable / non-modifiable / unknown
Every driver of a domain is tagged. Unknowns are written as invitations ("A thyroid panel would narrow this") with the data that would narrow them.

### 4. Language and framing
- Plain, non-directive, non-shaming. Use "may", "can", "worth discussing". Banned: "risk score", "declining", "poor", "infertile", "optimal", "warning", "defective", weight-shaming language.
- Every number sits beside a date and a source.
- Amber for Discuss; never red alarms or green "all clear". No streaks, no fear nudges.
- Arabic (MSA, warm register) and English, RTL-safe layouts, low-literacy friendly. Native review before demo.

### 5. Escalation to clinicians
Set Discuss and create a care action when any trigger in [reference.md](reference.md#escalation-triggers) fires (persistent cycle change, PCOS/endometriosis/thyroid with trying/maybe intention, age 35+ maybe-later without reserve data, abnormal or new semen analysis, family history, pregnancy with concerning symptoms, distress, personal "should I" questions). Any AI/chat feature must detect these and hand off, not answer.

### 6. Consent, privacy, non-discrimination
- Consent per source, per recipient role, per purpose; revocable; enforced server-side in one `authorize()` used by every data-access function. UI never decides access.
- Purposes: PersonalView, ClinicianReview, PartnerShare, PopulationAnalytics. **No purpose exists** for employment, insurance, marketing or unrelated apps; show this as a firewall in the UI.
- Partner sees only domain directions the other partner shared, never raw observations.
- Immutable audit log of every view, share, export and blocked attempt; user can see it.
- Analytics pseudonymised, k-anonymity threshold 10, small-cell suppression. No reproductive data in URLs, logs or notifications.
- Health data stays in UAE; encrypt at rest and in transit (design assumption).

### 7. AI usage rules
**Rules compute, AI explains, humans advise.**
- Allowed: paraphrasing approved content, translation, literacy adaptation, teach-back assessment, detecting distress/out-of-scope and handing off, predicting pathway drop-off, equity monitoring.
- Must be deterministic and auditable: domain direction and confidence, staleness, escalation triggers, care routing.
- Forbidden: generating medical facts or numbers, diagnosing, lifetime or pregnancy prediction, polygenic or any ranking score.

### 8. Honesty about the prototype
- Synthetic data only. Every integration (Malaffi, Health Age, labs, devices) is badged "Simulated".
- Never claim clinical validation, regulatory approval or real health-record access.

### 9. Measurement
Measure time from signal to counselling/assessment, referral completion, comprehension (teach-back), uncertainty disclosure rate, false-reassurance rate, privacy incidents and equity across language, gender, nationality, age and intention. **Never** use any reproductive choice (pregnancy, conception, preservation uptake, termination) as a success KPI.

## Desired outcomes → feature mapping

| Outcome (brief) | Masar features |
|---|---|
| Longitudinal view of change | Trajectory orbs per domain, confidence bands, 24-month timeline, staleness handling |
| Plain-language interpretation | Four-stanza insights (observed / why it may matter / evidence / still unknown), evidence chips, Living Well education |
| Timely personalized options | Intention selector, Care Router (Learn, Optimise, Test-discuss, Counsel, Preserve-discuss, Refer), tracked action states |
| Clinician and system usefulness | Clinician signal queue, one-pager with provenance and override, population funnel, cohort heatmap, equity panel |
| Privacy, non-discrimination, control | Consent Centre with lantern toggles, purpose firewall, access log, couple mode scopes |
| Evidence of earlier action | Metrics panel: time-to-counselling, referral completion, teach-back, uncertainty disclosure, false-reassurance, equity |

## Build Checklist (run for every feature)

```
- [ ] Serves a desired outcome in challenge-brief.md
- [ ] Tier labelled (Education / Decision support / Clinician only); clinical advice routed to humans
- [ ] No score, diagnosis or false certainty; direction + confidence; InsufficientData never shows Stable
- [ ] Drivers tagged modifiable / non-modifiable / unknown; unknowns say what would narrow them
- [ ] Copy plain, non-directive, non-shaming; banned words absent; numbers carry date + source
- [ ] Consent checked server-side via authorize(); least data shared; access and blocked attempts audited
- [ ] EN + AR with RTL; low-literacy friendly
- [ ] Escalation triggers detected and handed off (incl. any AI output)
- [ ] Metrics instrumented; no reproductive-choice KPI
- [ ] Simulated integrations and synthetic data labelled honestly
- [ ] No dark patterns: no pre-ticked consent, forced sharing, streaks or fear messaging
```
