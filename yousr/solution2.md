What Should We Build? — Reproductive Potential Early-Warning & Guidance Platform
My recommendation: Build an AI-powered reproductive health awareness and early-action platform that helps people understand changes in their reproductive potential over time and guides them toward the right healthcare actions.

The key is that you should not build another period-tracking app or a fertility calculator. Build a solution that connects personal health information, preventive screening, evidence-based risk indicators, and personalized healthcare guidance in one place.

Let's break down what the challenge actually means and what you should build for your project.
1. Understand the Problem You're Solving
Imagine three people:
- Person A, age 24: Has irregular menstrual cycles and a family history of early menopause but doesn't know these could be reasons to seek medical advice.
- Person B, age 30: Is not planning to have children now but wants to understand how their reproductive health might change over time.
- Person C, age 35: Has a medical condition that could affect reproductive health and wants to understand whether they should consult a specialist.
Today, these people might need to visit multiple healthcare providers, undergo tests, and piece together their medical history themselves.

Your application should help them answer five questions:
1. What information about my reproductive health should I understand?
2. Have any relevant health indicators changed over time?
3. Which factors can I improve through lifestyle changes or medical care?
4. Should I consider a screening, consultation, or specialist referral?
5. What should my next step be, and when should I take it?
Your goal is to turn scattered health information into understandable insights and timely action.
2. The Product We Should Build
Product concept: ReproGuide AI
Working name: You can choose a different name for your final submission.

ReproGuide AI is a privacy-first digital platform that helps individuals understand their reproductive health, identify relevant changes over time, and access personalized, evidence-informed healthcare guidance.

It would have three interconnected components:











A. Individual Health Dashboard
For people who want to understand and manage their reproductive health.
B. AI-Powered Health Guidance
For explaining relevant indicators and recommending appropriate next steps.
C. Clinician Dashboard
For healthcare professionals who need a concise view of a patient's history, relevant changes, and potential need for assessment.

These components should share information only with appropriate authorization and consent.
3. Feature 1: Personalized Reproductive Health Profile
When a user signs up, the application guides them through a short, optional health questionnaire.
Information to collect
Category	Example information	Why it matters
Basic profile	Age and relevant health history	Provides context for interpreting health information
Reproductive history	Menstrual patterns, pregnancy history where relevant	Helps identify changes that may warrant assessment
Family history	Relevant family history, such as early menopause	May indicate a reason for earlier clinical discussion
Medical history	PCOS, endometriosis, or other relevant conditions	Some conditions can affect reproductive health
Lifestyle	Smoking, physical activity, sleep, and nutrition	Identifies potentially modifiable health factors
Laboratory results	Relevant hormone or other clinical test results	Adds clinical context when interpreted appropriately
Longitudinal data	Previous measurements and screening results	Helps identify changes rather than relying on a single snapshot


Users should be able to skip questions, control what they share, and update their information later.

Important: Not every input is appropriate for every person. The application should collect only information relevant to the user's circumstances and intended assessment.
What the user sees
After completing the questionnaire, the application displays a personalized health profile.

For example:

Your Reproductive Health Profile
- Health information: 7 of 10 relevant sections completed.
- Recent changes: Menstrual cycle regularity has changed over the last three months.
- Information to discuss: Your medical and family history may justify a conversation with a healthcare professional.
- Missing information: No relevant laboratory results have been added.
- Suggested next step: Complete your health history or discuss the reported change with a clinician.
These are illustrative examples, not actual clinical conclusions.

Notice the difference: the application explains what is known, what has changed, and what the user can do next. It does not claim to predict whether someone will become pregnant.
4. Feature 2: Longitudinal Reproductive Health Timeline
This should be one of your most important features because it directly addresses the challenge's requirement to show changes over time.

Most basic health applications display current information. Your application should help users understand how relevant indicators change across months or years.











