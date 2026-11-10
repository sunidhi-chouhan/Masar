import "server-only";
import type { ReadingCode } from "@/lib/model";
import type { ReportValue } from "@/server/store";
import { aiEnabled, generateJson } from "./gemini";

// Reads an uploaded test report. The values it finds are only suggestions:
// the person checks them before they count, and the doctor always has the
// original file. Without Gemini the file is simply passed to the doctor.

export const TESTS = [
  "Egg-reserve hormone (AMH) blood test",
  "Sperm test (semen analysis)",
  "Thyroid blood test (TSH)",
  "Blood sugar test (HbA1c)",
  "Pelvic ultrasound report",
  "Other test result",
] as const;

export const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const MAX_BYTES = 8 * 1024 * 1024;

/** Values Masar can follow over time, and the unit Masar keeps them in. */
const CODES: { code: ReadingCode; what: string; unit: string; hint?: string }[] = [
  { code: "amh", what: "Anti-Müllerian hormone (AMH)", unit: "ng/mL", hint: "convert pmol/L by dividing by 7.14" },
  { code: "semen_concentration", what: "Sperm concentration", unit: "M/mL", hint: "million per mL" },
  { code: "tsh", what: "Thyroid-stimulating hormone (TSH)", unit: "mIU/L" },
  { code: "hba1c", what: "Glycated haemoglobin (HbA1c)", unit: "%", hint: "convert mmol/mol with (x / 10.929) + 2.15" },
  { code: "bmi", what: "Body mass index", unit: "kg/m²" },
];

export interface ReportReading {
  values: ReportValue[];
  forPerson: string;
  forDoctor: string;
  readBy: "ai" | "none";
}

const SYSTEM = `You read medical test reports for Masar, a reproductive-health service. You will be given one uploaded file.

1. List every measured value you can clearly read: its name as printed, the number, the unit, and the test date (YYYY-MM-DD) if shown.
   - Only copy what is printed. Never guess or estimate a number. If you cannot read it clearly, leave it out.
   - Set "code" when the value is one of these, converting to the given unit if needed; otherwise null:
${CODES.map((c) => `     ${c.code}: ${c.what}, in ${c.unit}${c.hint ? ` (${c.hint})` : ""}`).join("\n")}
2. "forPerson": three or four short, calm sentences in everyday words for the patient. Say what the test measures, what the report shows compared with the lab's own reference range if it prints one, and that their doctor will go through it with them. No diagnosis, no chance of pregnancy, no treatment advice. No jargon.
3. "forDoctor": two or three concise clinical sentences for the family physician: key values against the printed reference ranges, anything flagged by the lab, and anything unreadable or missing.
If the file is not a medical test report, return no values and say so kindly in both summaries.`;

export async function readReport(file: { mime: string; bytes: Buffer }, test: string, lang: "en" | "ar" = "en"): Promise<ReportReading> {
  const none: ReportReading = {
    values: [],
    forPerson: "Your doctor has your report and will go through it with you.",
    forDoctor: "Report uploaded by the patient. Automatic reading is not switched on; please open the file.",
    readBy: "none",
  };
  if (!aiEnabled()) return none;
  try {
    const out = await generateJson<Omit<ReportReading, "readBy">>({
      system: SYSTEM + (lang === "ar" ? '\nWrite "forPerson" in clear, simple Modern Standard Arabic. Keep "forDoctor" in English.' : ""),
      temperature: 0,
      turns: [
        {
          role: "user",
          parts: [
            { text: `The doctor asked for: ${test}. Read the attached report.` },
            { inlineData: { mimeType: file.mime, data: file.bytes.toString("base64") } },
          ],
        },
      ],
      schema: {
        type: "OBJECT",
        properties: {
          values: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                value: { type: "NUMBER" },
                unit: { type: "STRING" },
                date: { type: "STRING", nullable: true },
                code: { type: "STRING", nullable: true, enum: CODES.map((c) => c.code) },
              },
              required: ["name", "value", "unit"],
            },
          },
          forPerson: { type: "STRING" },
          forDoctor: { type: "STRING" },
        },
        required: ["values", "forPerson", "forDoctor"],
      },
    });
    const values = (out.values ?? [])
      .filter((v) => Number.isFinite(v.value))
      .map((v) => {
        const known = CODES.find((c) => c.code === v.code);
        return {
          name: v.name,
          value: v.value,
          unit: known ? known.unit : v.unit,
          date: v.date && /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : null,
          code: known ? known.code : null,
        };
      });
    return { values, forPerson: out.forPerson, forDoctor: out.forDoctor, readBy: "ai" };
  } catch (e) {
    console.error("[reports]", e instanceof Error ? e.message : e);
    return none;
  }
}
