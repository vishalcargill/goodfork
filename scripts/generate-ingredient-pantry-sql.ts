import fs from "fs";
import path from "path";

type Recipe = {
  ingredients?: unknown;
};

type IngredientEntry = {
  slug: string;
  name: string;
  defaultUnit: string;
};

const DATA_PATH = path.join(process.cwd(), "data/recipes1.json");
const DATA_LABEL = path.relative(process.cwd(), DATA_PATH);
const OUTPUT_PATH = path.join(process.cwd(), "scripts/generated/ingredient-pantry-seed.sql");
const SYSTEM_EMAIL = (process.env.SYSTEM_PANTRY_EMAIL ?? "system+pantry@goodfork.com").toLowerCase();

const measurementTokens = [
  "about",
  "approx",
  "around",
  "roughly",
  "almost",
  "nearly",
  "just",
  "plus",
  "extra",
  "heaped",
  "level",
  "rounded",
  "scant",
  "generous",
  "good",
  "few",
  "several",
  "pinch",
  "pinches",
  "dash",
  "dashes",
  "drop",
  "drops",
  "sprinkle",
  "sprinkles",
  "small",
  "medium",
  "large",
  "big",
  "little",
  "tiny",
  "handful",
  "handfuls",
  "bunch",
  "bunches",
  "bundle",
  "bundles",
  "stick",
  "sticks",
  "sprig",
  "sprigs",
  "strip",
  "strips",
  "slice",
  "slices",
  "clove",
  "cloves",
  "bulb",
  "bulbs",
  "bottle",
  "bottles",
  "tin",
  "tins",
  "can",
  "cans",
  "jar",
  "jars",
  "packet",
  "packets",
  "pack",
  "packs",
  "pot",
  "pots",
  "tub",
  "tubs",
  "sheet",
  "sheets",
  "piece",
  "pieces",
  "cube",
  "cubes",
  "ball",
  "balls",
  "fillet",
  "fillets",
  "steak",
  "steaks",
  "rack",
  "racks",
  "rib",
  "ribs",
  "drumstick",
  "drumsticks",
  "wing",
  "wings",
  "breast",
  "breasts",
  "thigh",
  "thighs",
  "leg",
  "legs",
  "loaf",
  "loaves",
  "serving",
  "servings",
  "portion",
  "portions",
  "round",
  "rounds",
  "roll",
  "rolls",
  "ring",
  "rings",
  "wedge",
  "wedges",
  "chunk",
  "chunks",
  "layer",
  "layers",
  "batch",
  "batches",
  "bar",
  "bars",
  "leaf",
  "leaves",
  "head",
  "heads",
  "flower",
  "flowers",
  "stem",
  "stems",
  "ear",
  "ears",
  "cob",
  "cobs",
  "rasher",
  "rashers",
  "shoulder",
  "shoulders",
  "joint",
  "joints",
  "bone",
  "bones",
  "tail",
  "tails",
  "belly",
  "bellies",
  "cup",
  "cups",
  "teaspoon",
  "teaspoons",
  "tablespoon",
  "tablespoons",
  "tsp",
  "tsps",
  "tbsp",
  "tbsps",
  "dessertspoon",
  "dessertspoons",
  "pint",
  "pints",
  "quart",
  "quarts",
  "gallon",
  "gallons",
  "ml",
  "millilitre",
  "millilitres",
  "milliliter",
  "milliliters",
  "l",
  "litre",
  "litres",
  "liter",
  "liters",
  "dl",
  "kg",
  "kilogram",
  "kilograms",
  "gram",
  "grams",
  "g",
  "mg",
  "microgram",
  "micrograms",
  "lb",
  "lbs",
  "pound",
  "pounds",
  "ounce",
  "ounces",
  "oz",
  "stone",
  "stones",
  "cm",
  "mm",
  "inch",
  "inches",
];

