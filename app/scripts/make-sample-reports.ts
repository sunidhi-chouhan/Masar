// Writes made-up lab reports to public/samples, for trying the upload flow
// without anyone's real results. Plain PDF, no dependencies.
// Run: npm run samples
import fs from "node:fs";
import path from "node:path";

type Line = { text: string; size?: number; bold?: boolean; gap?: number; x?: number };

function pdf(lines: Line[]): Buffer {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  let y = 790;
  const ops: string[] = [];
  for (const l of lines) {
    y -= l.gap ?? (l.size ?? 10) + 6;
    ops.push(`BT /${l.bold ? "F2" : "F1"} ${l.size ?? 10} Tf ${l.x ?? 56} ${y} Td (${esc(l.text)}) Tj ET`);
  }
  ops.push("0.85 0.85 0.85 RG 56 740 m 539 740 l S");
  const stream = ops.join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out, "latin1"));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const header = (title: string, patient: string, dob: string, date: string): Line[] => [
  { text: "Sample Diagnostics Laboratory, Abu Dhabi", size: 15, bold: true, gap: 0 },
  { text: "SAMPLE REPORT - made-up data for testing Masar. Not a real patient.", size: 8.5, gap: 16 },
  { text: title, size: 12, bold: true, gap: 34 },
  { text: `Patient: ${patient}`, gap: 22 },
  { text: `Date of birth: ${dob}` },
  { text: `Sample collected: ${date}      Reported: ${date}` },
];

const row = (name: string, result: string, unit: string, range: string, flag = ""): Line[] => [
  { text: name, gap: 18 },
  { text: result, x: 270, gap: 0, bold: Boolean(flag) },
  { text: unit, x: 330, gap: 0 },
  { text: range, x: 410, gap: 0 },
  { text: flag, x: 510, gap: 0, bold: true },
];

const tableHead: Line[] = [
  { text: "Test", bold: true, gap: 30 },
  { text: "Result", x: 270, gap: 0, bold: true },
  { text: "Unit", x: 330, gap: 0, bold: true },
  { text: "Reference range", x: 410, gap: 0, bold: true },
];

const samples: Record<string, Line[]> = {
  "noura-amh-follow-up.pdf": [
    ...header("Anti-Mullerian Hormone (AMH)", "Noura Al Mansouri", "1992-03-14", "2026-10-28"),
    ...tableHead,
    ...row("Anti-Mullerian Hormone (AMH)", "1.3", "ng/mL", "1.0 - 4.0 (age 30-35)"),
    ...row("Anti-Mullerian Hormone (AMH)", "9.3", "pmol/L", "7.1 - 28.6"),
    { text: "Method: electrochemiluminescence immunoassay.", size: 9, gap: 34 },
    { text: "AMH reflects ovarian reserve. It does not predict natural fertility on its own.", size: 9 },
    { text: "Interpret together with age, cycle history and antral follicle count.", size: 9 },
  ],
  "arjun-semen-analysis.pdf": [
    ...header("Semen Analysis (WHO 2021)", "Arjun Nair", "1989-07-02", "2026-10-29"),
    ...tableHead,
    ...row("Volume", "2.4", "mL", ">= 1.4"),
    ...row("Sperm concentration", "14", "million/mL", ">= 16", "L"),
    ...row("Total sperm number", "34", "million", ">= 39", "L"),
    ...row("Progressive motility", "28", "%", ">= 30", "L"),
    ...row("Normal forms", "4", "%", ">= 4"),
    ...row("Vitality", "62", "%", ">= 54"),
    { text: "Abstinence: 3 days. Sample complete. Analysed within 45 minutes.", size: 9, gap: 34 },
    { text: "L = below the lower reference limit. A single result should be repeated before conclusions are drawn.", size: 9 },
  ],
  "thyroid-and-sugar.pdf": [
    ...header("Thyroid function and HbA1c", "Maryam Haddad", "1997-01-21", "2026-10-30"),
    ...tableHead,
    ...row("TSH", "2.1", "mIU/L", "0.4 - 4.0"),
    ...row("Free T4", "15.2", "pmol/L", "12 - 22"),
    ...row("HbA1c", "5.4", "%", "< 5.7"),
    ...row("HbA1c (IFCC)", "36", "mmol/mol", "< 39"),
    { text: "All results within reference ranges.", size: 9, gap: 34 },
  ],
};

const dir = path.join(process.cwd(), "public", "samples");
fs.mkdirSync(dir, { recursive: true });
for (const [name, lines] of Object.entries(samples)) {
  fs.writeFileSync(path.join(dir, name), pdf(lines));
  console.log(`wrote public/samples/${name}`);
}
