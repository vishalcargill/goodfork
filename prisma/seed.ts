import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, InventoryStatus, Prisma } from "../src/generated/prisma/client";
import { SYSTEM_PANTRY_EMAIL } from "../src/constants/app.constants";

const DATABASE_URL = process.env.DATABASE_URL ?? "";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Seed aborted.");
}

const adapter = new PrismaPg({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const adminSeed = {
  name: "admin",
  email: "admin@cargill.com",
  password: "admin@123",
};

const systemPantrySeedUser = {
  name: "GoodFork Pantry",
  email: SYSTEM_PANTRY_EMAIL,
  password: "pantry@123",
  pantry: [
    { ingredientSlug: "salmon-fillet", quantity: 60, unitLabel: "fillet", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "broccolini", quantity: 24, unitLabel: "cup", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "quinoa", quantity: 30, unitLabel: "cup", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "citrus-glaze", quantity: 16, unitLabel: "oz", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "rainbow-veggies", quantity: 8, unitLabel: "cup", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "farro", quantity: 0, unitLabel: "cup", status: InventoryStatus.OUT_OF_STOCK },
    { ingredientSlug: "baby-kale", quantity: 18, unitLabel: "cup", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "tahini", quantity: 6, unitLabel: "oz", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "tofu", quantity: 20, unitLabel: "block", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "butter-lettuce", quantity: 12, unitLabel: "cups", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "lime-vinaigrette", quantity: 4, unitLabel: "oz", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "veggie-crunch", quantity: 0, unitLabel: "cup", status: InventoryStatus.OUT_OF_STOCK },
  ],
};

const ingredientCatalog = [
  { slug: "salmon-fillet", name: "Salmon fillet", defaultUnit: "fillet", allergens: ["FISH"], tags: ["PROTEIN_FORWARD"] },
  { slug: "broccolini", name: "Broccolini", defaultUnit: "cup", allergens: [], tags: ["GUT_HEALTH"] },
  { slug: "quinoa", name: "Tri-color quinoa", defaultUnit: "cup", allergens: [], tags: ["BLEEDING_EDGE_GRAIN"] },
  { slug: "citrus-glaze", name: "Citrus herb glaze", defaultUnit: "oz", allergens: [], tags: ["BRIGHT"] },
  { slug: "rainbow-veggies", name: "Roasted rainbow veggies", defaultUnit: "cup", allergens: [], tags: ["FIBER_RICH"] },
  { slug: "farro", name: "Farro", defaultUnit: "cup", allergens: ["WHEAT"], tags: ["WHOLE_GRAIN"] },
  { slug: "baby-kale", name: "Baby kale", defaultUnit: "cup", allergens: [], tags: ["GREENS"] },
  { slug: "tahini", name: "Tahini dressing", defaultUnit: "oz", allergens: ["SESAME"], tags: ["HEALTHY_FATS"] },
  { slug: "tofu", name: "Crispy tofu", defaultUnit: "block", allergens: ["SOY"], tags: ["PLANT_PROTEIN"] },
  { slug: "butter-lettuce", name: "Butter lettuce cups", defaultUnit: "cup", allergens: [], tags: ["LIGHTER_CHOICE"] },
  { slug: "lime-vinaigrette", name: "Lime vinaigrette", defaultUnit: "oz", allergens: [], tags: ["BRIGHT"] },
  { slug: "veggie-crunch", name: "Crunchy veggie mix", defaultUnit: "cup", allergens: [], tags: ["FIBER_RICH"] },
];

const sampleRecipes = [
  {
    slug: "citrus-herb-salmon",
    title: "Citrus Herb Salmon",
    description: "Omega-3 rich salmon with roasted broccolini, citrus glaze, and quinoa.",
    cuisine: "CALIFORNIA",
    calories: 520,
    proteinGrams: 42,
    carbsGrams: 36,
    fatGrams: 22,
    priceCents: 1850,
    tags: ["PROTEIN_FORWARD", "GLUTEN_FREE"],
    allergens: ["FISH"],
    healthyHighlights: ["OMEGA_3", "HEART_HEALTHY"],
    imageUrl: "/images/recipes/citrus-salmon.jpg",
    ingredients: [
      { ingredientSlug: "salmon-fillet", quantity: 1, unitLabel: "fillet" },
      { ingredientSlug: "broccolini", quantity: 1, unitLabel: "cup" },
      { ingredientSlug: "quinoa", quantity: 0.75, unitLabel: "cup" },
      { ingredientSlug: "citrus-glaze", quantity: 2, unitLabel: "oz" },
    ],
    inventory: {
      quantity: 24,
      unitLabel: "plates",
      status: InventoryStatus.IN_STOCK,
    },
  },
  {
    slug: "rainbow-bowl",
    title: "Rainbow Macro Bowl",
    description: "Roasted veggies, farro, baby kale, pickled onions, tahini drizzle.",
    cuisine: "MEDITERRANEAN",
    calories: 610,
    proteinGrams: 28,
    carbsGrams: 72,
    fatGrams: 18,
    priceCents: 1450,
    tags: ["FIBER_RICH", "VEGETARIAN"],
    allergens: ["SESAME", "WHEAT"],
    healthyHighlights: ["GUT_HEALTH", "BALANCED_MACROS"],
    imageUrl: "/images/recipes/rainbow-bowl.jpg",
    ingredients: [
      { ingredientSlug: "rainbow-veggies", quantity: 1.25, unitLabel: "cup" },
      { ingredientSlug: "farro", quantity: 0.75, unitLabel: "cup" },
      { ingredientSlug: "baby-kale", quantity: 1, unitLabel: "cup" },
      { ingredientSlug: "tahini", quantity: 1.5, unitLabel: "oz" },
    ],
    inventory: {
      quantity: 35,
      unitLabel: "bowls",
      status: InventoryStatus.IN_STOCK,
    },
  },
  {
    slug: "spicy-tofu-lettuce-wraps",
    title: "Spicy Tofu Lettuce Wraps",
    description: "Crispy chili tofu, crunchy veggies, lime vinaigrette, butter lettuce.",
    cuisine: "PAN_ASIAN",
    calories: 430,
    proteinGrams: 32,
    carbsGrams: 38,
    fatGrams: 18,
    priceCents: 1250,
    tags: ["LOW_CARB", "PLANT_BASED"],
    allergens: ["SOY"],
    healthyHighlights: ["LIGHTER_CHOICE", "ENERGY_FOCUS"],
    imageUrl: "/images/recipes/tofu-wraps.jpg",
    ingredients: [
      { ingredientSlug: "tofu", quantity: 0.75, unitLabel: "block" },
      { ingredientSlug: "butter-lettuce", quantity: 4, unitLabel: "cups" },
      { ingredientSlug: "veggie-crunch", quantity: 1, unitLabel: "cup" },
      { ingredientSlug: "lime-vinaigrette", quantity: 1.5, unitLabel: "oz" },
    ],
    inventory: {
      quantity: 18,
      unitLabel: "wraps",
      status: InventoryStatus.LOW_STOCK,
    },
  },
];

const pantryUserSeed = {
  name: "Jordan Demo",
  email: "jordan@goodfork.com",
  password: "demo@123",
  profile: {
    dietaryGoals: ["LEAN_MUSCLE"],
    allergens: ["SOY"],
    dietaryPreferences: ["MEDITERRANEAN"],
    tastePreferences: ["BRIGHT", "COMFORT"],
    lifestyleNotes: "Peloton mornings + desk lunches.",
  },
  pantry: [
    { ingredientSlug: "salmon-fillet", quantity: 2, unitLabel: "fillet", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "quinoa", quantity: 1.5, unitLabel: "cup", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "broccolini", quantity: 1, unitLabel: "cup", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "rainbow-veggies", quantity: 0.5, unitLabel: "cup", status: InventoryStatus.LOW_STOCK },
    { ingredientSlug: "baby-kale", quantity: 1.5, unitLabel: "cup", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "tahini", quantity: 0.5, unitLabel: "oz", status: InventoryStatus.OUT_OF_STOCK },
    { ingredientSlug: "butter-lettuce", quantity: 3, unitLabel: "cups", status: InventoryStatus.IN_STOCK },
    { ingredientSlug: "lime-vinaigrette", quantity: 1, unitLabel: "oz", status: InventoryStatus.IN_STOCK },
  ],
};

async function seedAdmin() {
  const email = adminSeed.email.toLowerCase();
  const passwordHash = await bcrypt.hash(adminSeed.password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: adminSeed.name,
      passwordHash,
    },
    create: {
      name: adminSeed.name,
      email,
      passwordHash,
    },
  });

  console.log(`Admin user ready at ${email}`);
}

