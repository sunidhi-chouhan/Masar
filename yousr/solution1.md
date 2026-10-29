# Submit this: **Masar** (مسار, "path"), a consent-first reproductive trajectory companion

**One-line pitch:** *"Not a fertility score. A map of how your reproductive potential is changing, who can see it, and what to do next, built on Abu Dhabi's existing health infrastructure."*

## Why this wins
Hackathon judges usually score on impact, feasibility, innovation, responsible design, and demo quality. Most teams will build a fertility-score app with a chatbot. You win by being the team that:
- **Reframes the problem** ("direction of change, not a label"), which is exactly the brief's language.
- **Plugs into things Abu Dhabi already has** (Malaffi, Health Age, screening, the patient app, the genomics programme), so it looks deployable, not hypothetical.
- **Makes privacy visible in the UI**, which is your strongest differentiator against everyone else.
- **Shows measurable outcomes**, such as time from risk signal to appointment, with a simulated pilot.
- **Demos end to end:** signal → explanation → booked appointment → clinician summary → population insight.

## Features

**Must-have (the demo depends on them)**
1. **Consent Center:** per-source and per-use toggles (personal view, clinician sharing, population analytics), revocable, with a visible audit log.
2. **Trajectory view:** 3–4 domains with direction arrows (stable, shifting, needs attention) and uncertainty bands, never a single number.
3. **"What would narrow this?" prompts:** show how adding an AMH result or semen analysis tightens the estimate.
4. **Factor explainer:** modifiable, non-modifiable, and unknown factors, each with an evidence-strength label.
5. **Intention selector:** "Not planning / Maybe in 5 years / Trying now." It changes every recommendation.
6. **Next-step cards with booking:** one tap creates a referral and a tracked status.
7. **Clinician one-pager:** trend, data provenance, uncertainty, discussion points, override button.
8. **Population dashboard:** de-identified cohorts, equity-of-reach panel, and the "time to counselling" metric.

