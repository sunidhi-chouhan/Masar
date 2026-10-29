export type Dictionary = { [key: string]: string | Dictionary };

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

function lookup(dict: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  let node: string | Dictionary | undefined = dict;
  for (const part of parts) {
    if (node === undefined || typeof node === "string") return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`,
  );
}

/** Translator with English fallback so a missing Arabic key never renders a raw key. */
export function createTranslator(dict: Dictionary, fallback: Dictionary): Translator {
  return (key, vars) => {
    const value = lookup(dict, key) ?? lookup(fallback, key) ?? key;
    return interpolate(value, vars);
  };
}
