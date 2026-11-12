import Link from "next/link";
import { Brand, Footer } from "@/components/ui";
import { getLang } from "@/server/lang";

// Reads the error message from the URL, so it renders per request.
export const instant = false;

const COPY = {
  en: {
    title: "Sign in to Masar",
    lede: "There are no real accounts yet. UAE PASS and organisation sign-in come at pilot launch. Until then, use a demo account to see how Masar would run in production.",
    error: "That sign-in link is invalid or has expired. Ask your team for a new one.",
    soon: "At pilot launch",
    methods: [
      ["UAE PASS", "For residents"],
      ["Facility sign-on", "For doctors and clinic staff"],
      ["Department of Health account", "For health-system teams"],
    ],
    link: "Sign in with demo access.",
    linkBody: "These are sample accounts, not real ones. Choose a fictional resident, clinician, or health-system view.",
    demoCta: "Open demo access",
    back: "Back to Masar",
    asideTitle: "Your records, read with your future in mind.",
    asideBody: "Only what you choose to share. Never a fertility score. Never visible to employers or insurers.",
  },
  ar: {
    title: "تسجيل الدخول إلى مسار",
    lede: "لا توجد حسابات حقيقية بعد. الهوية الرقمية وحسابات المؤسسات تأتي عند إطلاق المرحلة التجريبية. وحتى ذلك الحين، استخدموا حسابًا تجريبيًا لتروا كيف سيعمل مسار في بيئة الإنتاج.",
    error: "رابط تسجيل الدخول غير صالح أو منتهي الصلاحية. اطلبوا رابطًا جديدًا من فريقكم.",
    soon: "عند إطلاق المرحلة التجريبية",
    methods: [
      ["الهوية الرقمية (UAE PASS)", "للمقيمين"],
      ["دخول المنشأة الصحية", "للأطباء وموظفي العيادات"],
      ["حساب دائرة الصحة", "لفرق النظام الصحي"],
    ],
    link: "ادخلوا عبر الدخول التجريبي.",
    linkBody: "هذه حسابات نموذجية وليست حقيقية. اختاروا مقيمًا خياليًا أو طبيبًا أو عرضًا للنظام الصحي.",
    demoCta: "افتحوا الدخول التجريبي",
    back: "العودة إلى مسار",
    asideTitle: "سجلاتكم، تُقرأ مع مستقبلكم في البال.",
    asideBody: "فقط ما تختارون مشاركته. لا تقييم رقميًا للخصوبة أبدًا. ولا يراه أصحاب العمل أو شركات التأمين أبدًا.",
  },
} as const;

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { error } = await searchParams;
  const lang = await getLang();
  const c = COPY[lang];

  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <div className="grid flex-1 lg:grid-cols-[1fr_0.9fr]">
        <div className="flex flex-col px-5 py-6 md:px-12">
          <Brand />
          <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
            <h1 className="display text-[clamp(2.2rem,5vw,3rem)] leading-[1.05] text-ink">{c.title}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-ink-2">{c.lede}</p>

            {error === "link" ? (
              <p role="alert" className="mt-6 rounded-xl bg-urgent-soft px-4 py-3 text-[14.5px] text-urgent">
                {c.error}
              </p>
            ) : null}

            <ul className="mt-8 divide-y divide-rule border-y border-rule">
              {c.methods.map(([title, who]) => (
                <li key={title} className="flex items-center gap-4 py-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold text-ink">{title}</span>
                    <span className="block text-[13.5px] text-ink-3">{who}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">{c.soon}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-[14px] bg-accent-soft px-4 py-3.5 text-[14.5px] leading-relaxed text-ink">
              <p>
                <span className="font-semibold">{c.link}</span> {c.linkBody}
              </p>
              <p className="mt-2">
                <Link href="/access" className="link font-semibold">
                  {c.demoCta}
                </Link>
              </p>
            </div>
            <p className="mt-10">
              <Link href="/" className="link text-[14px]">
                {c.back}
              </Link>
            </p>
          </main>
        </div>
        <aside className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col lg:justify-end">
          <svg viewBox="0 0 400 300" className="flip-rtl absolute inset-x-0 top-20 w-full opacity-90" aria-hidden>
            <path d="M0 230 C 80 230, 90 150, 170 150 S 260 190, 300 120 S 360 60, 400 60" pathLength={1} fill="none" stroke="var(--color-paper)" strokeOpacity="0.55" strokeWidth="1.6" className="draw-path" />
            <circle cx="300" cy="120" r="6" fill="var(--color-date)" />
          </svg>
          <div className="relative p-14">
            <p className="display max-w-md text-[2.1rem] leading-tight">{c.asideTitle}</p>
            <p className="mt-4 max-w-md text-[15.5px] text-paper/75">{c.asideBody}</p>
          </div>
        </aside>
      </div>
      <Footer lang={lang} />
    </div>
  );
}
