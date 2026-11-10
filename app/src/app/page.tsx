import Image from "next/image";
import Link from "next/link";
import { Brand, Footer } from "@/components/ui";
import { PHOTOS } from "@/lib/media";

const HOW = [
  { n: "01", title: "Noticed early", body: "At checks you already attend, Masar looks for early changes in the records you agree to share." },
  { n: "02", title: "Shown over time", body: "What changed, what is just normal ups and downs, and what can't be known yet. Never a single label." },
  { n: "03", title: "Turned into a choice", body: "Options matched to your plans, questions to bring, and a request your doctor reviews." },
  { n: "04", title: "Measured", body: "How soon people talk to a doctor, whether every community is reached, and how often Masar was right." },
];

const AUDIENCES = [
  {
    photo: PHOTOS.resident,
    title: "For residents",
    body: "A clear view of your reproductive health over time, explained in plain language, with choices you control.",
    points: ["Share source by source", "Know what can and can't change", "Ask for a conversation in one step"],
  },
  {
    photo: PHOTOS.clinician,
    title: "For clinicians",
    body: "Each morning, a short list of patients worth an earlier conversation, with the reasons and the limits on one page.",
    points: ["Only what patients chose to share", "Agree, add a test or disagree", "Every decision stays yours"],
  },
  {
    photo: PHOTOS.system,
    title: "For the health system",
    body: "Proof that people talk to a doctor sooner, and that everyone is reached, with any harm reported openly.",
    points: ["How soon people talk to a doctor", "Reach by language and community", "How often Masar was right, and who it missed"],
  },
];

function HeroMedia() {
  return (
    <div className="relative pb-16 lg:pb-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-zinc-100 sm:aspect-[5/4] lg:aspect-[4/5]">
        <Image src={PHOTOS.hero.src} alt={PHOTOS.hero.alt} fill priority sizes="(min-width: 1024px) 45vw, 100vw" className="ken-burns object-cover" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-zinc-950/35 via-transparent to-transparent" />
      </div>
      <div className="absolute -bottom-2 left-4 right-4 sm:left-auto sm:right-[-1.5rem] sm:w-[22rem] lg:bottom-[-2rem] lg:left-[-3rem] lg:right-auto">
        <Preview />
      </div>
    </div>
  );
}