Example dashboard
Your Health Journey
Indicator	Previous record	Current record	Interpretation
Menstrual cycle pattern	Regular	Increasingly irregular	A change worth discussing if persistent or concerning
Relevant laboratory result	Previous measurement	New measurement	Compare with clinical reference ranges and context
Lifestyle pattern	Low physical activity	More consistent activity	A potentially beneficial behavioral change
Health history	No reported symptoms	New symptoms reported	May warrant further assessment depending on symptoms


These are examples of how the interface might work, not a clinical interpretation of actual patient data.
Visualizations to implement
- A timeline of health events and screening results.
- Trend charts for available measurements.
- Markers showing when a user reports a new symptom or condition.
- Explanations of what changed between two assessments.
- Notifications when a reported change may warrant professional advice.
- A record of completed consultations, tests, and recommended follow-ups.
The key innovation
Instead of saying:

"Your fertility score is 62/100."

The application could say:

"Your recent records show a change in menstrual cycle regularity. Several factors can contribute to this change. If it persists, consider discussing it with a healthcare professional. Your current information cannot establish your fertility status."

That is more transparent, actionable, and consistent with the challenge.
5. Feature 3: AI-Powered Health Insight Assistant
This is where AI can make your project stand out.

Build a conversational assistant that explains reproductive health information in simple language.

Users should be able to ask questions such as:
- "What does my latest health report mean?"
- "Why am I being advised to consult a specialist?"
- "Which factors in my health profile can I change?"
- "What should I ask my doctor during my appointment?"
- "What information is missing from my health assessment?"
- "What are my options if I want to delay pregnancy?"
The assistant should use the user's authorized health information, approved medical knowledge sources, and relevant clinical guidance.
Example interaction
User:
"My menstrual cycle has become irregular. Should I be worried?"

AI assistant:

"Changes in menstrual cycles can have several causes, including stress, thyroid conditions, PCOS, changes in weight, and other health factors.

An irregular cycle does not, by itself, establish that you have a fertility problem.

To help you understand what to do next, I can help you review:
- How your cycle pattern has changed.
- Whether you have reported any other symptoms.
- Whether you have relevant medical or family history.
- What information you may want to discuss with a healthcare professional.
If the change is persistent, new, or concerning, consider arranging a clinical assessment."

The assistant should also recognize symptoms that require prompt medical attention and direct users to appropriate care.
How to implement it
A practical implementation could use:
- An LLM for natural-language explanations.
- A curated, medically reviewed knowledge base.
- Retrieval-augmented generation (RAG) for grounding responses in approved sources.
- Structured health records for user-specific context.
- A rules-based clinical guidance layer for defined escalation pathways.
- Source references and uncertainty statements in responses.
Do not let the LLM independently diagnose infertility, invent clinical risk percentages, or prescribe treatment.

AI should explain and guide, while qualified clinicians remain responsible for clinical assessment and decisions.
6. Feature 4: Personalized Next-Step Recommendations
Understanding a health concern is only useful if the user knows what to do next.

Your platform should translate available information into a prioritized list of appropriate actions.

For example:
Situation	Possible next step
User has incomplete health history	Complete relevant optional questions
User reports persistent cycle changes	Consider a clinical assessment
User has a relevant pre-existing condition	Discuss reproductive-health implications with their clinician
User is planning a pregnancy	Consider preconception counselling
User wants to understand fertility preservation	Offer educational information and a specialist consultation pathway
User has relevant laboratory results	Explain the limitations of the results and encourage appropriate clinical interpretation
User has completed a recommended consultation	Record completion and explain any clinician-recommended follow-up


The application should distinguish between three categories:

1. Self-care and health optimization

General, evidence-informed guidance about sleep, smoking cessation, physical activity, nutrition, and other relevant health behaviors.

2. Preventive assessment

Information about when a screening, test, or clinical conversation may be appropriate.

3. Professional care

A referral or recommendation to seek assessment from a qualified healthcare professional.

Recommendations must depend on the person's circumstances, available evidence, and applicable clinical guidance. Not every user needs every test.
Add a follow-up tracker
Once a user chooses a recommended action, allow them to:
- Save the action to their personal health plan.
- Schedule or record an appointment.
- Track whether the appointment occurred.
- Record whether a referral was completed.
- Add relevant results with their consent.
- Review how their health information has changed.
This creates a continuous cycle:

