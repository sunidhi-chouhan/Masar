You should be building a Reproductive Potential Early Insight Platform — a web or mobile application that helps people understand changes in their reproductive health over time and guides them toward appropriate next steps, before they encounter fertility difficulties.

The key is that this challenge is not asking you to build a fertility calculator or a medical diagnosis app. It is asking you to create a privacy-first, evidence-informed system that connects personal health information, early risk indicators, understandable explanations, and timely clinical support.
1. What exactly should you build?









1. Individual health dashboard

A person can enter their age, reproductive and family history, lifestyle information, relevant health conditions, and available laboratory results. They see a summary of their reproductive-health factors and how those factors change over time.












2. Longitudinal insight and risk-factor tracker

Show trends, relevant risk factors, missing information, and uncertainty. Explain which factors may be modifiable and which require professional assessment, rather than assigning a definitive fertility score.












3. Personalized action plan

Turn insights into practical next steps: health optimization, appropriate testing discussions, preconception counselling, fertility-preservation discussions when relevant, or referral to a qualified clinician.












4. Clinician dashboard

Allow authorized healthcare professionals to review relevant patient information, trends, missing data, and suggested follow-up actions, while leaving clinical decisions to the clinician.



2. The user journey you should demonstrate
Build one complete, realistic journey using synthetic patient data. This is the most important part of your prototype.
1. Onboarding and consent
   
   The user chooses which information to share and separately consents to each data source.
2. Health profile
   
   The user provides age, relevant reproductive history, family history, lifestyle factors, conditions and any available laboratory results.
3. Personalized interpretation
   
   The system identifies relevant factors, explains the evidence behind each insight, and highlights missing information.
4. Changes over time
   
   The dashboard compares available assessments across dates, distinguishes meaningful changes from normal variation, and explains uncertainty.
5. Recommended next steps
   
   The user receives appropriate educational guidance and can prepare questions for a clinician or request a consultation.
6. Clinical follow-up
   
   An authorized clinician reviews the summary, determines whether assessment is appropriate, and records follow-up actions.

3. What screens should you implement?
For a hackathon or initial MVP, focus on these six screens rather than building a huge healthcare platform.









Screen 1 — Welcome and consent
Essential
Explain the purpose of the platform, data usage, permissions, privacy controls, and consent withdrawal.











Screen 2 — My health profile

Collect relevant information through a guided form, with the ability to skip optional fields and review or edit entries.











Screen 3 — My reproductive health overview

Show known factors, historical observations, data completeness, and trends where repeated measurements are available.











Screen 4 — Understand my results

Explain what each finding means, its evidence and limitations, and what cannot be concluded from the available information.











Screen 5 — My next steps

Provide educational actions, suggested questions for a healthcare professional, and an appointment or referral workflow.











Screen 6 — Clinician view

Present a concise patient summary, relevant trends, evidence limitations, and follow-up status. Protect access through role-based authorization.



4. What makes your solution innovative?
A basic health dashboard is not enough. Your solution should address the specific gaps described in the challenge.
Challenge requirement	Your implementation
Earlier awareness	Help users understand relevant factors before trying to conceive
Longitudinal insight	Timeline of observations and changes, not a one-time score
Evidence-informed guidance	Explain why an insight appears, with sources and limitations
Personalization	Adapt educational next steps to available information and user preferences
Integrated healthcare	Demonstrate how authorized health data and clinical follow-up could connect
Privacy	Granular, revocable consent and access controls
Measurable impact	Track time to counselling, referral completion and informed-choice quality

Your strongest differentiator: a transparent Reproductive Health Trajectory that connects evidence, change over time, and appropriate action without pretending to predict an individual's fertility with certainty.
5. Suggested technical architecture
If you're implementing this as a full-stack application, you could use the following architecture:
Frontend

React / Next.js · Responsive user and clinician dashboards

Backend API

NestJS · Authentication · Authorization · Consent enforcement

Health data

PostgreSQL · Profiles · Observations · History


Insight engine

Evidence rules · Trend calculations · Action pathways