const unitAliases = new Map<string, string>([
  ["tsp", "tsp"],
  ["tsps", "tsp"],
  ["teaspoon", "tsp"],
  ["teaspoons", "tsp"],
  ["tbsp", "tbsp"],
  ["tbsps", "tbsp"],
  ["tablespoon", "tbsp"],
  ["tablespoons", "tbsp"],
  ["dessertspoon", "tbsp"],
  ["dessertspoons", "tbsp"],
  ["cup", "cup"],
  ["cups", "cup"],
  ["ml", "ml"],
  ["millilitre", "ml"],
  ["millilitres", "ml"],
  ["milliliter", "ml"],
  ["milliliters", "ml"],
  ["l", "l"],
  ["litre", "l"],
  ["litres", "l"],
  ["liter", "l"],
  ["liters", "l"],
  ["dl", "l"],
  ["g", "g"],
  ["gram", "g"],
  ["grams", "g"],
  ["kg", "kg"],
  ["kilogram", "kg"],
  ["kilograms", "kg"],
  ["mg", "mg"],
  ["lb", "lb"],
  ["lbs", "lb"],
  ["pound", "lb"],
  ["pounds", "lb"],
  ["oz", "oz"],
  ["ounce", "oz"],
  ["ounces", "oz"],
  ["stick", "stick"],
  ["sticks", "stick"],
  ["clove", "clove"],
  ["cloves", "clove"],
  ["slice", "slice"],
  ["slices", "slice"],
  ["sprig", "sprig"],
  ["sprigs", "sprig"],
  ["bunch", "bunch"],
  ["bunches", "bunch"],
  ["packet", "packet"],
  ["pack", "packet"],
  ["packs", "packet"],
  ["packets", "packet"],
  ["tin", "tin"],
  ["tins", "tin"],
  ["can", "can"],
  ["cans", "can"],
  ["fillet", "fillet"],
  ["fillets", "fillet"],
  ["piece", "piece"],
  ["pieces", "piece"],
  ["head", "head"],
  ["heads", "head"],
  ["leaf", "leaf"],
  ["leaves", "leaf"],
  ["rib", "rib"],
  ["ribs", "rib"],
  ["ear", "ear"],
  ["ears", "ear"],
  ["drumstick", "drumstick"],
  ["drumsticks", "drumstick"],
  ["breast", "breast"],
  ["breasts", "breast"],
  ["thigh", "thigh"],
  ["thighs", "thigh"],
  ["leg", "leg"],
  ["legs", "leg"],
  ["wedge", "wedge"],
  ["wedges", "wedge"],
  ["ball", "ball"],
  ["balls", "ball"],
  ["loaf", "loaf"],
  ["loaves", "loaf"],
  ["sheet", "sheet"],
  ["sheets", "sheet"],
  ["pinch", "pinch"],
  ["pinches", "pinch"],
  ["dash", "dash"],
  ["dashes", "dash"],
  ["handful", "handful"],
  ["handfuls", "handful"],
  ["bottle", "bottle"],
  ["bottles", "bottle"],
]);

const fractionChars = ["¼", "½", "¾", "⅐", "⅑", "⅒", "⅓", "⅔", "⅕", "⅖", "⅗", "⅘", "⅙", "⅚", "⅛", "⅜", "⅝", "⅞"];
const fractionRegex = new RegExp(`[${fractionChars.join("")}]`, "g");
const measurementSet = new Set(measurementTokens.map((token) => token.toLowerCase()));

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const removeLeadingTokens = (value: string) => {
  let working = value.trim();
  if (!working) return working;

  working = working.replace(fractionRegex, "");
  working = working.replace(/^[^a-zA-Z]+/, "");

  const tokens = working.split(/\s+/);
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    const stripped = token.replace(/[^a-zA-Z0-9]/g, "");
    if (!stripped) {
      index += 1;
      continue;
    }
    const lower = stripped.toLowerCase();
    const startsWithDigit = /^\d/.test(stripped);
    const containsDigitLetter = /\d/.test(stripped) && /[a-zA-Z]/.test(stripped);
    if (startsWithDigit || containsDigitLetter || measurementSet.has(lower)) {
      index += 1;
      continue;
    }
    break;
  }

  if (index === 0) {
    return working.trim();
  }
  const trimmed = tokens.slice(index).join(" ");
  return trimmed.trim() || working.trim();
};

