// Synthetic people only. Nothing here is derived from a real person.
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import type { Domain } from "../src/lib/domain/types";
import { clock, personaSpecs, seedNarrativeHistory, seedPersona, seedSources, seedStaff } from "./personas";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./prisma/dev.db" }),
});

const NOW = new Date();
const { monthsAgo, daysAgo } = clock(NOW);

// Deterministic PRNG so the cohort is identical on every reset.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261028);
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;

async function reset() {
  await prisma.auditEvent.deleteMany();
  await prisma.teachBackResponse.deleteMany();
  await prisma.clinicianReview.deleteMany();
  await prisma.integrationEvent.deleteMany();
  await prisma.careAction.deleteMany();
  await prisma.domainAssessment.deleteMany();
  await prisma.consentGrant.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.coupleLink.deleteMany();
  await prisma.healthProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dataSource.deleteMany();
}

async function seedCohort(n: number) {
  const nationalities = ["Emirati", "Emirati", "Emirati", "Indian", "Egyptian", "Filipino", "Pakistani", "British"];
  const languagesFor: Record<string, string[]> = {
    Emirati: ["ar", "ar", "en"],
    Indian: ["en", "hi", "ml"],
    Egyptian: ["ar"],
    Filipino: ["en", "tl"],
    Pakistani: ["ur", "en"],
    British: ["en"],
  };
  const intentions = ["NotPlanning", "MaybeLater", "MaybeLater", "TryingNow", "PreferNotToSay"];
  const conditionsPool = ["pcos", "hypothyroidism", "endometriosis", "prediabetes", "varicocele"];

  for (let i = 0; i < n; i++) {
    const sex = chance(0.6) ? "female" : "male";
    const nationality = pick(nationalities);
    const language = pick(languagesFor[nationality]);
    const age = 20 + Math.floor(rand() * 22);
    const intention = pick(intentions);
    const conds: string[] = [];
    if (chance(0.5)) {
      const c = pick(conditionsPool);
      if ((c === "varicocele" && sex === "male") || (c !== "varicocele" && (sex === "female" || c === "prediabetes"))) conds.push(c);
    }
    const id = `c_${String(i).padStart(3, "0")}`;
    await prisma.user.create({
      data: {
        id,
        role: "cohort",
        name: `Synthetic ${i}`,
        nameAr: `اصطناعي ${i}`,
        sex,
        birthYear: NOW.getFullYear() - age,
        nationality,
        language,
        intention,
        hue: Math.floor(rand() * 360),
        profile: { create: { conditions: JSON.stringify(conds), completed: JSON.stringify(["intention", "conditions"]) } },
      },
    });
    const analyticsOn = chance(0.85);
    await prisma.consentGrant.create({
      data: {
        subjectId: id,
        recipientRole: "Analytics",
        purpose: "PopulationAnalytics",
        status: analyticsOn ? "active" : "revoked",
        revokedAt: analyticsOn ? null : monthsAgo(3),
      },
    });

    const domains: Domain[] = sex === "female"
      ? ["cycle", "reserve", "metabolic", "conditions", "lifestyle"]
      : ["male", "metabolic", "conditions", "lifestyle"];
    const hasSignal = chance(conds.length ? 0.8 : 0.4);
    const signalDays = 30 + Math.floor(rand() * 500);
    const signalDomain = conds.includes("pcos") ? "cycle" : pick(domains);

    for (const d of domains) {
      if (d === signalDomain && hasSignal) {
        // 8% of signals were preceded by a Stable reading: false-reassurance monitor input
        if (chance(0.08)) {
          await prisma.domainAssessment.create({
            data: { userId: id, domain: d, direction: "Stable", confidence: "Moderate", computedAt: daysAgo(signalDays + 120) },
          });
        }
        await prisma.domainAssessment.create({
          data: { userId: id, domain: d, direction: chance(0.7) ? "Discuss" : "Shifting", confidence: pick(["Moderate", "High", "Low"]), computedAt: daysAgo(signalDays) },
        });
      } else {
        const dir = chance(0.35) ? "Unknown" : "Stable";
        await prisma.domainAssessment.create({
          data: {
            userId: id,
            domain: d,
            direction: dir,
            confidence: dir === "Unknown" ? "InsufficientData" : pick(["Moderate", "High"]),
            computedAt: daysAgo(signalDays + Math.floor(rand() * 60)),
          },
        });
      }
    }

    if (hasSignal) {
      // Reach is uneven by design so the equity panel has something honest to show.
      const langPenalty = language === "en" || language === "ar" ? 0 : 1;
      const suggested = chance(0.9);
      if (!suggested) continue;
      const requested = chance(0.65 - 0.2 * langPenalty);
      const reqDelay = Math.floor(5 + rand() * (40 + 60 * langPenalty));
      const confirmed = requested && chance(0.9);
      const attended = confirmed && chance(0.75);
      const attDelay = reqDelay + 10 + Math.floor(rand() * 30);
      const state = attended ? "Attended" : confirmed ? "Confirmed" : requested ? "Requested" : "Suggested";
      await prisma.careAction.create({
        data: {
          userId: id,
          type: "Counsel",
          domain: signalDomain,
          state,
          titleKey: "counsel_preconception",
          reasonKey: "t2",
          suggestedAt: daysAgo(signalDays),
          requestedAt: requested ? daysAgo(Math.max(0, signalDays - reqDelay)) : null,
          confirmedAt: confirmed ? daysAgo(Math.max(0, signalDays - reqDelay - 3)) : null,
          attendedAt: attended ? daysAgo(Math.max(0, signalDays - attDelay)) : null,
        },
      });
      if (attended && chance(0.5)) {
        const done = chance(0.6);
        await prisma.careAction.create({
          data: {
            userId: id,
            type: "TestDiscuss",
            domain: signalDomain,
            state: done ? "Attended" : "Requested",
            titleKey: "test_metabolic",
            reasonKey: "tm",
            suggestedAt: daysAgo(Math.max(0, signalDays - attDelay)),
            requestedAt: daysAgo(Math.max(0, signalDays - attDelay - 2)),
            attendedAt: done ? daysAgo(Math.max(0, signalDays - attDelay - 20)) : null,
          },
        });
      }
    }
  }
}

async function main() {
  console.log("Resetting synthetic database…");
  await reset();
  await seedSources(prisma, NOW);
  await seedStaff(prisma);
  for (const p of personaSpecs(NOW)) {
    const results = await seedPersona(prisma, p, NOW);
    console.log(
      `  ${p.name}: ${results.map((r) => `${r.domain}=${r.direction}/${r.confidence}`).join(", ")}`,
    );
  }
  await seedNarrativeHistory(prisma, NOW);
  console.log("Seeding synthetic cohort…");
  await seedCohort(600);
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.observation.count(),
    prisma.domainAssessment.count(),
    prisma.careAction.count(),
  ]);
  console.log(`Done. users=${counts[0]} observations=${counts[1]} assessments=${counts[2]} actions=${counts[3]}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