Safety and integration layer

Audit logs · Data-source permissions · Future clinical-system integrations


For the prototype, use synthetic data and simulated integrations. Do not imply that you have access to actual Abu Dhabi health records or that your assessment engine is clinically validated.
6. What should your final demo prove?
Your demonstration should answer these five questions:
- Can someone understand their reproductive-health information without medical jargon?
- Can they see how their information changes over time?
- Can they distinguish a relevant health factor from a confirmed fertility problem?
- Does the platform help them take an appropriate next step earlier?
- Can they control who accesses their sensitive information?
You can measure these with prototype metrics such as assessment completion, comprehension of uncertainty, time from an illustrative risk signal to a counselling recommendation, and completion of a simulated referral.
My recommendation
Build a polished, responsive application with six screens, one complete synthetic user journey, a transparent evidence-based insight engine, and a clinician view. Prioritize the individual dashboard, understandable interpretation, and next-step guidance first. Add real-world integrations only after the core journey works.

One important distinction: reproductive potential involves different biological and clinical factors across individuals and life stages. Avoid combining all those factors into an unvalidated numerical score or treating a single hormone result as a definitive measure of fertility.

That gives you a focused product that addresses the challenge directly, rather than simply another fertility-tracking app.
















what makes this application award winner for hackathon? 
Tell me, what features make it an award winning application. For the prototype, use synthetic data and simulated integrations. Do not imply that you have access to actual Abu Dhabi health records or that your assessment engine is clinically validated. then, can we implement this completely in next.js













To make this an award-winning hackathon application, I would not build another fertility tracker or a dashboard full of health charts. I would build a platform that demonstrates how reproductive-health risks can become understandable, actionable, and preventively managed — while protecting user privacy.

And yes, you can implement the entire prototype in Next.js, including the frontend, backend APIs, database integration, synthetic-data engine, clinician dashboard, and simulated healthcare integrations.
1. What would make this application stand out?
I would build the product around one distinctive concept:
Reproductive Health Intelligence — from signals to action
The application should help a user answer three questions:
1. What do I know about my reproductive health today?
2. What has changed, and how certain is that interpretation?
3. What should I consider doing next, and when should I seek professional advice?
The differentiator is the complete journey from personal health information to an explainable insight and a documented follow-up action.
2. The seven features I would prioritize for a winning prototype
These are the features I would invest in, in priority order. The goal is to make each feature demonstrable, useful, and meaningfully different from a conventional health app.









01 · Signature feature
Reproductive Health Trajectory

Show how a person's recorded health factors and observations change across multiple dates. Compare previous and current assessments, highlight new information, and distinguish actual observed changes from missing or outdated data.

Why it stands out: It directly addresses the challenge's requirement for longitudinal insight instead of a one-time fertility score.












02 · Explainable AI
Evidence & Uncertainty Engine

Every insight has four parts: what was observed, why it matters, what evidence supports the explanation, and what remains unknown. Display the relevant source and its review date.

Use a curated evidence library and deterministic rules for the prototype. AI can explain approved evidence in plain language, but it must not invent diagnoses or unsupported predictions.

Why it stands out: Judges can inspect the reasoning rather than trust an unexplained AI-generated score.












03 · Action-oriented
Signal-to-Action Care Pathway

Convert an insight into a next step: learn about a factor, prepare questions for a clinician, discuss appropriate testing, or request a consultation. Track whether the user completes the action.

Why it stands out: It demonstrates a pathway to earlier action, not just information presented on a screen.












04 · Trust by design
Consent & Privacy Control Centre

Let users grant and revoke access by data category and recipient. Show what is shared, when permission was granted, which clinician accessed information, and whether future sharing is disabled after revocation.

Include a visible privacy promise: reproductive data cannot be used for employment, insurance, or unrelated decisions within the proposed system.

Why it stands out: Privacy becomes a working product capability, not merely a statement in the footer.












05 · Integration
Synthetic Health Data Connectors

Simulate data arriving from a health application, laboratory results, a wearable, and a clinical record. Show the source, timestamp, authorization status, and last successful synchronization.