Understand → Assess → Act → Follow up → Review changes.

That cycle is more valuable than a one-time fertility report.
7. Feature 5: Clinician Dashboard
The challenge explicitly mentions usefulness for clinicians and the health system.

Therefore, I would include a separate clinician interface, even if it is a simplified prototype.











What clinicians should see
A clinician opens an authorized patient's profile and sees:

Patient Overview
- Relevant health and reproductive history.
- Patient-reported symptoms and changes.
- Available laboratory and screening results.
- Missing information and data-quality limitations.
- Relevant risk factors that may warrant discussion.
- Previous assessments and referral history.
- The patient's stated goals, where voluntarily provided.
Suggested Clinical Review
- Why the patient may benefit from further assessment.
- Which patient-reported changes triggered the suggestion.
- Relevant evidence or clinical guidance.
- What information is missing.
- Whether a referral or follow-up is outstanding.
The clinician can then review the information, make their own assessment, and document the agreed next steps.
Why this matters
Without the clinician dashboard, you would mainly be building a consumer wellness application.

With it, you address both sides of the challenge:
- Helping individuals make informed choices.
- Helping healthcare professionals identify patients who may benefit from earlier counselling or assessment.
8. Feature 6: Privacy, Consent, and User Control
Privacy should be a core feature, not something added at the end.

Reproductive health information is particularly sensitive, and the challenge explicitly requires protection against discrimination and unauthorized use.

Implement the following:
Feature	How it should work
Granular consent	Users choose which categories of information they share
Revocable permissions	Users can withdraw consent for future access
Data minimization	Collect only information needed for a defined purpose
Access control	Users and authorized clinicians receive different permissions
Audit history	Users can see when authorized parties accessed their information
Secure storage	Encrypt sensitive information in transit and at rest
Data separation	Keep reproductive-health information separate from unrelated business processes
User-controlled sharing	Allow users to review and authorize data sharing
Population-level analytics	Use appropriately protected, aggregated information for system insights


The system should prohibit using reproductive information for unrelated employment or insurance decisions and implement appropriate technical and organizational safeguards.

Consent withdrawal should stop future optional processing where applicable, subject to legitimate retention obligations and other legal requirements.

For an Abu Dhabi deployment, privacy and data handling must also be designed around applicable UAE health-data and personal-data requirements.
9. Feature 7: Population-Level Health Insights
This feature is primarily for healthcare organizations and public-health teams.

It helps answer questions such as:
- How many eligible people are completing reproductive-health assessments?
- How many users with relevant concerns are receiving counselling?
- Where are referrals not being completed?
- Which groups are not being reached by preventive services?
- How long does it take for a potential concern to lead to a clinical assessment?
- Are the recommendations performing differently across demographic groups?
Example system dashboard
Metric	What it measures
Assessment completion rate	Percentage of eligible users completing the assessment
Early counselling rate	Percentage receiving counselling before actively trying to conceive
Referral completion rate	Percentage completing recommended referrals
Time to assessment	Time between an identified concern and clinical assessment
Informed-choice quality	Whether users understand their options, limitations, and uncertainties
Equity of reach	Differences in access and completion across relevant groups
False reassurance	Cases in which a reassuring system output could have delayed appropriate assessment


Use aggregated, appropriately protected data and apply minimum reporting thresholds to reduce re-identification risk.

Population analytics should not expose identifiable reproductive histories or create unvalidated risk labels for individuals.
10. What Should You Actually Build for the Hackathon?
The complete vision is ambitious. You should not try to implement every feature at once.