async function seedSystemPantryUser(ingredientMap: Map<string, string>) {
  const email = systemPantrySeedUser.email.toLowerCase();
  const passwordHash = await bcrypt.hash(systemPantrySeedUser.password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: systemPantrySeedUser.name,
      passwordHash,
    },
    create: {
      name: systemPantrySeedUser.name,
      email,
      passwordHash,
    },
  });

  for (const entry of systemPantrySeedUser.pantry) {
    const ingredientId = ingredientMap.get(entry.ingredientSlug);
    if (!ingredientId) {
      continue;
    }

    await prisma.pantryItem.upsert({
      where: {
        userId_ingredientId: {
          userId: user.id,
          ingredientId,
        },
      },
      update: {
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
      },
      create: {
        userId: user.id,
        ingredientId,
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
      },
    });
  }

  console.log(`System pantry owner ready at ${email}`);

  return user.id;
}

async function seedIngredientCatalog() {
  const map = new Map<string, string>();

  for (const ingredient of ingredientCatalog) {
    const record = await prisma.ingredient.upsert({
      where: { slug: ingredient.slug },
      update: {
        name: ingredient.name,
        defaultUnit: ingredient.defaultUnit,
        allergens: ingredient.allergens,
        tags: ingredient.tags,
      },
      create: {
        slug: ingredient.slug,
        name: ingredient.name,
        defaultUnit: ingredient.defaultUnit,
        allergens: ingredient.allergens,
        tags: ingredient.tags,
      },
    });

    map.set(ingredient.slug, record.id);
  }

  return map;
}