Add a demonstration button to import a new synthetic observation and update the timeline.

Why it stands out: It demonstrates how the product could fit into a wider healthcare ecosystem without falsely claiming access to real health systems.












06 · Clinical workflow
Clinician Review Workspace

Display an authorized patient's summary, relevant observations, data gaps, the reasons behind educational insights, and pending follow-ups. Allow the clinician to record a review and next action.

Why it stands out: It connects personal awareness to a plausible clinical workflow.












07 · System-level impact
Privacy-Preserving Population Insights

Demonstrate aggregate indicators such as counselling uptake, time to follow-up, referral completion, and participation across demographic groups where ethically appropriate.

Use synthetic records, minimum group-size thresholds, and suppression of small groups to reduce re-identification risks.

Why it stands out: It links individual benefit to health-system impact and prevention priorities.



These features also align with Abu Dhabi's published emphasis on preventive care, early risk detection, integrated care, and digital health infrastructure. 
Department of Health Abu Dhabi+2

The feature that could make the biggest difference
Combine features 1, 2, and 3 into a single seamless demonstration:

New information arrives → the trajectory updates → the system explains the change and its uncertainty → the user receives an appropriate next step → follow-up is tracked.

That is a compelling product story because judges can see the problem, the intelligence, and the outcome in one continuous journey.

One clinical guardrail matters here: hormone markers such as AMH cannot independently establish an individual's fertility. The American Society for Reproductive Medicine notes that ovarian-reserve tests have important limitations and must be interpreted in clinical context. 
ASRM+1

3. Can you implement the entire application in Next.js?
Yes. Next.js can power the complete hackathon prototype. You do not need to build a separate NestJS backend to demonstrate the product.

Next.js supports server-rendered interfaces, backend route handlers, server-side logic, authentication integrations, and database access. You can keep the prototype in one repository and deploy it as one application.
Next.js App Router

User dashboard · Profile · Timeline · Insights · Consent · Clinician workspace


Next.js server layer

Route Handlers · Server Actions · Authentication · Authorization · Validation


PostgreSQL

Profiles, observations, consents, history and referrals


Insight engine

Evidence rules, trend analysis and next-step logic




Privacy and simulated integrations

Consent checks · Audit logs · Synthetic lab, wearable and clinical data adapters


Recommended technology stack
Layer	Technology	Purpose
Framework	Next.js with App Router and TypeScript	Entire application
UI	Tailwind CSS + shadcn/ui	Polished, consistent interface
Charts	Recharts	Longitudinal trends and aggregate metrics
Backend	Next.js Route Handlers and Server Actions	API endpoints and mutations
Database	PostgreSQL	Persistent records and observations
ORM	Prisma	Database schema, queries and migrations
Authentication	Auth.js or another suitable auth provider	Sign-in and sessions
Validation	Zod	Validate inputs on the server
AI	Optional LLM API	Evidence-grounded plain-language explanations
Testing	Vitest + Playwright	Logic, authorization and end-to-end testing
Deployment	Vercel or another Next.js-compatible host	Run the prototype

You can use a managed PostgreSQL provider such as Neon or Supabase. If you choose a hosted authentication provider, configure authorization separately for each protected resource; successful sign-in alone does not mean someone can access a patient's records.
4. How I would structure the Next.js project
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── onboarding/
│   ├── (patient)/
│   │   ├── dashboard/
│   │   ├── health-profile/
│   │   ├── trajectory/
│   │   ├── insights/
│   │   ├── action-plan/
│   │   └── privacy/
│   ├── clinician/
│   │   ├── patients/
│   │   └── follow-ups/
│   ├── population-insights/
│   └── api/
│       ├── observations/
│       ├── insights/
│       ├── consent/
│       ├── referrals/
│       └── integrations/
├── components/
│   ├── dashboard/
│   ├── charts/
│   ├── insights/
│   ├── privacy/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   ├── evidence/
│   ├── insights/
│   ├── consent/
│   ├── audit/
│   └── integrations/
├── server/
│   ├── services/
│   └── repositories/
└── types/
prisma/
├── schema.prisma
└── seed.ts