I recommend building a working MVP with six core screens and one end-to-end journey.
Screen 1: Welcome and Consent
Include:
- A clear explanation of the product.
- The purpose of collecting reproductive-health information.
- Granular consent options.
- A way to skip optional questions.
- A privacy and data-sharing summary.
Screen 2: Health Profile
Include:
- Age and relevant medical history.
- Reproductive-health questions.
- Family history.
- Lifestyle information.
- An option to upload or manually enter relevant laboratory results.
- A progress indicator.
Screen 3: Reproductive Health Dashboard
Include:
- Profile completeness.
- A timeline of recorded health events.
- Available indicator trends.
- Changes requiring attention.
- Missing information and assessment limitations.
Avoid displaying an unexplained fertility score.
Screen 4: AI Health Assistant
Include:
- A conversational interface.
- Questions about the user's recorded health information.
- Evidence-grounded explanations.
- Clear statements about uncertainty.
- Suggested questions for a clinician.
Screen 5: Personalized Action Plan
Include:
- Recommended next steps.
- The reason for each recommendation.
- Priority and suggested timeframe where clinically justified.
- Appointment or referral tracking.
- Follow-up reminders.
Screen 6: Clinician Dashboard
Include:
- A list of authorized patients who may benefit from review.
- Patient-specific health summaries.
- Relevant changes over time.
- Evidence and limitations.
- Referral and follow-up status.
For the hackathon, the population-level dashboard can be a smaller additional view if time permits.
11. Recommended Technology Stack
If you are building a full-stack web application, this is a practical architecture.
Layer	Suggested technology	Purpose
Frontend	React or Next.js	Responsive patient and clinician interfaces
UI styling	Tailwind CSS and a component library	Consistent, polished design
Backend	NestJS	APIs, business logic, authorization, and workflows
Database	PostgreSQL	Users, health records, consent, assessments, and referrals
ORM	TypeORM	Database entities, relations, and migrations
Authentication	Secure session-based authentication or JWT with appropriate controls	User authentication
Authorization	Role-based and resource-level access control	Enforce permissions for patients and clinicians
AI	An LLM with retrieval-augmented generation	Explain approved medical knowledge in plain language
Charts	Recharts	Display longitudinal health information
File storage	Private, access-controlled object storage	Store reports and laboratory documents
Notifications	A secure notification service	Reminders and follow-up alerts


These are suggested technologies, not mandatory requirements.
Suggested backend modules
src/
├── auth/
├── users/
├── consent/
├── health-profile/
├── reproductive-history/
├── health-records/
├── assessments/
├── ai-assistant/
├── recommendations/
├── referrals/
├── clinician/
├── analytics/
└── audit-logs/

Example data flow
User
  |
  v
React / Next.js Frontend
  |
  v
NestJS API
  |
  +------ Authentication & Authorization
  |
  +------ Consent Management
  |
  +------ Health Profile
  |
  +------ Assessment & Guidance
  |             |
  |             v
  |      Approved Clinical Rules
  |             |
  |             v
  |      AI Explanation Layer
  |
  +------ Referral & Follow-up
  |
  v
PostgreSQL Database

The AI layer should not automatically receive every stored medical record. It should receive only the information necessary for the user's authorized request.

For a hackathon demonstration, use synthetic patient data rather than real reproductive-health records.
12. What Makes This Solution Innovative?
The individual features are not necessarily new. Health questionnaires, medical dashboards, and AI chatbots already exist.

Your innovation should come from how you connect them.

I would emphasize these four differentiators.
1. Change Detection Instead of Fertility Scoring
Rather than attempting to predict an individual's fertility with a single number, the system identifies changes in available health indicators and explains their significance and limitations.
2. From Insight to Action
Many applications provide information but do not help users complete the next step.

Your platform connects health insights to counselling, assessment, referrals, and follow-up tracking.
3. Patient and Clinician Collaboration
The individual and clinician see appropriate views of the same authorized health journey.

This helps reduce fragmentation while preserving clinical judgment.
4. Explainable and Privacy-First AI
Every significant recommendation should explain:
- What information triggered it.
- Why the information may matter.
- What evidence supports the guidance.
- What remains uncertain.
- What the user can do next.
This makes the product more trustworthy than an opaque AI-generated fertility score.
13. How Will You Demonstrate That It Works?
The challenge specifically asks for evidence of earlier action, better-informed choices, completed referrals, and equitable access.