**Wow factors (pick 3, don't build all)**
- **Arabic/English with full RTL**, switchable live in the demo.
- **Couple mode:** two people link accounts, each controlling what the other sees. This directly addresses the male-factor gap.
- **"Simulate a change" slider:** drag BMI, smoking, or glycaemic control and watch the uncertainty band shift, labelled as illustrative, not a promise.
- **False-reassurance guard:** if data is sparse, the app refuses to show "stable" and says "not enough information to say."
- **Privacy firewall panel:** a visual of "Employer ✕ Insurer ✕ Unrelated apps ✕" with the purpose-limitation rules.
- **Health Age link:** a "Reproductive context" tile inside the existing Health Age view.

**Deliberately excluded** (say this on a slide): no fertility score, no diagnosis, no streaks or anxiety alerts, no wearable requirement.

## Screen layouts (mobile-first, patient app)

**1. Welcome and intention**
```
┌─────────────────────────┐
│ مسار  Masar      EN | ع │
│                         │
│ Understand how things   │
│ change, on your terms.  │
│                         │
│ Where are you right now?│
│ ( ) Not planning        │
│ ( ) Maybe in a few yrs  │
│ ( ) Trying now          │
│ ( ) Prefer not to say   │
│                         │
│ [ Continue ]            │
│ Not a diagnosis. Learn  │
│ how your data is used ↗ │
└─────────────────────────┘
```

**2. Consent Center** (a hero screen, so design it beautifully)
```
┌─────────────────────────┐
│ Your data, your rules   │
│                         │
│ SOURCES                 │
│ Malaffi records   [ON ] │
│ Lab results       [ON ] │
│ Health Age        [ON ] │
│ Device/app import [OFF] │
│ Genomics          [OFF] │
│                         │
│ WHO CAN SEE             │
│ Just me           [ON ] │
│ My clinician      [ON ] │
│ Anonymous research[OFF] │
│                         │
│ 🛡 Never shared with    │
│ employers or insurers   │
│ [ View access log ]     │
└─────────────────────────┘
```

**3. Trajectory home**
```
┌─────────────────────────┐
│ Your trajectory         │
│ Last updated: Oct 2026  │
│                         │
│ Egg reserve    ↘ Shifting│
│ ░░░▒▒▒▓▓▓▒▒▒░░  range   │
│ Cycle health   → Stable* │
│ Metabolic      ↗ Improving│
│ Conditions     ⚠ Discuss  │
│                         │
│ *Limited data. Add an   │
│ AMH result to narrow    │
│ this. [ Add data ]      │
│                         │
│ ─ Suggested next step ─ │
│ Preconception           │
│ counselling  [ Book ]   │
└─────────────────────────┘
```
Use calm teal and sand tones, with amber for "discuss," never red alarms or green "all clear."

**4. Factor detail**
```
Metabolic health
What's affecting this
 ● Weight trend      Modifiable   Evidence: Strong
 ● Glycaemic control Modifiable   Evidence: Strong
 ● Sleep             Modifiable   Evidence: Moderate
 ● Age               Not modifiable
 ○ Thyroid           Unknown, no data
[ Simulate a change ]  [ Why this matters ]
```

**5. Next steps** are cards ordered by your intention: Optimize, Test, Counsel, Preserve, Refer. Each has a time estimate, what to expect, and a booking and status tracker (Requested → Confirmed → Attended).

**6. Clinician view (tablet/web)**
```
┌ Patient 34F ─ Consented sources: 4/5 ─────────────┐
│ Trend (24 mo)  [chart with uncertainty band]       │
│ Data provenance: AMH (Sep 26, lab), cycles (self)  │
│ Uncertainty: Moderate, no thyroid panel            │
│ Suggested discussion: AMH trend, PCOS follow-up    │
│ [Accept] [Modify] [Override + reason]              │
│ Referral status: Booked → Oct 30                   │
└────────────────────────────────────────────────────┘
```

**7. Population dashboard (health-system view):** a cohort heatmap (age band × condition × counselling received), an equity panel (nationality, language, gender, region), a funnel (signal → counselled → assessed → referral completed), and a calibration and false-reassurance monitor.

## Architecture and integrations
```
Patient app (React/Flutter) ─┐
Clinician web ───────────────┼─▶ API gateway ─▶ Consent service (policy engine, audit ledger)
Population dashboard ────────┘                      │
                                     ┌──────────────┼───────────────┐
                              FHIR adapter     Rules engine    Analytics (de-identified,
                              (Malaffi,        (ASRM/ESHRE/    k-anonymity, differential
                              labs, screening) WHO logic)      privacy aggregates)
                                     │
                       Health Age API · device imports · genomics (future)
```
- **Standards:** FHIR R4 resources (Observation, Condition, Consent, ServiceRequest). The FHIR `Consent` resource is a great slide: it shows consent is standards-based.
- **Segregated store:** reproductive data in its own encrypted partition, with role-based access and purpose tags on every query.
- **Rules first, ML second:** a transparent scoring-free rules engine, with an optional ML layer shown only as a roadmap item with subgroup calibration.
- **For the hackathon:** mock Malaffi and Health Age with FHIR-shaped synthetic data, and say so. Don't fake a real integration.

## Demo data
Create 4 synthetic personas so the story covers the equity angle:
- **Mariam, 33,** PCOS, never counselled. This is the primary demo path.
- **Omar, 36,** metabolic risk, interested in a couple pathway.
- **Fatima, 28,** not planning, sparse data. This shows the false-reassurance guard.
- **Sara, 38, expatriate,** Arabic/English toggle, trying now.

## 3-minute demo script
1. **0:00–0:25** The problem. "Most people get assessed only after they struggle to conceive."
2. **0:25–0:55** Consent Center. Toggle sources and show the audit log.
3. **0:55–1:40** Mariam's trajectory: the shifting domain, the sparse-data warning, adding an AMH result and watching the range narrow.
4. **1:40–2:10** The next-step card, one-tap booking, and the clinician one-pager.
5. **2:10–2:40** The population dashboard: "women 30–35 with PCOS and no counselling," and the equity panel.
6. **2:40–3:00** Impact numbers and the "what we refused to build" slide.

## Evidence slide
Include a simulated stepped-rollout design with a baseline versus target (e.g., median days from signal to counselling), plus the metrics from your brief: referral completion, informed-choice score, equity of uptake, calibration, false-reassurance rate, and opt-out rate. Label simulated numbers as simulated. Judges respect honesty over inflated claims.

## 48-hour build plan
- **Designer + frontend (1–2):** screens 2, 3, 5, 6 pixel-polished in Figma, then built. Spend your polish on the Consent Center and trajectory home.
- **Backend (1):** the FHIR-shaped mock API, consent policy checks, the audit log.
- **Clinical/rules lead (1):** the rules logic and evidence labels, with citations to guidelines (a clinician's name on the slide helps).
- **Pitch lead (1):** the story, the metrics slide, and the risk and ethics slide.

## Common ways teams lose
- Showing a number that looks like a fertility score.
- Over-claiming AI accuracy with no calibration story.
- Building breadth instead of one flawless end-to-end path.
- Ignoring male, unmarried, and non-Arabic-speaking users.
- Treating privacy as a closing bullet instead of a hero feature.