This separates the interface, business rules, data access, and integration simulation even though they live in one codebase.
Core database models
I would begin with these models:
- User — identity and account role.
- HealthProfile — user-provided health information.
- Observation — dated measurements and health-history entries.
- ConsentGrant — recipient, data category, purpose, status and revocation time.
- EvidenceSource — source, publication date, supported claims and limitations.
- Insight — generated explanation, supporting observations and uncertainty.
- CareAction — recommended educational action and completion status.
- Referral — simulated referral and follow-up status.
- AuditEvent — record access, consent changes and important actions.
- IntegrationEvent — synthetic imports, timestamps and synchronization results.
For sensitive data, enforce access checks in server-side data-access functions and database queries, not just in the UI. A patient should only see their own records; a clinician should only see records for which they have appropriate authorization.
5. What should you actually finish for the hackathon?
Do not attempt to fully implement all seven features at equal depth. Build one polished, end-to-end experience and use the remaining features to demonstrate extensibility.
P1
Core

Complete the patient journey

Synthetic profile, consent, health trajectory, evidence-backed explanations, next-step guidance, and persistent history.



P2
Trust

Implement privacy and safety

Patient/clinician roles, server-side access checks, consent revocation, audit events, uncertainty explanations, and graceful handling of missing data.



P3
Wow factor

Build a live demonstration moment

Click “Import synthetic lab result,” watch the timeline update, inspect the explanation and its evidence, then complete a simulated referral.



P4
Impact

Show the clinician and system view

Demonstrate follow-up tracking and an aggregate population dashboard based entirely on synthetic records.



6. How to make the judges remember your application
Your pitch should communicate three things: the unmet need, the distinctive solution, and the measurable benefit.
Your 90-second demo story
1. Start with the problem. People can have relevant reproductive-health questions long before they actively try to conceive, yet their information and options may be fragmented.
2. Show the product. Open a synthetic user's longitudinal health timeline and explain what is known, what has changed, and what is missing.
3. Demonstrate the intelligence. Import a synthetic observation and show an evidence-grounded explanation, its limitations, and an appropriate next step.
4. Prove trust. Revoke a sharing permission and demonstrate that a subsequent unauthorized access attempt is blocked.
5. Close with impact. Show how the clinician can record follow-up and how the system measures completion without exposing individual records in population analytics.

Track measurable prototype outcomes such as:
- Percentage of users who correctly understand an insight.
- Time from a simulated signal to a suggested counselling action.
- Referral completion rate in the synthetic cohort.
- Percentage of unauthorized access attempts successfully blocked.
- Missing-data and uncertainty disclosure rates.
These are evaluation metrics, not proof that the prototype has already improved real-world clinical outcomes.
7. What you must avoid
A technically impressive application can still lose credibility if its medical claims or privacy design are weak.
- Do not invent a fertility probability or label someone fertile or infertile based on incomplete information.
- Do not let an LLM independently generate diagnoses or unverified medical recommendations.
- Do not pretend that simulated integrations connect to Malaffi, Sahatna, laboratory providers, or Abu Dhabi health records.
- Do not make consent revocation merely a visual toggle; enforce it on the server.
- Do not present synthetic performance metrics as validated clinical results.
- Do not claim clinical validation, regulatory approval, or production readiness without the appropriate evidence and review.
A hackathon prototype can demonstrate technical feasibility and a credible clinical workflow. A real clinical deployment would additionally require appropriate clinical validation, privacy and security review, regulatory assessment, and authorized health-system integrations.
Final recommendation
Build it entirely in Next.js for the prototype. Use PostgreSQL for persistence, Prisma for data access, deterministic and evidence-grounded logic for health insights, and simulated integrations to tell a complete story.

Your competitive advantage should not be the number of screens or the amount of AI. It should be the combination of longitudinal intelligence, explainable evidence, actionable follow-up, and enforceable privacy.

Those features map directly to the challenge and give judges something concrete to evaluate.