async function seedRecipe(recipeData: (typeof sampleRecipes)[number], ingredientMap: Map<string, string>) {
  const { inventory, ingredients, ...recipeDetails } = recipeData;

  const recipe = await prisma.recipe.upsert({
    where: { slug: recipeDetails.slug },
    update: { ...recipeDetails },
    create: recipeDetails,
  });

  for (const component of ingredients) {
    const ingredientId = ingredientMap.get(component.ingredientSlug);
    if (!ingredientId) {
      console.warn(`Missing ingredient ${component.ingredientSlug} in catalog; skipping component seed.`);
      continue;
    }

    await prisma.recipeIngredient.upsert({
      where: {
        recipeId_ingredientId: {
          recipeId: recipe.id,
          ingredientId,
        },
      },
      update: {
        quantityPerServing: new Prisma.Decimal(component.quantity),
        unitLabel: component.unitLabel,
      },
      create: {
        recipeId: recipe.id,
        ingredientId,
        quantityPerServing: new Prisma.Decimal(component.quantity),
        unitLabel: component.unitLabel,
      },
    });
  }

  await prisma.inventoryItem.upsert({
    where: { recipeId: recipe.id },
    update: {
      quantity: inventory.quantity,
      unitLabel: inventory.unitLabel,
      status: inventory.status,
    },
    create: {
      recipeId: recipe.id,
      quantity: inventory.quantity,
      unitLabel: inventory.unitLabel,
      status: inventory.status,
    },
  });
}

async function seedPantryUser(ingredientMap: Map<string, string>) {
  const email = pantryUserSeed.email.toLowerCase();
  const passwordHash = await bcrypt.hash(pantryUserSeed.password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: pantryUserSeed.name,
      passwordHash,
    },
    create: {
      name: pantryUserSeed.name,
      email,
      passwordHash,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: pantryUserSeed.profile,
    create: {
      userId: user.id,
      ...pantryUserSeed.profile,
    },
  });

  for (const entry of pantryUserSeed.pantry) {
    const ingredientId = ingredientMap.get(entry.ingredientSlug);
    if (!ingredientId) {
      continue;
    }

    await prisma.pantryItem.upsert({
      where: {
        userId_ingredientId: {
          userId: user.id,
          ingredientId,
        },
      },
      update: {
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
      },
      create: {
        userId: user.id,
        ingredientId,
        quantity: new Prisma.Decimal(entry.quantity),
        unitLabel: entry.unitLabel,
        status: entry.status,
      },
    });
  }

  console.log(`Demo pantry user ready at ${email}`);
}

async function main() {
  await seedAdmin();
  const ingredientMap = await seedIngredientCatalog();
  await seedSystemPantryUser(ingredientMap);
  await seedPantryUser(ingredientMap);

  for (const recipeData of sampleRecipes) {
    await seedRecipe(recipeData, ingredientMap);
  }
}

main()
  .then(() => {
    console.log("Seed data applied successfully ✅");
  })
  .catch((error) => {
    console.error("Seed failed ❌", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
