import "server-only";
import { cookies } from "next/headers";
import { LANG_COOKIE, t, type Lang, type Vars } from "@/lib/i18n";

export async function getLang(): Promise<Lang> {
  return (await cookies()).get(LANG_COOKIE)?.value === "ar" ? "ar" : "en";
}

/** For server components: `const { t, lang } = await translator();` */
export async function translator() {
  const lang = await getLang();
  return { lang, t: (text: string, vars?: Vars) => t(lang, text, vars) };
}
