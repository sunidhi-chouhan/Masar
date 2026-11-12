import { t, type Lang } from "@/lib/i18n";

// Presenter copy for the isolated Experience Simulator. Product strings still
// go through `t()` so existing Arabic is reused. Strings that exist only in
// this demonstration live in EXTRA.

export type L10n = { en: string; ar: string };

export const line = (lang: Lang, s: L10n) => (lang === "ar" ? s.ar : s.en);

/** Connected tissue that the live product does not already translate. */
export const EXTRA: Record<string, string> = {
  Strong: "قوية",
  Moderate: "متوسطة",
  "Nothing you told Masar is part of this comparison.": "لا شيء مما أخبرتم به مسار يدخل في هذه المقارنة.",
  "What you tell us is off, so your answers are not in this view.": "«ما تخبروننا به» متوقف، لذلك إجاباتكم ليست في هذا العرض.",
  "Lab results are off, so laboratory values are not in this authorised view.": "نتائج المختبر متوقفة، لذلك قيم المختبر ليست في هذا العرض المأذون.",
  "Phone and wearable is off, so cycle dates and sleep from that source are not in this view.": "الهاتف والأجهزة القابلة للارتداء متوقفة، لذلك تواريخ الدورة والنوم من هذا المصدر ليست في هذا العرض.",
  "The Health Age check is off, so weight from that check is not in this view.": "فحص العمر الصحي متوقف، لذلك الوزن من ذلك الفحص ليس في هذا العرض.",
  "What you tell us is off, so family history and plans from that source are not in this view.": "«ما تخبروننا به» متوقف، لذلك التاريخ العائلي والخطط من هذا المصدر ليست في هذا العرض.",
  "Clinic records are off, so diagnoses from that source are not in this view.": "سجلات العيادات متوقفة، لذلك التشخيصات من هذا المصدر ليست في هذا العرض.",
  "No condition is recorded in the shared clinic record. That is not a finding that none exists.": "لا توجد حالة مسجّلة في سجل العيادة المشارَك. هذا ليس استنتاجًا بأن الحالة غير موجودة.",
  "Not enough information to say whether this has changed. One reading is never a trend.": "لا توجد معلومات كافية للقول إن كان هذا قد تغيّر. القراءة الواحدة ليست اتجاهًا أبدًا.",
  "The two results are too close in time for Masar's published comparison.": "النتيجتان متقاربتان زمنيًا أكثر مما تسمح به مقارنة مسار المنشورة.",
  "This comparison meets Masar's published rule. It is not a prediction about you.": "هذه المقارنة تستوفي قاعدة مسار المنشورة. وهي ليست توقعًا بشأنكم.",
  "This comparison stays inside Masar's published rule for usual variation. It is not a verdict about you.": "هذه المقارنة تبقى ضمن قاعدة مسار المنشورة للتذبذب المعتاد. وهي ليست حكمًا بشأنكم.",
  "No guideline citation is attached to this comparison in Masar's published rules.": "لا يوجد استشهاد بدليل إرشادي مرتبط بهذه المقارنة في قواعد مسار المنشورة.",
  "Masar is not looking for a conversation until you allow it. The comparisons are still shown.": "لا يبحث مسار عن محادثة حتى تسمحوا بذلك. وتبقى المقارنات معروضة.",
  "Missing information is not a negative finding.": "المعلومة الغائبة ليست نتيجة سلبية.",
  "I can see only what was shared with the clinician.": "لا أرى إلا ما تمت مشاركته مع الطبيبة.",
  "Nothing in the shared information meets a published reason for a conversation.": "لا شيء في المعلومات المشارَكة يستوفي سببًا منشورًا لمحادثة.",
  "We can still talk. I will not invent a finding.": "يمكننا الحديث مع ذلك. ولن أخترع نتيجة.",
  "I decide with you. Masar does not prescribe. This screen is not an appointment and not a call.": "القرار لي معكم. مسار لا يصف علاجًا. وهذه الشاشة ليست موعدًا وليست مكالمة.",
  "A reason is needed when you disagree.": "يلزم سبب عند الاختلاف.",
  "Women": "النساء",
  "Men": "الرجال",
  Emirati: "إماراتيون",
  "Other Arab": "عرب آخرون",
  "South Asian": "جنوب آسيا",
  Filipino: "فلبينيون",
  Western: "غربيون",
  Other: "فئات أخرى",
  Arabic: "العربية",
  English: "الإنجليزية",
  Urdu: "الأردية",
  Hindi: "الهندية",
  Tagalog: "التاغالوغ",
  "Nationality group": "فئة الجنسية",
  Language: "اللغة",
  Sex: "الجنس",
  Age: "العمر",
  Hidden: "مخفي",
  "Target — not a measured result": "هدف للتقييم — ليست نتيجة مقيسة",
  "Family-planning intentions": "نوايا تكوين الأسرة",
  "Personal and reproductive history": "التاريخ الشخصي والإنجابي",
  "Relevant medical and family history": "التاريخ الطبي والعائلي ذو الصلة",
  "Lifestyle and metabolic context": "نمط الحياة والسياق الأيضي",
  "Age and life stage": "العمر ومرحلة الحياة",
  "Available laboratory information": "معلومات المختبر المتاحة",
  "Other authorised information": "معلومات أخرى مأذون بها",
  Modifiable: "يمكن تغييره",
  "Not modifiable": "لا يمكن تغييره",
  "Confirmed synthetic record": "سجل اصطناعي مؤكد",
  "Simulated consultation. Not an appointment and not a call.": "استشارة محاكاة. ليست موعدًا وليست مكالمة.",
  "Illustrative. Gemini is not called in this demonstration.": "توضيحي. لا يُستدعى Gemini في هذا العرض.",
  "Family history is not a series of measurements, so Masar does not call it a trend.": "التاريخ العائلي ليس سلسلة قياسات، لذلك لا يسميه مسار اتجاهًا.",
  "None of the listed conditions.": "لا شيء من الحالات المذكورة.",
  "This is a self-report, not a laboratory measurement.": "هذا إبلاغ ذاتي، وليس قياسًا مختبريًا.",
  "What we know": "ما نعرفه",
  "What you told us": "ما أخبرتمونا به",
  "What changed": "ما تغيّر",
  "Why it matters": "لماذا يهم",
  "How certain we are": "مدى اليقين",
  "What we cannot conclude": "ما لا نستطيع استنتاجه",
  "Previous scene": "المشهد السابق",
  "Next scene": "المشهد التالي",
  Reveal: "إظهار",
  "Hide last": "إخفاء الأخير",
  Play: "تشغيل",
  Pause: "إيقاف مؤقت",
  "Restart story": "إعادة القصة",
  Notes: "ملاحظات",
  "Presenter notes": "ملاحظات المقدّم",
  "Jump to scene": "الانتقال إلى مشهد",
  "Share prepared sources": "مشاركة المصادر المجهزة",
  "Use Noura's answers": "استخدام إجابات نورة",
  "Simulated demonstration": "عرض محاكى",
  "Back to Demo Studio": "العودة إلى استوديو العرض",
  "Of": "من",
};