Your prototype should therefore include measurable outcomes.
Success metric	How to measure it
Time to counselling	Time between a relevant health signal and counselling
Time to assessment	Time between a relevant health signal and professional assessment
Referral completion	Percentage of recommended referrals completed
User understanding	Whether users can correctly explain their options and the limits of the assessment
Assessment completion	Percentage of eligible users who complete the assessment
Missing-data transparency	Whether users understand when insufficient information limits the output
Safety	False-reassurance incidents and inappropriate recommendations
Equity	Differences in completion, counselling, and referral rates across relevant groups


For your hackathon, you can demonstrate the workflow using synthetic records and simulated scenarios.

However, a successful prototype is not evidence that the system improves clinical outcomes. Actual effectiveness requires prospective evaluation, appropriate clinical oversight, and validation in the intended population.
14. The Best MVP Demonstration Scenario
If I were presenting this solution to the judges, I would demonstrate the following user journey.

Step 1: A user creates an account.

A 29-year-old user wants to understand their reproductive health but is not currently trying to conceive.

Step 2: The user completes a consent-based health assessment.

They voluntarily report a relevant medical history and changes in their menstrual cycle.

Step 3: The dashboard identifies a change in their records.

The application explains that the change is worth discussing but cannot establish whether the user has a fertility problem.

Step 4: The AI assistant explains the finding.

It provides a plain-language explanation, describes uncertainty, and helps the user prepare questions for a healthcare professional.

Step 5: The user receives an appropriate next step.

The application offers a clinical assessment pathway rather than automatically prescribing tests or treatment.

Step 6: The user completes a consultation.

The consultation and agreed follow-up are recorded with appropriate authorization.

Step 7: The clinician reviews the longitudinal record.

The clinician can see the reported changes, relevant history, and previous actions without having to reconstruct the entire timeline.

Step 8: The system measures the outcome.

The prototype records the time from the initial concern to counselling or assessment and whether the referral was completed.

This single scenario demonstrates the core value proposition from beginning to end.
15. What You Should Avoid Building
To keep your project aligned with the brief, avoid these common mistakes.

Don't build:
- A generic period tracker with no longitudinal health assessment.
- A chatbot that merely answers reproductive-health questions.
- A fertility calculator that promises to predict pregnancy chances.
- An unexplained score such as "Your fertility is 78%."
- A system that diagnoses infertility based on age, symptoms, or incomplete records.
- A system that recommends hormone tests to everyone.
- A dashboard that collects sensitive data without clear consent.
- A risk-prediction model presented as clinically validated without evidence.
- A population dashboard that exposes individual reproductive histories.
These approaches either miss the central challenge or introduce avoidable safety and privacy problems.
Final Recommendation: What Should You Build First?
I would build ReproGuide AI: A Longitudinal Reproductive Health Early-Action Platform.

Its central workflow should be:

Consent → Health Assessment → Change Over Time → Explainable AI Insights → Personalized Next Steps → Clinical Follow-up → Outcome Measurement

Prioritize these deliverables:
Priority	Deliverable	Importance
P0	Consent and health-profile questionnaire	Establishes the user's authorized health context
P0	Longitudinal health dashboard	Directly addresses the central challenge
P0	Evidence-grounded recommendations	Translates information into appropriate action
P0	AI explanation assistant	Makes complex health information understandable
P1	Clinician dashboard	Connects individual insights to clinical care
P1	Referral and follow-up tracking	Demonstrates action rather than awareness alone
P2	Population-level analytics	Supports health-system planning and evaluation
P2	Integration with screening and health-age systems	Connects the platform to the wider Abu Dhabi healthcare ecosystem


The most important design principle: Your platform should not attempt to tell someone exactly how fertile they are. It should help them understand what their available health information can—and cannot—tell them, recognize relevant changes earlier, and take the right next step with appropriate professional support.

That is the solution most closely aligned with the challenge's objective, desired outcomes, and emphasis on preventive healthcare.