import Link from "next/link";
import { Brand, Footer } from "@/components/ui";
import { CERTAINTY, type Certainty } from "@/components/editorial";
import { LandingPath, type Moment } from "@/components/landing-path";
import { HeroArt, Thread } from "@/components/hero-art";
import { AccessPaths } from "@/components/access-paths";
import { Journey } from "@/components/journey";
import { CertaintyExplorer } from "@/components/certainty-explorer";
import { PrivacyStory } from "@/components/privacy-story";
import { InView } from "@/components/in-view";
import { LandingMenu, LandingNav, StickyHeader } from "@/components/landing-nav";
import { t, type Lang as L } from "@/lib/i18n";
import "./landing.css";
import { setLanguage } from "@/server/actions";
import { getLang } from "@/server/lang";
import type { Lang } from "@/lib/i18n";

// The public page. Every example here is invented and labelled as such: no
// resident's record, finding or value ever appears in public content.

const COPY = {
  en: {
    nav: [
      ["#how", "How it works"],
      ["#limits", "What it won't do"],
      ["#who", "Who it's for"],
      ["#privacy", "Privacy"],
    ],
    demoAccess: "Demo access",
    signIn: "Sign in",
    switchTo: "العربية",
    switchLabel: "التبديل إلى العربية",
    eyebrow: "Reproductive health · Abu Dhabi · Pilot",
    h1a: "Your reproductive health changes over time.",
    h1b: "See it early. Choose calmly.",
    lede: "Masar reads only the records you choose to share, shows what is changing and how sure it is, and helps you reach the right conversation while every option is still open.",
    nots: ["Not a score", "Not a prediction", "Not a diagnosis"],
    ctaPrimary: "Sign in to Masar",
    ctaSecondary: "How Masar works",
    pathCaption: "An illustration of one life course. Not a real person.",
    heroStrands: ["Cycles", "Hormones", "Weight and sleep", "Family history"],
    heroEnd: "One view, over time",
    access: {
      methods: [
        ["UAE PASS", "For residents"],
        ["Facility sign-on", "For doctors and clinic staff"],
        ["Department of Health account", "For health-system teams"],
      ],
      soon: "At pilot launch",
      live: "Demo accounts",
      linkTitle: "Sign in with demo access.",
      linkBody: "There are no real accounts yet. These sample accounts show how Masar would run in production, with fictional residents, a clinician, and a health-system view.",
      decorative: "Decorative. Masar never collects or checks fingerprints.",
    },
    ageLabel: "Age",
    moments: [
      { age: 25.5, label: "Premarital screening", kind: "check", row: 0 },
      { age: 29.5, label: "Health Age check", kind: "check", row: 1 },
      { age: 32.5, label: "An earlier conversation", kind: "early", row: 0 },
      { age: 39, label: "Often, the first assessment today", kind: "late", row: 1 },
    ] as Moment[],
    gapLabel: "The gap Masar aims to close",
    problemLabel: "The problem",
    problem: "Most people get a meaningful assessment only once they are already trying, or already struggling.",
    problemPoints: [
      ["Scattered", "What matters is spread across family history, lab results, cycles and the checks you already attend."],
      ["Misjudged", "Without one clear view, it is easy to overestimate or underestimate what is changing."],
      ["Late", "By the time anyone looks, some options have narrowed. Masar exists to make the conversation earlier, not more anxious."],
    ],
    howLabel: "How Masar reads a record",
    howTitle: "From what is on record to what you could do next.",
    how: [
      { title: "Understand what is on record", body: "Only information from the sources you have switched on." },
      { title: "Notice what has changed", body: "Records are compared over time using Masar's published rules." },
      { title: "Explain what it means", body: "Facts, trends, evidence and unknowns are kept clearly apart." },
      { title: "Explore possible next steps", body: "Options to discuss; decisions stay with you and your clinician." },
    ],
    certaintyTitle: "Every sentence says how sure it is.",
    certaintyExampleLabel: "Example · invented for illustration",
    certaintyListLabel: "How sure a statement is",
    certaintyItems: [
      ["fact", "A hormone result from the lab, with the date it was taken.", "Lab · example date"],
      ["said", "Plans: maybe in a few years.", "What you told Masar"],
      ["trend", "It moved by more than the normal ups and downs between two tests, six months or more apart.", "Masar's published rule"],
      ["steady", "Another result stayed within the normal ups and downs between tests.", "Masar's published rule"],
      ["evidence", "Guidelines say this kind of change is worth discussing for people who may want children later.", "Cited guideline"],
      ["unknown", "This test can't measure egg quality or the chance of a pregnancy.", "Limit of the test"],
    ] as [Certainty, string, string][],
    certaintyBody: "Masar labels each statement, so a fact on record never reads like a guess and a guideline never reads like a prediction about you.",
    limitsLabel: "What it does, and what it won't",
    limitsTitle: "Decision support, with its limits in plain view.",
    does: "Masar does",
    doesList: [
      "Notice changes at checks you already attend",
      "Explain them in plain language, in English and Arabic",
      "Show what is missing and how sure it is",
      "Offer next steps that your doctor reviews",
      "Measure whether it helped, and who it missed",
    ],
    doesnt: "Masar never",
    doesntList: [
      "Gives a fertility score or a risk number",
      "Predicts whether or when you will conceive",
      "Diagnoses a condition",
      "Recommends a treatment or a dose",
      "Shares anything with employers or insurers",
    ],
    whoLabel: "One record, three readers",
    whoTitle: "Each sees only what it needs.",
    who: [
      ["Residents", "A clear view of your reproductive health over time, choices you control, and a way to ask for a conversation in one step.", "Sees: their own path, every look at their record.", "Never: a score, or anything they didn't share."],
      ["Clinicians", "A short list of patients worth an earlier conversation, with the reasons, evidence and limits on one page.", "Sees: only what each patient shared with them.", "Never: unshared sources, or unchecked report values."],
      ["The health system", "Whether people reach a doctor sooner, whether every community is reached, and how often Masar was wrong.", "Sees: totals for groups of ten or more.", "Never: an individual's record."],
    ],
    privacyLabel: "Privacy by design",
    privacyTitle: "Never for employers, insurers or marketing.",
    privacyBody: "Not a setting you have to find: those purposes do not exist in Masar.",
    principles: [
      { title: "Off until you choose", body: "Every source starts switched off." },
      { title: "AI is a separate choice", body: "The assistant has its own switch." },
      { title: "Every look is logged", body: "Allowed or blocked, you can see it." },
      { title: "Withdraw at once", body: "Switch a source off and it stops." },
      { title: "Small groups stay hidden", body: "Never a group under ten people." },
      { title: "Take it, or erase it", body: "Download your data, or delete it." },
    ],
    privacyCaption: "Illustration. Masar does not use fingerprints or any biometric.",
    closingTitle: "The conversation, earlier. The choice, yours.",
    closingBody: "Masar is in a pilot with synthetic records. There are no real accounts yet: use demo access to see how it would run in production. UAE PASS and organisation accounts come at pilot launch.",
  },
  ar: {
    nav: [
      ["#how", "كيف يعمل"],
      ["#limits", "ما لا يفعله"],
      ["#who", "لمن هو"],
      ["#privacy", "الخصوصية"],
    ],
    demoAccess: "دخول تجريبي",
    signIn: "تسجيل الدخول",
    switchTo: "English",
    switchLabel: "Switch to English",
    eyebrow: "الصحة الإنجابية · أبوظبي · مرحلة تجريبية",
    h1a: "صحتكم الإنجابية تتغيّر مع الوقت.",
    h1b: "لاحظوا التغيّر مبكرًا، واختاروا بهدوء.",
    lede: "يقرأ مسار فقط السجلات التي تختارون مشاركتها، ويُظهر ما يتغيّر ومدى يقينه، ويساعدكم على الوصول إلى الحديث المناسب بينما ما تزال كل الخيارات متاحة.",
    nots: ["ليس تقييمًا رقميًا", "ليس توقعًا", "ليس تشخيصًا"],
    ctaPrimary: "الدخول إلى مسار",
    ctaSecondary: "كيف يعمل مسار",
    pathCaption: "رسم توضيحي لمسار حياة واحد. ليس شخصًا حقيقيًا.",
    heroStrands: ["الدورة", "الهرمونات", "الوزن والنوم", "التاريخ العائلي"],
    heroEnd: "صورة واحدة، عبر الوقت",
    access: {
      methods: [
        ["الهوية الرقمية (UAE PASS)", "للمقيمين"],
        ["دخول المنشأة الصحية", "للأطباء وموظفي العيادات"],
        ["حساب دائرة الصحة", "لفرق النظام الصحي"],
      ],
      soon: "عند إطلاق المرحلة التجريبية",
      live: "حسابات تجريبية",
      linkTitle: "ادخلوا عبر الدخول التجريبي.",
      linkBody: "لا توجد حسابات حقيقية بعد. هذه حسابات نموذجية تُظهر كيف سيعمل مسار في بيئة الإنتاج، بمقيمين خياليين وطبيب وعرض للنظام الصحي.",
      decorative: "عنصر زخرفي. لا يجمع مسار بصمات الأصابع ولا يتحقق منها أبدًا.",
    },
    ageLabel: "العمر",
    moments: [
      { age: 25.5, label: "فحص ما قبل الزواج", kind: "check", row: 0 },
      { age: 29.5, label: "فحص العمر الصحي", kind: "check", row: 1 },
      { age: 32.5, label: "حديث أبكر", kind: "early", row: 0 },
      { age: 39, label: "غالبًا، أول تقييم اليوم", kind: "late", row: 1 },
    ] as Moment[],
    gapLabel: "الفجوة التي يسعى مسار إلى تقليصها",
    problemLabel: "المشكلة",
    problem: "معظم الناس لا يحصلون على تقييم حقيقي إلا بعد أن يبدؤوا المحاولة، أو بعد أن يواجهوا صعوبة.",
    problemPoints: [
      ["متفرّقة", "ما يهم موزّع بين التاريخ العائلي ونتائج المختبر والدورة والفحوص التي تحضرونها أصلًا."],
      ["تقدير خاطئ", "من دون صورة واحدة واضحة، يسهل تهويل ما يتغيّر أو التقليل منه."],
      ["متأخرة", "حين ينظر أحد أخيرًا، تكون بعض الخيارات قد ضاقت. وُجد مسار ليجعل الحديث أبكر، لا أكثر قلقًا."],
    ],
    howLabel: "كيف يقرأ مسار السجل",
    howTitle: "مما هو مسجّل إلى ما يمكنكم فعله بعد ذلك.",
    how: [
      { title: "فهم ما هو مسجّل", body: "فقط المعلومات من المصادر التي فعّلتموها." },
      { title: "ملاحظة ما تغيّر", body: "تُقارن السجلات عبر الوقت وفق قواعد مسار المنشورة." },
      { title: "شرح ما يعنيه ذلك", body: "تبقى الحقائق والاتجاهات والأدلة والمجهول منفصلة بوضوح." },
      { title: "استكشاف الخطوات الممكنة", body: "خيارات للنقاش؛ والقرار يبقى لكم ولطبيبكم." },
    ],
    certaintyTitle: "كل جملة تقول مدى يقينها.",
    certaintyExampleLabel: "مثال · مختلَق للتوضيح",
    certaintyListLabel: "مدى يقين العبارة",
    certaintyItems: [
      ["fact", "نتيجة هرمون من المختبر، مع تاريخ أخذها.", "المختبر · تاريخ مثال"],
      ["said", "الخطط: ربما خلال بضع سنوات.", "ما أخبرتم به مسار"],
      ["trend", "تغيّرت أكثر من التذبذب الطبيعي بين فحصين بينهما ستة أشهر أو أكثر.", "قاعدة مسار المنشورة"],
      ["steady", "بقيت نتيجة أخرى ضمن التذبذب الطبيعي بين الفحوص.", "قاعدة مسار المنشورة"],
      ["evidence", "تقول الأدلة الإرشادية إن هذا النوع من التغيّر يستحق النقاش لمن قد يرغب في الإنجاب لاحقًا.", "دليل مُستشهد به"],
      ["unknown", "لا يستطيع هذا الفحص قياس جودة البويضات ولا فرصة الحمل.", "حدود الفحص"],
    ] as [Certainty, string, string][],
    certaintyBody: "يصنّف مسار كل عبارة، فلا تبدو الحقيقة المسجّلة كتخمين، ولا يبدو الدليل الإرشادي كتوقّع بشأنكم.",
    limitsLabel: "ما يفعله، وما لا يفعله",
    limitsTitle: "دعم لاتخاذ القرار، وحدوده واضحة أمامكم.",
    does: "مسار يفعل",
    doesList: [
      "يلاحظ التغيّرات في الفحوص التي تحضرونها أصلًا",
      "يشرحها بلغة بسيطة، بالعربية والإنجليزية",
      "يُظهر ما ينقص ومدى يقينه",
      "يقدّم خطوات تالية يراجعها طبيبكم",
      "يقيس ما إذا ساعد، ومن فاته",
    ],
    doesnt: "مسار لا",
    doesntList: [
      "يعطي تقييمًا رقميًا للخصوبة أو رقمًا للخطر",
      "يتوقّع إن كنتم ستنجبون أو متى",
      "يشخّص حالة مرضية",
      "يوصي بعلاج أو جرعة",
      "يشارك أي شيء مع أصحاب العمل أو شركات التأمين",
    ],
    whoLabel: "سجل واحد، وثلاثة قرّاء",
    whoTitle: "كلٌّ يرى ما يحتاجه فقط.",
    who: [
      ["المقيمون", "صورة واضحة لصحتكم الإنجابية عبر الوقت، وخيارات تتحكمون بها، وطريقة لطلب حديث بخطوة واحدة.", "يرون: مسارهم، وكل اطلاع على سجلهم.", "أبدًا: تقييمًا رقميًا، أو أي شيء لم يشاركوه."],
      ["الأطباء", "قائمة قصيرة بالمرضى الذين يستحقون حديثًا أبكر، مع الأسباب والأدلة والحدود في صفحة واحدة.", "يرون: فقط ما شاركه كل مريض معهم.", "أبدًا: مصادر غير مشارَكة، أو قيم تقارير لم يتحقق منها المريض."],
      ["النظام الصحي", "هل يصل الناس إلى طبيب أبكر، وهل تُخدم كل المجتمعات، وكم مرة أخطأ مسار.", "يرى: مجاميع لمجموعات من عشرة أشخاص أو أكثر.", "أبدًا: سجل فرد."],
    ],
    privacyLabel: "الخصوصية في التصميم",
    privacyTitle: "ليس لأصحاب العمل أو شركات التأمين أو التسويق، أبدًا.",
    privacyBody: "ليس إعدادًا عليكم البحث عنه: هذه الأغراض غير موجودة في مسار أصلًا.",
    principles: [
      { title: "متوقف حتى تختاروا", body: "كل مصدر يبدأ متوقفًا." },
      { title: "الذكاء الاصطناعي خيار منفصل", body: "للمساعد مفتاحه الخاص." },
      { title: "كل اطلاع مسجّل", body: "سواء سُمح أو مُنع، ترونه." },
      { title: "السحب فوري", body: "أوقفوا مصدرًا فيتوقف فورًا." },
      { title: "المجموعات الصغيرة تبقى مخفية", body: "لا مجموعة أقل من عشرة أشخاص أبدًا." },
      { title: "خذوها أو امحوها", body: "نزّلوا بياناتكم، أو احذفوها." },
    ],
    privacyCaption: "رسم توضيحي. لا يستخدم مسار بصمات الأصابع ولا أي قياس حيوي.",
    closingTitle: "الحديث، أبكر. والقرار، لكم.",
    closingBody: "مسار في مرحلة تجريبية بسجلات افتراضية. لا توجد حسابات حقيقية بعد: استخدموا الدخول التجريبي لتروا كيف سيعمل في بيئة الإنتاج. الهوية الرقمية وحسابات المؤسسات تأتي عند إطلاق المرحلة التجريبية.",
  },
} as const;