export function tr(lang: Lang, text: string): string {
  if (lang === "ar" && EXTRA[text]) return EXTRA[text];
  return t(lang, text);
}

export interface SceneMeta {
  id: string;
  beats: number;
  tier: L10n;
  title: L10n;
  challenge: L10n;
  notes: L10n;
}

export const SCENES: SceneMeta[] = [
  {
    id: "discover",
    beats: 3,
    tier: { en: "Education", ar: "تثقيف" },
    title: { en: "Discover earlier awareness", ar: "اكتشاف الوعي المبكر" },
    challenge: { en: "Information is fragmented, and guidance often arrives late.", ar: "المعلومات مبعثرة، وغالبًا ما يأتي التوجيه متأخرًا." },
    notes: {
      en: "Noura Al Mansouri, 34, is fictional. She arrives after a Health Age check. The drawing is an illustration of the timing gap, not her chart and not a score. Reveal the threads joining, then the promise that the rest of the story stays with her.",
      ar: "نورة المنصوري، ٣٤ عامًا، شخصية خيالية. تصل بعد فحص العمر الصحي. الرسم توضيح لفجوة التوقيت، وليس مخططها ولا درجة. أظهروا التقاء الخيوط، ثم أن بقية القصة تبقى معها.",
    },
  },
  {
    id: "trust",
    beats: 2,
    tier: { en: "Education", ar: "تثقيف" },
    title: { en: "Trust, consent and control", ar: "الثقة والإذن والتحكم" },
    challenge: { en: "She decides what Masar and a clinician may see.", ar: "هي من يقرر ما يجوز لمسار وللطبيبة أن يرياه." },
    notes: {
      en: "Every switch starts off. Turn sources on, then turn Lab results off and show the values leave the authorised list. Assistant consent and report-reading consent are separate. Neither calls Gemini here. Nothing is written to a real consent record. Employers, insurers and marketing have no purpose.",
      ar: "كل المفاتيح تبدأ متوقفة. فعّلوا المصادر، ثم أوقفوا نتائج المختبر وأظهروا خروج القيم من العرض المأذون. إذن المساعد وإذن قراءة التقارير منفصلان. ولا يُستدعى Gemini هنا. ولا يُكتب سجل إذن حقيقي. لا غرض لأصحاب العمل أو التأمين أو التسويق.",
    },
  },
  {
    id: "questions",
    beats: 1,
    tier: { en: "Decision support", ar: "دعم القرار" },
    title: { en: "Understand Noura", ar: "فهم نورة" },
    challenge: { en: "Questions follow her answers. She can skip, review and edit.", ar: "الأسئلة تتبع إجاباتها. يمكنها التخطي والمراجعة والتعديل." },
    notes: {
      en: "These are the live product's questions and the same reasons. Symptoms are not asked if she says she has had no period for three months or more. Her prepared answers match the synthetic record and do not add a new rule. A presenter shortcut fills them. They stay in this browser only.",
      ar: "هذه أسئلة المنتج الحي والأسباب نفسها. لا يُسأل عن الأعراض إذا قالت إن الدورة انقطعت لثلاثة أشهر أو أكثر. إجاباتها المجهزة تطابق السجل الاصطناعي ولا تضيف قاعدة جديدة. اختصار المقدّم يملؤها. وتبقى في هذا المتصفح فقط.",
    },
  },
  {
    id: "picture",
    beats: 3,
    tier: { en: "Decision support", ar: "دعم القرار" },
    title: { en: "One health picture", ar: "صورة صحية واحدة" },
    challenge: { en: "Each source contributes, and provenance stays visible.", ar: "كل مصدر يساهم، ويبقى مصدر المعلومة ظاهرًا." },
    notes: {
      en: "Confirmed synthetic records carry a source and a date. Questionnaire answers are marked You said. Nothing was extracted by an assistant. If a source is off, its values are absent. An empty clinic record is not a negative finding.",
      ar: "السجلات الاصطناعية المؤكدة تحمل مصدرًا وتاريخًا. إجابات الاستبيان موسومة بـ«ما قلتموه». لم يُستخرج شيء بواسطة مساعد. إذا كان المصدر متوقفًا فقيمه غائبة. وسجل العيادة الفارغ ليس نتيجة سلبية.",
    },
  },
  {
    id: "changes",
    beats: 3,
    tier: { en: "Decision support", ar: "دعم القرار" },
    title: { en: "Identify changes earlier", ar: "ملاحظة التغيّر مبكرًا" },
    challenge: { en: "What changed, what stayed steady, and what cannot be said.", ar: "ما تغيّر، وما بقي ثابتًا، وما لا يمكن قوله." },
    notes: {
      en: "Do not describe this as a score. Her AMH fall meets the published rule (25% or more, at least six months apart). Her BMI change does not meet the published 1.0 rule. Her cycles stay inside 21–35 days. One sleep reading cannot show a trend. Those sentences come from the existing rules.",
      ar: "لا تصفوا هذا كدرجة. انخفاض AMH لديها يستوفي القاعدة المنشورة (25% أو أكثر، وبينهما ستة أشهر على الأقل). تغيّر مؤشر كتلة الجسم لا يستوفي قاعدة 1.0 المنشورة. دوراتها تبقى ضمن 21–35 يومًا. قراءة نوم واحدة لا تُظهر اتجاهًا. وهذه الجمل من القواعد القائمة.",
    },
  },
  {
    id: "evidence",
    beats: 3,
    tier: { en: "Decision support", ar: "دعم القرار" },
    title: { en: "Evidence and uncertainty", ar: "الدليل وعدم اليقين" },
    challenge: { en: "A guideline is about people in general, never a prediction about her.", ar: "الدليل الإرشادي عن الناس عمومًا، وليس توقعًا بشأنها." },
    notes: {
      en: "Walk one observation through the six parts: what we know, what she said, what changed, why it matters, how certain we are, and what we cannot conclude. Steady is not reassurance that everything is fine. Unknown never becomes Steady. If the assistant switch is on, still say Gemini is not called in this simulator.",
      ar: "امشوا في ملاحظة واحدة عبر الأجزاء الستة: ما نعرفه، وما قالته، وما تغيّر، ولماذا يهم، ومدى اليقين، وما لا نستطيع استنتاجه. «ثابت» ليس طمأنة بأن كل شيء على ما يرام. و«غير معروف» لا يصبح «ثابتًا». وإذا كان مفتاح المساعد مفعّلًا، فقولوا إن Gemini لا يُستدعى في هذا المحاكي.",
    },
  },
  {
    id: "options",
    beats: 2,
    tier: { en: "Decision support", ar: "دعم القرار" },
    title: { en: "Personalised choices", ar: "خيارات تناسبها" },
    challenge: { en: "Options follow the fired rules. She stays in control.", ar: "الخيارات تتبع القواعد التي تحقّقت. والقرار يبقى لها." },
    notes: {
      en: "Only options attached to her current signals appear. With her prepared story that is a conversation, a test to discuss, a preservation discussion, and learning. Optimise and Refer do not appear unless a rule offers them. Masar does not choose for her and does not prescribe.",
      ar: "لا تظهر إلا الخيارات المرتبطة بإشاراتها الحالية. في قصتها المجهزة: محادثة، وفحص للنقاش، وحديث عن الحفظ، وتعلّم. لا يظهر تحسين نمط الحياة ولا التحويل إلا إذا عرضتهما قاعدة. مسار لا يختار عنها ولا يصف علاجًا.",
    },
  },
  {
    id: "clinician",
    beats: 3,
    tier: { en: "Clinician only for the decision", ar: "القرار للطبيبة فقط" },
    title: { en: "Clinician consultation", ar: "استشارة الطبيبة" },
    challenge: { en: "The clinician sees only the shared summary, and decides.", ar: "لا ترى الطبيبة إلا الملخص المشارَك، وهي من تقرر." },
    notes: {
      en: "Leave sharing off first and show the blocked view. Then turn on My family doctor. The decision is the live workflow: accept, add a test, or disagree with a reason. The conversation afterwards is simulated. No call, no appointment, and no request is saved to the demo accounts.",
      ar: "اتركوا المشاركة متوقفة أولًا وأظهروا المنع. ثم فعّلوا «طبيبة العائلة». القرار هو مسار العمل الحي: الموافقة، أو إضافة فحص، أو الاختلاف مع سبب. المحادثة بعدها محاكاة. لا مكالمة، ولا موعد، ولا يُحفظ طلب في حسابات العرض.",
    },
  },
  {
    id: "population",
    beats: 3,
    tier: { en: "Planning", ar: "تخطيط" },
    title: { en: "Health-system insights", ar: "رؤى النظام الصحي" },
    challenge: { en: "Aggregates help planning and never replace a clinical decision.", ar: "المجاميع تساعد التخطيط ولا تغني عن قرار سريري." },
    notes: {
      en: "Noura is excluded from these counts. Groups under 10 are hidden, including the exact count. These are counts of synthetic residents the published rules would speak to, not attendance rates and not improvement percentages.",
      ar: "نورة مستبعدة من هذه الأعداد. المجموعات دون 10 مخفية، بما في ذلك العدد نفسه. هذه أعداد مقيمين اصطناعيين ستحدثهم القواعد المنشورة، وليست نسب حضور وليست نسب تحسّن.",
    },
  },
  {
    id: "impact",
    beats: 2,
    tier: { en: "Education", ar: "تثقيف" },
    title: { en: "What a pilot would measure", ar: "ما يقيسه البرنامج التجريبي" },
    challenge: { en: "Name the measure, the data it needs, and that it is not yet a result.", ar: "سمّوا المقياس، والبيانات التي يحتاجها، وأنه ليس نتيجة بعد." },
    notes: {
      en: "Do not quote an improvement percentage. Every tile is an evaluation target. The teach-back is the instrument: the accurate answer is that this does not say whether she can get pregnant. One answer is not a success rate. Pregnancy is not a KPI.",
      ar: "لا تذكروا نسبة تحسّن. كل خانة هدف للتقييم. سؤال الفهم هو الأداة: الإجابة الدقيقة أن هذا لا يقول هل يمكنها الحمل. إجابة واحدة ليست نسبة نجاح. والحمل ليس مؤشر أداء.",
    },
  },
  {
    id: "outcome",
    beats: 2,
    tier: { en: "Education", ar: "تثقيف" },
    title: { en: "The Masar outcome", ar: "حصيلة مسار" },
    challenge: { en: "Earlier awareness, clearer understanding, evidence-informed choices, timely clinical support, responsible population insight.", ar: "وعي أبكر، وفهم أوضح، وخيارات مبنية على الدليل، ودعم سريري في وقته، ورؤية سكانية مسؤولة." },
    notes: {
      en: "Close on the resident, the clinician and the health system as one story. End on the line: direction and confidence, never a single score. Invite questions. Do not claim clinical validation.",
      ar: "اختموا بالمقيمة والطبيبة والنظام الصحي كقصة واحدة. انتهوا بالجملة: اتجاه وثقة، لا درجة واحدة أبدًا. افتحوا باب الأسئلة. ولا تدّعوا اعتمادًا سريريًا.",
    },
  },
];