const cleanName = (raw: string) => {
  const trimmed = normalizeWhitespace(raw);
  let cleaned = trimmed.replace(/\([^)]*\)/g, "").replace(/\s+,/g, ",");
  cleaned = removeLeadingTokens(cleaned);
  cleaned = cleaned.replace(/^[-–]+/, "").trim();
  cleaned = cleaned.replace(/[,;\-]\s*$/g, "").trim();
  const fallback = cleaned || trimmed;
  const normalized = fallback.replace(/\s+/g, " ").trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const detectUnit = (raw: string) => {
  const tokens = raw.trim().split(/\s+/);
  for (const token of tokens) {
    const sanitized = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    if (!sanitized) {
      continue;
    }
    const alias = unitAliases.get(sanitized);
    if (alias) {
      return alias;
    }
    const digitLetterMatch = sanitized.match(/^(\d+)([a-zA-Z]+)$/);
    if (digitLetterMatch) {
      const maybeUnit = digitLetterMatch[2];
      const aliasFromJoined = unitAliases.get(maybeUnit);
      if (aliasFromJoined) {
        return aliasFromJoined;
      }
    }
  }
  return "unit";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);

const ensureSlug = (slug: string, used: Set<string>, fallbackIndex: number) => {
  const base = slug || `ingredient-${fallbackIndex}`;
  let attempt = base;
  let counter = 1;
  while (used.has(attempt)) {
    counter += 1;
    attempt = `${base}-${counter}`;
  }
  used.add(attempt);
  return attempt;
};

const escapeLiteral = (value: string) => value.replace(/'/g, "''");

const readRecipes = () => {
  const content = fs.readFileSync(DATA_PATH, "utf8");
  return JSON.parse(content) as Recipe[];
};

const extractIngredients = (recipes: Recipe[]) => {
  const seenNames = new Map<string, IngredientEntry>();
  const usedSlugs = new Set<string>();
  let fallback = 0;

  for (const recipe of recipes) {
    if (!recipe || !Array.isArray(recipe.ingredients)) continue;
    for (const raw of recipe.ingredients) {
      if (typeof raw !== "string") continue;
      const cleanedName = cleanName(raw);
      const key = cleanedName.toLowerCase();
      if (seenNames.has(key)) continue;
      fallback += 1;
      const slug = ensureSlug(slugify(cleanedName), usedSlugs, fallback);
      seenNames.set(key, {
        slug,
        name: cleanedName,
        defaultUnit: detectUnit(raw),
      });
    }
  }

  return Array.from(seenNames.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const buildSql = (entries: IngredientEntry[]) => {
  const valuesSql = entries
    .map(
      ({ slug, name, defaultUnit }) =>
        `    ('${escapeLiteral(slug)}', '${escapeLiteral(name)}', '${escapeLiteral(defaultUnit)}')`
    )
    .join(",\n");

  return `-- Generated from ${DATA_LABEL} to seed Ingredient + Pantry data\n-- Records: ${
    entries.length
  }\nBEGIN;\nCREATE EXTENSION IF NOT EXISTS \"pgcrypto\";\nWITH ingredient_payload (slug, name, unit) AS (\n  VALUES\n${valuesSql}\n),\nupserted_ingredients AS (\n  INSERT INTO \"Ingredient\" (\"id\", \"slug\", \"name\", \"defaultUnit\", \"allergens\", \"tags\")\n  SELECT gen_random_uuid()::text, slug, name, unit, '{}'::text[], '{}'::text[]\n  FROM ingredient_payload\n  ON CONFLICT (\"slug\") DO UPDATE\n    SET \"name\" = EXCLUDED.\"name\",\n        \"defaultUnit\" = EXCLUDED.\"defaultUnit\"\n  RETURNING id, slug, name, \"defaultUnit\"\n),\nselected_user AS (\n  SELECT id FROM \"User\" WHERE email = lower('${escapeLiteral(
    SYSTEM_EMAIL
  )}') LIMIT 1\n)\nINSERT INTO \"PantryItem\" (\"id\", \"userId\", \"ingredientId\", \"quantity\", \"unitLabel\", \"status\")\nSELECT gen_random_uuid()::text, selected_user.id, upserted_ingredients.id, 0.00, upserted_ingredients.\"defaultUnit\", 'OUT_OF_STOCK'\nFROM upserted_ingredients\nCROSS JOIN selected_user\nON CONFLICT (\"userId\", \"ingredientId\") DO NOTHING;\nCOMMIT;\n`;
};

const main = () => {
  const recipes = readRecipes();
  const ingredients = extractIngredients(recipes);
  const sql = buildSql(ingredients);
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, sql);
  console.log(`Wrote SQL seed with ${ingredients.length} ingredients to ${OUTPUT_PATH}`);
};

main();