function Preview() {
  return (
    <div className="relative">
      <div className="card overflow-hidden shadow-[0_30px_80px_-30px_rgb(9_9_11/0.45)]">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
          <span className="text-[13px] font-semibold">My path</span>
          <span className="text-[12px] text-zinc-400">After your Health Age check</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="accent-panel p-5">
            <p className="text-[12px] font-medium text-indigo-100">Masar noticed · worth discussing soon</p>
            <p className="mt-1.5 text-[18px] font-semibold leading-snug">A real drop in her egg-reserve hormone, and early menopause in the family.</p>
          </div>
          <div className="rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold">AMH</span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/30">
                Meaningful change
              </span>
            </div>
            <svg viewBox="0 0 300 70" className="mt-3 h-16 w-full" aria-hidden>
              <path d="M10 18 L150 30 L290 56" fill="none" stroke="var(--color-zinc-800)" strokeWidth="2" />
              <circle cx="10" cy="18" r="4" fill="#fff" stroke="var(--color-zinc-800)" strokeWidth="1.6" />
              <circle cx="290" cy="56" r="5" fill="var(--color-amber-500)" stroke="var(--color-amber-700)" strokeWidth="1.6" />
            </svg>
            <p className="text-[12px] text-zinc-500">2.4 → 1.3 ng/mL over 25 months</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Age", "34", "Can't change"],
              ["Weight (BMI)", "22.8", "You can change this"],
            ].map(([l, v, t]) => (
              <div key={l} className="rounded-xl bg-zinc-50 p-3.5">
                <p className="text-[11.5px] text-zinc-500">{l}</p>
                <p className="mt-0.5 text-[20px] font-semibold tracking-tight">{v}</p>
                <p className="text-[11px] text-zinc-500">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-dvh bg-white">
      <div aria-hidden className="scroll-progress fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-gradient-to-r from-indigo-600 to-violet-600" />
      <header className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-5 md:px-8">
        <Brand />
        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["#how", "How it works"],
            ["#who", "Who it's for"],
            ["#privacy", "Privacy"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-3.5 py-2 text-[14px] text-zinc-600 hover:text-zinc-950">
              {label}
            </a>
          ))}
        </nav>
        <Link href="/sign-in" className="ms-auto rounded-full bg-zinc-950 px-4 py-2 text-[13px] font-semibold text-white hover:bg-zinc-800">
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-10 md:px-8 lg:grid-cols-[1.15fr_1fr] lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-[12.5px] text-zinc-600">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            Reproductive health · Abu Dhabi
          </p>
          <h1 className="mt-6 text-[clamp(2.6rem,5.6vw,4.6rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-zinc-950">
            The fertility conversation,{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">years earlier.</span>
          </h1>
          <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-zinc-600">
            Most people only get a meaningful assessment once they are already trying or struggling. Masar reads the records you choose to
            share, shows how things are changing, and gets you to the right conversation while every option is still open. Never a fertility
            score.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-indigo-600 px-6 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-accent)] hover:bg-indigo-700"
            >
              Sign in to Masar
            </Link>
            <a href="#how" className="rounded-full border border-zinc-300 px-6 py-3 text-[15px] font-semibold text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50">
              How it works
            </a>
          </div>
        </div>
        <HeroMedia />
      </section>

      <section id="how" className="scroll-mt-6 border-y border-zinc-200 bg-zinc-50">
        <ol className="mx-auto grid max-w-6xl gap-px px-4 md:grid-cols-4 md:px-8">
          {HOW.map((s) => (
            <li key={s.n} className="reveal py-10 md:pe-8">
              <span className="font-mono text-[13px] text-indigo-600">{s.n}</span>
              <p className="mt-3 text-[17px] font-semibold tracking-tight text-zinc-950">{s.title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-zinc-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="who" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-20 md:px-8">
        <h2 className="max-w-2xl text-[2.2rem] font-semibold leading-tight tracking-[-0.035em] text-zinc-950">
          One record, read three ways, each with only what it needs.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="reveal card overflow-hidden">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image src={a.photo.src} alt={a.photo.alt} fill sizes="(min-width: 768px) 33vw, 100vw" className="parallax object-cover" />
              </div>
              <div className="p-6">
              <p className="text-[18px] font-semibold tracking-tight">{a.title}</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">{a.body}</p>
              <ul className="mt-5 space-y-2 border-t border-zinc-200 pt-5 text-[14px] text-zinc-800">
                {a.points.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-600" />
                    {p}
                  </li>
                ))}
              </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-6xl scroll-mt-6 px-4 pb-24 md:px-8">
        <div className="reveal relative isolate grid gap-8 overflow-hidden rounded-[28px] p-8 text-white md:grid-cols-[1.2fr_1fr] md:p-12">
          <Image src={PHOTOS.privacy.src} alt="" fill sizes="100vw" className="parallax -z-20 object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-950/90 via-indigo-900/80 to-violet-800/60" />
          <div>
            <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.03em]">Never for employers, insurers or marketing.</h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-indigo-100">
              Not a setting you have to find: those purposes don&apos;t exist in Masar. Every look at your record, allowed or blocked, is written
              to a log you can read.
            </p>
          </div>
          <ul className="space-y-2.5 self-center text-[14.5px]">
            {[
              "Consent for each source and each person, withdrawn in one tap",
              "Your doctor sees only what you share",
              "Population reports hide any group under ten people",
            ].map((t) => (
              <li key={t} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="pb-2 text-center text-[11px] text-zinc-400">Photography: Unsplash</p>
      <Footer />
    </div>
  );
}
