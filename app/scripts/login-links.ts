// Prints a signed login link for every account.
// Run: npm run login-links            (links for http://localhost:3000)
//      BASE_URL=https://masar.example npm run login-links
// Use the same SESSION_SECRET as the server, or the links will be rejected.
import { ACCOUNTS, createLoginToken } from "../src/lib/accounts";

const base = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const days = Number(process.env.LINK_DAYS ?? 30);

console.log(`Masar login links (valid ${days} days)\n`);
for (const a of ACCOUNTS) {
  console.log(`${a.name} (${a.role})`);
  console.log(`  ${a.description}`);
  console.log(`  ${base}/auth/${encodeURIComponent(createLoginToken(a, days))}\n`);
}
