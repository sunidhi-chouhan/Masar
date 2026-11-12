// A real PDF file of the health report. Each page is drawn with the browser's
// own text (so Arabic is shaped correctly), then embedded as a JPEG.

export type PdfBlock = { kind: "kicker" | "title" | "meta" | "notice" | "h2" | "h3" | "p" | "li"; text: string };

const CSS_W = 794;
const CSS_H = 1123;
const SCALE = 2;
const MARGIN = 56;
const PAGE_W = 595.28;
const PAGE_H = 841.89;

export async function downloadPdf(filename: string, blocks: PdfBlock[], lang: "en" | "ar") {
  await document.fonts.ready;
  const pages = drawPages(blocks.filter((b) => b.text.trim()), lang);
  const pdf = pdfFromJpegs(pages.map((canvas) => ({ width: canvas.width, height: canvas.height, jpeg: jpegBytes(canvas) })));
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function drawPages(blocks: PdfBlock[], lang: "en" | "ar") {
  const rtl = lang === "ar";
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const maxW = CSS_W - MARGIN * 2;
  const pages: HTMLCanvasElement[] = [];
  let page = openPage(family, rtl);
  pages.push(page.canvas);

  const ensure = (need: number) => {
    if (page.y + need <= CSS_H - MARGIN) return;
    page = openPage(family, rtl);
    pages.push(page.canvas);
  };

  for (const block of blocks) {
    const style = STYLE[block.kind];
    page.ctx.font = `${style.weight} ${style.size}px ${family}`;
    const lines = wrap(page.ctx, block.text, maxW - (block.kind === "li" ? 16 : 0));
    const height = lines.length * style.leading + style.before + style.after;
    if (block.kind === "h2" || block.kind === "h3") ensure(height + 36);
    else ensure(height);
    page.y += style.before;
    if (block.kind === "h2") {
      page.ctx.strokeStyle = "#1c1917";
      page.ctx.lineWidth = 1.5;
      page.ctx.beginPath();
      page.ctx.moveTo(MARGIN, page.y + lines.length * style.leading + 6);
      page.ctx.lineTo(CSS_W - MARGIN, page.y + lines.length * style.leading + 6);
      page.ctx.stroke();
    }
    page.ctx.fillStyle = style.color;
    page.ctx.font = `${style.weight} ${style.size}px ${family}`;
    const x = rtl ? CSS_W - MARGIN : MARGIN;
    for (const line of lines) {
      if (block.kind === "li") {
        page.ctx.beginPath();
        page.ctx.fillStyle = "#1E5B56";
        page.ctx.arc(rtl ? x - 5 : x + 5, page.y + style.size * 0.45, 2.2, 0, Math.PI * 2);
        page.ctx.fill();
        page.ctx.fillStyle = style.color;
        page.ctx.fillText(line, rtl ? x - 16 : x + 16, page.y + style.size);
      } else {
        page.ctx.fillText(line, x, page.y + style.size);
      }
      page.y += style.leading;
    }
    page.y += style.after;
  }
  return pages;
}

const STYLE: Record<PdfBlock["kind"], { size: number; leading: number; weight: string; color: string; before: number; after: number }> = {
  kicker: { size: 11, leading: 16, weight: "600", color: "#1E5B56", before: 0, after: 10 },
  title: { size: 28, leading: 34, weight: "600", color: "#1c1917", before: 0, after: 8 },
  meta: { size: 12, leading: 18, weight: "400", color: "#625e55", before: 0, after: 12 },
  notice: { size: 11, leading: 16, weight: "400", color: "#625e55", before: 0, after: 18 },
  h2: { size: 16, leading: 22, weight: "600", color: "#1c1917", before: 16, after: 12 },
  h3: { size: 14, leading: 20, weight: "600", color: "#1c1917", before: 10, after: 4 },
  p: { size: 12.5, leading: 18, weight: "400", color: "#1c1917", before: 0, after: 6 },
  li: { size: 12.5, leading: 18, weight: "400", color: "#1c1917", before: 0, after: 3 },
};

function openPage(family: string, rtl: boolean) {
  const canvas = document.createElement("canvas");
  canvas.width = CSS_W * SCALE;
  canvas.height = CSS_H * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CSS_W, CSS_H);
  ctx.direction = rtl ? "rtl" : "ltr";
  ctx.textAlign = rtl ? "right" : "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `16px ${family}`;
  return { canvas, ctx, y: MARGIN };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const trial = line ? `${line} ${word}` : word;
    if (ctx.measureText(trial).width <= maxW) line = trial;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function jpegBytes(canvas: HTMLCanvasElement) {
  const url = canvas.toDataURL("image/jpeg", 0.86);
  const bin = atob(url.slice(url.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function pdfFromJpegs(pages: { width: number; height: number; jpeg: Uint8Array }[]) {
  const chunks: Uint8Array[] = [];
  const enc = new TextEncoder();
  let offset = 0;
  const offsets: number[] = [0];
  const add = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? enc.encode(part) : part;
    chunks.push(bytes);
    offset += bytes.length;
  };
  const obj = (n: number, body: string | Uint8Array, extra = "") => {
    offsets[n] = offset;
    add(`${n} 0 obj\n`);
    if (typeof body === "string") add(body);
    else add(body);
    if (extra) add(extra);
    add("\nendobj\n");
  };

  add("%PDF-1.4\n");
  const n = pages.length;
  obj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  const kids = pages.map((_, i) => `${3 + i * 3} 0 R`).join(" ");
  obj(2, `<< /Type /Pages /Count ${n} /Kids [${kids}] >>`);
  pages.forEach((page, i) => {
    const pageId = 3 + i * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const content = `q\n${PAGE_W} 0 0 ${PAGE_H} 0 0 cm\n/Im${i} Do\nQ\n`;
    obj(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentId} 0 R /Resources << /XObject << /Im${i} ${imageId} 0 R >> >> >>`);
    obj(contentId, `<< /Length ${content.length} >>\nstream\n${content}endstream`);
    offsets[imageId] = offset;
    add(`${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`);
    add(page.jpeg);
    add("\nendstream\nendobj\n");
  });
  const start = offset;
  const count = 2 + n * 3;
  let xref = `xref\n0 ${count + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= count; i++) xref += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  add(xref);
  add(`trailer\n<< /Size ${count + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`);
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