function Header({ lang }: { lang: Lang }) {
  const c = COPY[lang];
  const ar = lang === "ar";
  const switcher = (
    <form action={setLanguage.bind(null, ar ? "en" : "ar")}>
      <button lang={ar ? "en" : "ar"} aria-label={c.switchLabel} className="min-h-[44px] rounded-full px-3 text-[14px] font-semibold text-accent hover:bg-accent-soft">
        {c.switchTo}
      </button>
    </form>
  );
  return (
    <StickyHeader>
      <header className="relative mx-auto flex max-w-6xl items-center gap-2 px-4 py-4 sm:gap-6 md:px-8">
        <Brand animated />
        <LandingNav items={c.nav.map(([h, l]) => [h, l] as [string, string])} label={ar ? "أقسام الصفحة" : "Page sections"} />
        <Link href="/access" className="hidden min-h-[44px] items-center whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-ink-2 hover:text-ink sm:inline-flex">
          {c.demoAccess}
        </Link>
        <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden min-[400px]:block">{switcher}</div>
          <Link href="/sign-in" className="btn btn-primary whitespace-nowrap !min-h-[44px] !px-4 !text-[14px]">
            {c.signIn}
          </Link>
          <LandingMenu
            items={c.nav.map(([h, l]) => [h, l] as [string, string])}
            links={[
              { href: "/access", label: c.demoAccess, icon: "users" },
              { href: "/how-masar-decides", label: ar ? "كيف يقرّر مسار" : "How Masar decides", icon: "book" },
            ]}
            labels={{ open: ar ? "فتح القائمة" : "Open menu", close: ar ? "إغلاق القائمة" : "Close menu", sections: ar ? "أقسام الصفحة" : "On this page" }}
          >
            <div className="min-[400px]:hidden">{switcher}</div>
          </LandingMenu>
        </div>
      </header>
    </StickyHeader>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const lang = await getLang();
  const c = COPY[lang];
  const deleted = (await searchParams).deleted === "1";

  return (
    <div className="landing min-h-dvh overflow-x-clip bg-paper">
      <Header lang={lang} />
      {deleted ? (
        <p role="status" className="mx-auto mt-2 max-w-6xl px-4 md:px-8">
          <span className="block rounded-[14px] bg-accent-soft px-4 py-3 text-[15px] text-ink">
            {lang === "ar" ? "حُذفت بيانات مسار الخاصة بكم، وسُجّل خروجكم." : "Your Masar data has been deleted, and you have been signed out."}
          </span>
        </p>
      ) : null}

      <noscript>
        <style>{`[data-inview] *{opacity:1!important;transform:none!important;stroke-dashoffset:0!important}`}</style>
      </noscript>
      <main id="main" tabIndex={-1}>
        {/* Hero */}
        <section className="hero mx-auto grid max-w-6xl items-center gap-10 px-4 pb-4 pt-10 md:px-8 md:pt-16 lg:grid-cols-[1.25fr_1fr] lg:gap-6">
          <div>
            <p className="eyebrow rise" style={{ ["--d" as string]: "0ms" }}>
              {c.eyebrow}
            </p>
            <h1 className="display mt-6 text-[clamp(2.6rem,6.2vw,5rem)] leading-[1.03] text-ink">
              <span className="rise block" style={{ ["--d" as string]: "120ms" }}>
                {c.h1a}
              </span>{" "}
              <em className="rise block text-accent" style={{ ["--d" as string]: "320ms" }}>
                {c.h1b}
              </em>
            </h1>
            <p className="rise mt-7 max-w-xl text-[18px] leading-relaxed text-ink-2 md:text-[19px]" style={{ ["--d" as string]: "520ms" }}>
              {c.lede}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label={lang === "ar" ? "ما ليس مسار" : "What Masar is not"}>
              {c.nots.map((x, i) => (
                <li key={x} className="rise rounded-full border border-rule-strong px-3.5 py-1.5 text-[13.5px] text-ink-2" style={{ ["--d" as string]: `${640 + i * 80}ms` }}>
                  {x}
                </li>
              ))}
            </ul>
            <div className="rise mt-8 flex flex-wrap gap-3" style={{ ["--d" as string]: "880ms" }}>
              <Link href="/sign-in" className="btn btn-primary">
                {c.ctaPrimary}
              </Link>
              <a href="#how" className="btn btn-secondary">
                {c.ctaSecondary}
              </a>
            </div>
          </div>
          <InView className="hero-art-wrap mx-auto w-full max-w-[520px]" threshold={0.1}>
            <HeroArt labels={[...c.heroStrands]} endLabel={c.heroEnd} lang={lang} />
          </InView>
        </section>

        <Thread />

        <section aria-label={c.pathCaption} className="mx-auto max-w-6xl px-4 pb-20 md:px-8">
          <div className="pt-4">
            <LandingPath moments={c.moments} ageLabel={c.ageLabel} gapLabel={c.gapLabel} lang={lang} />
            <p className="mt-4 text-[13px] text-ink-3">{c.pathCaption}</p>
          </div>
        </section>

        {/* The problem */}
        <section className="bg-ink text-paper">
          <InView className="seq mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1.2fr_1fr] md:px-8 md:py-28">
            <div>
              <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-paper/70">{c.problemLabel}</p>
              <p className="display mt-5 text-[clamp(1.9rem,4vw,3.2rem)] leading-[1.12]">{c.problem}</p>
            </div>
            <dl className="space-y-7 self-end">
              {c.problemPoints.map(([term, body]) => (
                <div key={term} className="border-t border-paper/20 pt-4">
                  <dt className="display text-[1.35rem] text-date">{term}</dt>
                  <dd className="mt-1.5 text-[15.5px] leading-relaxed text-paper/80">{body}</dd>
                </div>
              ))}
            </dl>
          </InView>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 md:px-8 md:py-28">
          <p className="eyebrow">{c.howLabel}</p>
          <h2 className="display mt-4 max-w-3xl text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.08] text-ink">{c.howTitle}</h2>
          <Journey stages={[...c.how]} />

          <div className="mt-24 md:mt-28">
            <h3 className="display max-w-2xl text-[clamp(1.7rem,3.4vw,2.5rem)] leading-[1.12] text-ink">{c.certaintyTitle}</h3>
            <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-ink-2">{c.certaintyBody}</p>
            <InView className="cx-wrap mt-10" threshold={0.2}>
              <CertaintyExplorer
                exampleLabel={c.certaintyExampleLabel}
                listLabel={c.certaintyListLabel}
                items={c.certaintyItems.map(([kind, example, source]) => ({
                  kind,
                  label: t(lang as L, CERTAINTY[kind].label),
                  example,
                  source,
                  explain: t(lang as L, CERTAINTY[kind].explain),
                }))}
              />
            </InView>
          </div>
        </section>

        {/* Does / doesn't */}
        <section id="limits" className="scroll-mt-6 border-y border-rule bg-zinc-50">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-24">
            <p className="eyebrow">{c.limitsLabel}</p>
            <h2 className="display mt-4 max-w-3xl text-[clamp(2rem,4.5vw,3.2rem)] leading-[1.08] text-ink">{c.limitsTitle}</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-2">
              {[
                { title: c.does, list: c.doesList, mark: "✓", ink: "text-accent" },
                { title: c.doesnt, list: c.doesntList, mark: "—", ink: "text-urgent" },
              ].map((col) => (
                <div key={col.title}>
                  <h3 className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">{col.title}</h3>
                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {col.list.map((x) => (
                      <li key={x} className="flex gap-4 py-3.5 text-[16.5px] text-ink">
                        <span aria-hidden className={`w-4 shrink-0 font-semibold ${col.ink}`}>
                          {col.mark}
                        </span>
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Audiences */}
        <section id="who" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 md:px-8 md:py-28">
          <p className="eyebrow">{c.whoLabel}</p>
          <h2 className="display mt-4 text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.08] text-ink">{c.whoTitle}</h2>
          <AccessPaths
            readers={c.who.map(([title, body, sees, never], i) => ({ title, body, sees, never, method: c.access.methods[i][0], methodFor: c.access.methods[i][1] }))}
            soon={c.access.soon}
            live={c.access.live}
            linkTitle={c.access.linkTitle}
            linkBody={c.access.linkBody}
            linkHref="/access"
            decorative=""
          />
        </section>

        {/* Privacy */}
        <section id="privacy" className="scroll-mt-6 bg-accent text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
            <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-white/75">{c.privacyLabel}</p>
            <h2 className="display mt-4 max-w-4xl text-[clamp(2rem,5vw,3.8rem)] leading-[1.06]">{c.privacyTitle}</h2>
            <p className="mt-4 max-w-2xl text-[17px] text-white/85">{c.privacyBody}</p>
            <div className="mt-14">
              <PrivacyStory principles={[...c.principles]} caption={c.privacyCaption} lang={lang} />
            </div>
          </div>
        </section>

        {/* Close */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:px-8 md:py-28">
          <h2 className="display mx-auto max-w-3xl text-[clamp(2.1rem,5vw,3.8rem)] leading-[1.06] text-ink">{c.closingTitle}</h2>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-2">{c.closingBody}</p>
          <Link href="/sign-in" className="btn btn-primary mt-8">
            {c.ctaPrimary}
          </Link>
        </section>
      </main>

      <Footer lang={lang} />
    </div>
  );
}
