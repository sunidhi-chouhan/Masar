import { pageContext } from "@/lib/page-context";
import { prisma } from "@/lib/db/prisma";
import { signInAndGo } from "@/server/actions/auth";
import { goToDemoStep, startDemo } from "@/server/actions/demo";
import { getDemoState } from "@/lib/demo/state";
import { CHAPTERS, EXPLORE_ROUTES } from "@/lib/demo/chapters";
import { Page, SimulatedBadge } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
import { ResetDemoButton } from "@/components/demo/reset-demo-button";
import { pick } from "@/lib/living-well/content";

const PERSONA_ORDER = ["u_fatima", "u_mariam"] as const;

async function personaFacts(now: Date) {
  const users = await prisma.user.findMany({
    where: { id: { in: [...PERSONA_ORDER] } },
    select: { id: true, name: true, nameAr: true, birthYear: true, intention: true, hue: true },
  });
  const counts = await prisma.observation.groupBy({
    by: ["userId"],
    where: { userId: { in: [...PERSONA_ORDER] } },
    _count: { _all: true },
  });
  const sources = await prisma.consentGrant.groupBy({
    by: ["subjectId"],
    where: { subjectId: { in: [...PERSONA_ORDER] }, recipientRole: "Self", purpose: "PersonalView", status: "active" },
    _count: { _all: true },
  });
  return PERSONA_ORDER.map((id) => {
    const u = users.find((x) => x.id === id);
    return {
      id,
      key: id.replace("u_", ""),
      user: u,
      age: u ? now.getFullYear() - u.birthYear : null,
      observations: counts.find((c) => c.userId === id)?._count._all ?? 0,
      sourcesOn: sources.find((s) => s.subjectId === id)?._count._all ?? 0,
    };
  });
}

export default async function DemoPage({ params, searchParams }: PageProps<"/[locale]/demo">) {
  const { locale, t } = await pageContext(params);
  const sp = await searchParams;
  const done = sp?.done === "1";
  const demo = await getDemoState();
  const people = await personaFacts(new Date());

  return (
    <Page wide>
      <div className="mx-auto max-w-4xl">
        {done ? (
          <Reveal>
            <div className="surface-paper mb-6 border-s-4 border-s-mist-500 p-5">
              <p className="label-caps text-mist-700">{t("demo.label")}</p>
              <h2 className="mt-1 text-ink-900">{t("demo.doneTitle")}</h2>
              <p className="mt-1.5 text-sm text-ink-600">{t("demo.doneBody")}</p>
            </div>
          </Reveal>
        ) : null}

        <Reveal>
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-caps text-mist-700">{t("demo.label")}</span>
            <SimulatedBadge />
          </div>
          <h1 className="mt-1.5 text-ink-900">{t("demo.title")}</h1>
          <p className="mt-2 text-base text-ink-600">{t("demo.subtitle")}</p>
          <p className="mt-1.5 text-sm text-ink-600">{t("demo.problem")}</p>
        </Reveal>

        <Reveal delay={0.05} className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={`/${locale}/journey`}
            className="rounded-md bg-mist-700 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-mist-500"
          >
            {t("journey.start")} →
          </a>
          <form action={startDemo.bind(null, locale)}>
            <button
              type="submit"
              className="rounded-md border border-dawn-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-dawn-100"
            >
              {t("demo.startChapters")} →
            </button>
          </form>
          {demo ? (
            <form action={goToDemoStep.bind(null, demo.position.chapter, demo.position.step, locale)}>
              <button
                type="submit"
                className="rounded-md border border-dawn-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-dawn-100"
              >
                {t("demo.resume")} · {t("demo.rail.chapterOf", { n: demo.position.chapter + 1, total: CHAPTERS.length })}
              </button>
            </form>
          ) : null}
          <p className="basis-full text-xs text-ink-600">{t("journey.startHint")}</p>
        </Reveal>

        <section className="mt-8">
          <Reveal>
            <h2 className="text-ink-900">{t("demo.chaptersHeading")}</h2>
          </Reveal>
          <Stagger className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {CHAPTERS.map((c, i) => (
              <StaggerItem key={c.id}>
                <div className="surface-paper flex h-full items-start justify-between gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-dawn-100 text-xs font-semibold text-ink-900">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{t(`demo.chapters.${c.id}.title`)}</p>
                      <p className="mt-0.5 text-xs text-ink-600">{t(`demo.chapters.${c.id}.hook`)}</p>
                    </div>
                  </div>
                  <form action={goToDemoStep.bind(null, i, 0, locale)} className="shrink-0">
                    <button
                      type="submit"
                      className="rounded-md border border-dawn-300 bg-white px-2.5 py-1 text-xs font-medium text-mist-700 hover:bg-dawn-100"
                    >
                      {t("demo.go")} →
                    </button>
                  </form>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section className="mt-8">
          <Reveal>
            <h2 className="text-ink-900">{t("demo.meet")}</h2>
          </Reveal>
          <Stagger className="mt-3 grid gap-3 md:grid-cols-2">
            {people.map((p) => (
              <StaggerItem key={p.id}>
                <article className="surface-paper flex h-full flex-col justify-between p-4">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display text-lg font-medium text-ink-900">
                        {p.user ? pick(p.user, "name", locale) : t(`demo.personas.${p.key}.name`)}
                      </p>
                      <p className="text-xs text-ink-600">{t(`demo.personas.${p.key}.line`)}</p>
                    </div>
                    <p className="mt-2 text-sm text-ink-600">{t(`demo.personas.${p.key}.body`)}</p>
                  </div>
                  {p.user ? (
                    <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-dawn-200 pt-2.5 text-xs text-ink-600">
                      <div>
                        <dt className="label-caps text-ink-400">{t("demo.facts.age")}</dt>
                        <dd className="mt-0.5 font-medium text-ink-900">{p.age}</dd>
                      </div>
                      <div>
                        <dt className="label-caps text-ink-400">{t("demo.facts.intention")}</dt>
                        <dd className="mt-0.5 font-medium text-ink-900">{t(`intentions.${p.user.intention}`)}</dd>
                      </div>
                      <div>
                        <dt className="label-caps text-ink-400">{t("demo.facts.data")}</dt>
                        <dd className="mt-0.5 font-medium text-ink-900">
                          {t("demo.facts.dataValue", { sources: p.sourcesOn, n: p.observations })}
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </article>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-2.5 text-xs text-ink-600">{t("demo.personas.also")}</p>
        </section>

        <section className="mt-8 surface-paper p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-ink-900">{t("demo.exploreHeading")}</h2>
            <p className="text-xs text-ink-600">{t("demo.exploreBody")}</p>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {EXPLORE_ROUTES.map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-2 rounded-md border border-dawn-200 bg-dawn-50/50 px-3 py-2"
              >
                <span className="text-xs font-medium text-ink-900">{t(`demo.explore.${r.key}`)}</span>
                <form action={signInAndGo.bind(null, r.persona, r.locale ?? locale, r.path)}>
                  <button
                    type="submit"
                    className="rounded-md border border-dawn-300 bg-white px-2.5 py-1 text-xs font-medium text-mist-700 hover:bg-dawn-100"
                  >
                    {t("demo.go")} →
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4 border-t border-dawn-200 pt-5">
          <p className="max-w-xl text-xs text-ink-600">{t("demo.synthetic")}</p>
          <ResetDemoButton />
        </div>
      </div>
    </Page>
  );
}
