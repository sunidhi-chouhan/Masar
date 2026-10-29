import Link from "next/link";
import { requireRole } from "@/lib/page-context";
import { prisma } from "@/lib/db/prisma";
import type { DataSourceId, Sex } from "@/lib/domain/types";
import { GlowField, Page } from "@/components/ui/atoms";
import { Reveal } from "@/components/ui/motion";
import { ImportPanel } from "@/components/import/import-panel";

export default async function ImportPage({ params }: PageProps<"/[locale]/import">) {
  const { locale, t, session } = await requireRole(params, ["patient"]);
  const [user, events] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.userId } }),
    prisma.integrationEvent.findMany({ where: { userId: session.userId, status: "ok" }, orderBy: { createdAt: "desc" } }),
  ]);
  const lastSync: Partial<Record<DataSourceId, string | null>> = {};
  for (const e of events) {
    const k = e.dataSourceId as DataSourceId;
    if (!lastSync[k]) lastSync[k] = e.createdAt.toISOString();
  }
  return (
    <div className="relative overflow-hidden">
      <GlowField variant="mist" />
      <Page>
        <Reveal>
          <Link href={`/${locale}/trajectory`} className="text-sm text-mist-700 underline-offset-4 hover:underline">
            ← {t("trajectory.title")}
          </Link>
          <div className="mt-4">
            <ImportPanel sex={user.sex as Sex} lastSync={lastSync} />
          </div>
          <p className="mt-4 text-xs text-ink-400">
            <Link href={`/${locale}/privacy`} className="underline-offset-4 hover:underline">
              {t("nav.privacy")}
            </Link>{" "}
            · <a href={`/api/fhir/${session.userId}`} className="underline-offset-4 hover:underline">FHIR R4 export (JSON)</a>
          </p>
        </Reveal>
      </Page>
    </div>
  );
}