export const EQUITY_KEY: Record<string, string> = {
  female: "Women",
  male: "Men",
  ar: "Arabic",
  en: "English",
  ur: "Urdu",
  hi: "Hindi",
  tl: "Tagalog",
  Emirati: "Emirati",
  OtherArab: "Other Arab",
  SouthAsian: "South Asian",
  Filipino: "Filipino",
  Western: "Western",
  Other: "Other",
};

export const IMPACT: {
  id: string;
  title: L10n;
  definition: L10n;
  data: L10n;
}[] = [
  {
    id: "time",
    title: { en: "Time from relevant signal to counselling or assessment", ar: "الزمن من الإشارة ذات الصلة إلى المشورة أو التقييم" },
    definition: {
      en: "Days from when a published rule first has the information it needs, to the day a counselling conversation or assessment is attended.",
      ar: "الأيام من اللحظة التي تتوفر فيها لقاعدة منشورة المعلومات التي تحتاجها، إلى يوم حضور مشورة أو تقييم.",
    },
    data: {
      en: "A signal date, a request, and an attended date for each person, with groups large enough to report.",
      ar: "تاريخ الإشارة، والطلب، وتاريخ الحضور لكل شخص، مع مجموعات كبيرة بما يكفي للعرض.",
    },
  },
  {
    id: "choice",
    title: { en: "Informed-choice quality", ar: "جودة الاختيار المستنير" },
    definition: {
      en: "Whether the person can say what the information does not mean. The check: “Does this tell you whether you can get pregnant?” The accurate answer is no.",
      ar: "هل يستطيع الشخص أن يقول ما لا تعنيه المعلومة. السؤال: «هل يخبركم هذا إن كان يمكنكم الحمل؟» الإجابة الدقيقة: لا.",
    },
    data: {
      en: "Teach-back answers before and after a conversation, kept only with consent.",
      ar: "إجابات سؤال الفهم قبل المحادثة وبعدها، وتُحفظ بالإذن فقط.",
    },
  },
  {
    id: "referral",
    title: { en: "Referral completion", ar: "اكتمال الإحالة" },
    definition: {
      en: "The share of requested conversations or referrals that reach attended. Declined is recorded and is not treated as success.",
      ar: "نصيب المحادثات أو الإحالات المطلوبة التي تصل إلى الحضور. الرفض يُسجَّل ولا يُحسب نجاحًا.",
    },
    data: {
      en: "Timestamped states: suggested, requested, confirmed, attended, declined.",
      ar: "حالات مؤرَّخة: مقترَح، مطلوب، مؤكَّد، حضر، مرفوض.",
    },
  },
  {
    id: "earlier",
    title: { en: "Earlier engagement", ar: "تفاعل أبكر" },
    definition: {
      en: "The share of counselling that happens while someone is not already trying now.",
      ar: "نصيب المشورة التي تحدث والشخص ليس في حال المحاولة الآن.",
    },
    data: {
      en: "Intention at the time of the signal, and the date of counselling.",
      ar: "النية وقت الإشارة، وتاريخ المشورة.",
    },
  },
  {
    id: "equity",
    title: { en: "Equitable reach", ar: "الوصول العادل" },
    definition: {
      en: "The same measures, split by language, sex, nationality group, age band and intention. A split is hidden when fewer than 10 people are in it.",
      ar: "المقاييس نفسها مقسّمة حسب اللغة والجنس وفئة الجنسية والفئة العمرية والنية. يُخفى التقسيم إذا كان فيه أقل من 10 أشخاص.",
    },
    data: {
      en: "Those fields, collected for population analytics, with small groups suppressed.",
      ar: "هذه الحقول، تُجمع لغرض تحليلات السكان، مع إخفاء المجموعات الصغيرة.",
    },
  },
  {
    id: "calibration",
    title: { en: "Calibration and false reassurance", ar: "المعايرة والطمأنة الخاطئة" },
    definition: {
      en: "How often a steady comparison is later disagreed with, and whether missing information was ever shown as if it were reassuring. Not enough information is never shown as steady.",
      ar: "كم مرة يُخالَف لاحقًا وصف «ثابت»، وهل عُرضت معلومة غائبة كما لو كانت مطمئنة. لا تُعرض المعلومات غير الكافية على أنها ثبات أبدًا.",
    },
    data: {
      en: "A later clinician decision linked to the earlier comparison. Pregnancy is not the outcome used.",
      ar: "قرار لاحق للطبيبة مرتبط بالمقارنة السابقة. والحمل ليس النتيجة المستخدمة.",
    },
  },
];
