import { pageContext } from "@/lib/page-context";
import { prisma } from "@/lib/db/prisma";
import { signInAs, signOut } from "@/server/actions/auth";
import type { Translator } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/config";
import { LinkButton, Page, SimulatedBadge } from "@/components/ui/atoms";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/motion";

const PERSONA_KEYS: Record<string, string> = {
  u_mariam: "mariam",
  u_omar: "omar",
  u_fatima: "fatima",
  u_sara: "sara",
  u_layla: "layla",
  u_admin: "admin",
};

const PEOPLE = ["u_mariam", "u_fatima", "u_omar", "u_sara"];
const WORKSPACES = ["u_layla", "u_admin"];

function PersonaCard({
  user,
  locale,
  t,
  active,
}: {
  user: { id: string; name: string; nameAr: string; role: string };
  locale: Locale;
  t: Translator;
  active: boolean;
}) {
  const name = locale === "ar" ? user.nameAr : user.name;
  return (
    <StaggerItem>
      <form
        action={signInAs.bind(null, user.id, locale)}
        className={`surface-paper lift flex h-full flex-col justify-between gap-3 p-4 ${
          active ? "border-mist-500 ring-1 ring-mist-500" : ""
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-lg font-medium text-ink-900">{name}</p>
              <p className="label-caps mt-0.5">{t(`login.roles.${user.role}`)}</p>
            </div>
            {active ? (
              <span className="rounded-sm bg-mist-100 px-2 py-0.5 text-xs font-medium text-mist-700">✓</span>
            ) : null}
          </div>
          <p className="mt-2.5 text-sm text-ink-600">{t(`login.personas.${PERSONA_KEYS[user.id]}`)}</p>
        </div>
        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-md bg-mist-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-mist-500"
        >
          {t("login.enter", { name })}
        </button>
      </form>
    </StaggerItem>
  );
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  const { locale, t, session } = await pageContext(params);
  const users = await prisma.user.findMany({
    where: { id: { in: Object.keys(PERSONA_KEYS) } },
  });
  const byId = new Map(users.map((u) => [u.id, u]));

  const cards = (ids: string[]) =>
    ids.map((id) => {
      const u = byId.get(id);
      if (!u) return null;
      return <PersonaCard key={id} user={u} locale={locale} t={t} active={session?.userId === u.id} />;
    });

  return (
    <Page wide>
      <Reveal>
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-caps">{t("account.demoMode")}</p>
          <SimulatedBadge />
        </div>
        <h1 className="mt-1 text-ink-900">{t("login.title")}</h1>
        <p className="mt-1.5 max-w-xl text-sm text-ink-600">{t("login.subtitle")}</p>
        <div className="mt-5">
          <LinkButton href={`/${locale}/journey`} tone="primary">
            {t("journey.start")} →
          </LinkButton>
        </div>
        <p className="mt-2 text-xs text-ink-400">{t("journey.startHint")}</p>
      </Reveal>

      <section className="mt-10" aria-labelledby="people-heading">
        <h2 id="people-heading" className="text-ink-900">{t("login.peopleTitle")}</h2>
        <p className="mt-1 max-w-xl text-sm text-ink-600">{t("login.peopleBody")}</p>
        <Stagger className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards(PEOPLE)}</Stagger>
      </section>

      <section className="mt-10" aria-labelledby="workspaces-heading">
        <h2 id="workspaces-heading" className="text-ink-900">{t("login.workspacesTitle")}</h2>
        <p className="mt-1 max-w-xl text-sm text-ink-600">{t("login.workspacesBody")}</p>
        <Stagger className="mt-4 grid gap-3 sm:grid-cols-2">{cards(WORKSPACES)}</Stagger>
      </section>

      {session ? (
        <form action={signOut.bind(null, locale)} className="mt-8 text-center">
          <button type="submit" className="text-xs text-ink-600 underline-offset-4 hover:underline">
            {t("account.signOut")}
          </button>
        </form>
      ) : null}
    </Page>
  );
}
