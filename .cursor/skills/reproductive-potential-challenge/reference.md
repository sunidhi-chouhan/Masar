# Domain Reference — Reproductive Potential

Items marked **(verify)** are clinical or regulatory facts that change; confirm with current guidance (ASRM, ESHRE, NICE, WHO, DoH Abu Dhabi) and clinical advisors before relying on them in product copy. Nothing here is clinical advice; it is the boundary of what the software may say.

## Domains (independent, never summed)

| Domain | Applies to | Inputs | What moves direction |
|---|---|---|---|
| Cycle and ovulatory health | Female | cycle length and variance, missed cycles, bleeding changes, PCOS / endometriosis flags | regularity trend across 3+ months |
| Ovarian reserve context | Female | age band, AMH, AFC, FSH where present, family history of early menopause | age band change, new lab, family flag |
| Metabolic health | All | BMI trend, HbA1c / glucose, lipids, blood pressure, Health Age tile | trend across 2+ dates |
| Male factor context | Male | semen analysis where present, varicocele / history, heat exposure, smoking, alcohol, metabolic markers | new analysis, lifestyle trend |
| Conditions and history | All | PCOS, thyroid, endometriosis, STIs, surgeries, oncology, medications | new or changed condition |
| Lifestyle and recovery | All | sleep, activity, smoking, alcohol, stress, laughter / social support self-reports | check-in trend |

### Direction
`Improving` | `Stable` | `Shifting` | `Discuss` | `Unknown`

### Confidence
`High` | `Moderate` | `Low` | `InsufficientData`, computed from observation count, recency and source quality.

Staleness windows: labs 12 months; cycle self-report 3 months; lifestyle check-ins 3 months; conditions never stale but flagged "last confirmed on".

### Hard rules
- `InsufficientData` never renders as `Stable`.
- No probability of conception anywhere.
- A single lab never changes direction on its own except to `Discuss`; it narrows confidence.
- Rules are data and rendered human-readably at `/about/how-it-works`.

## Escalation triggers

Set `Discuss` and create a care action (type in brackets):
1. Cycle irregularity persisting 3+ months, or no period for 90+ days [Counsel / Test-discuss]
2. PCOS, endometriosis or thyroid flag with intention Trying or Maybe-later [Counsel]
3. Age 35+ with intention Maybe-later and no reserve data [Preserve-discuss]
4. Abnormal or newly added semen analysis; or male metabolic risk plus smoking [Test-discuss / Refer]
5. Family history of early menopause or genetic condition [Counsel]
6. Pregnant intention with concerning symptom or low mood [Refer, time-sensitive]
7. Distress or low-mood language in check-ins or explainer [support resources + Counsel]
8. Any personal "should I ...?" medical question in the explainer [hand off, do not answer]
9. Teach-back answered incorrectly twice [re-explain, then Counsel]

## Evidence strength labels

`Strong` (consistent guideline-level evidence) · `Moderate` (good observational / smaller trials) · `Emerging` (plausible, limited evidence). Each card carries a source id and review date. Lifestyle wellbeing topics (laughter, social support, stress-reduction) are capped at `Moderate`.

## Living Well content boundaries (Education tier)

| Hub | May say | May not say |
|---|---|---|
| PCOS / PCOD nourishment | lower glycaemic load, fibre and protein balance, anti-inflammatory pattern, movement and sleep *may support* metabolic and cycle health; weight framed as trend and context | diet cures PCOS; prescribe calories or a specific diet; weight-shaming |
| Men's reproductive lifestyle | smoking, alcohol, heat exposure, metabolic health and sleep are *associated* with semen parameters in general literature; when a semen analysis is something to ask about | diagnose male infertility; interpret a semen analysis |
| Lifestyle foundations | sleep, activity, substance use, caffeine as modifiable context | guarantees of outcome |
| Stress, preconception and pregnancy | stress physiology and cycles; stress in pregnancy and support; when to seek help | therapy; medication advice |
| Laughter and social warmth | mood and stress-buffering associations; relationship and community support | medical claims about conception |
| Fertility across life stages | age and reserve in plain language; what a preservation *discussion* involves; options listed neutrally | recommending preservation; success rates for the individual |

## Care Router

Intention: `NotPlanning` | `MaybeLater` | `TryingNow` | `Pregnant` | `PreferNotToSay`.
Action types: `Learn` | `Optimise` | `TestDiscuss` | `Counsel` | `PreserveDiscuss` | `Refer`.
States: `Suggested -> Requested -> Confirmed -> Attended -> OutcomeRecorded`, plus `Declined`, `Expired`. Every transition timestamped.

## Consent model

`ConsentGrant(subjectId, source, recipientRole, purpose, status, grantedAt, revokedAt)`
Sources: `SelfReport`, `MalaffiMock`, `LabMock`, `HealthAgeMock`, `DeviceMock`.
Recipient roles: `Self`, `Clinician`, `Partner`, `Analytics`.
Purposes: `PersonalView`, `ClinicianReview`, `PartnerShare`, `PopulationAnalytics`. No other purpose exists.
Audit event types: `View`, `Share`, `Export`, `ConsentChange`, `BlockedAccess`, `Import`, `ActionTransition`.

## UAE / Abu Dhabi context

- Malaffi is the Abu Dhabi health information exchange; Health Age and Sahatna exist as programme / patient-app concepts **(verify current scope)**. Prototype uses FHIR-shaped synthetic data (`Observation`, `Condition`, `Consent`, `ServiceRequest`) badged "Simulated".
- Data law design assumptions: UAE Federal Law No. 2 of 2019 (health data localisation), Federal Decree-Law 45/2021 (PDPL), DoH Abu Dhabi information security standard **(verify applicability)**. Assume in-country hosting, explicit consent, audit trails.
- Population: Emirati nationals plus a large expatriate population. Languages: Arabic, English first; Urdu, Hindi, Malayalam, Tagalog as roadmap.
- Cultural: fertility is intimate and family-adjacent; gender sensitivities around clinician choice; male factor is under-discussed. Offer same-gender clinician preference in booking copy.
- Donor gametes are not permitted under UAE medically assisted reproduction law; fertility preservation is available **(verify)**. Content on options must be neutral and reviewed.

## Measurement framework

| Dimension | Measures |
|---|---|
| Earlier action | median days signal -> Counsel requested; -> Attended; share of counselling before TryingNow |
| Referral | completion rate, drop-off per state |
| Comprehension | teach-back accuracy ("Does this tell you whether you can get pregnant?" correct: no) |
| Honesty | uncertainty disclosure rate; false-reassurance rate (Stable later contradicted by clinician) |
| Privacy | blocked access attempts, revocations honoured, audit completeness |
| Equity | all of the above by language, gender, nationality, age band, intention |

Explicitly excluded as KPIs: pregnancies, conceptions, preservation uptake, terminations, any reproductive choice.
