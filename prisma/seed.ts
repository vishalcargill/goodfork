import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  InventoryStatus,
} from "../src/generated/prisma/client";

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

const sampleRecipes = [
  {
    slug: "citrus-herb-salmon",
    title: "Citrus Herb Salmon",
    description:
      "Omega-3 rich salmon with roasted broccolini, citrus glaze, and quinoa.",
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
    inventory: {
      quantity: 24,
      unitLabel: "plates",
      status: InventoryStatus.IN_STOCK,
    },
  },
  {
    slug: "rainbow-bowl",
    title: "Rainbow Macro Bowl",
    description:
      "Roasted veggies, farro, baby kale, pickled onions, tahini drizzle.",
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
    inventory: {
      quantity: 35,
      unitLabel: "bowls",
      status: InventoryStatus.IN_STOCK,
    },
  },
  {
    slug: "spicy-tofu-lettuce-wraps",
    title: "Spicy Tofu Lettuce Wraps",
    description:
      "Crispy chili tofu, crunchy veggies, lime vinaigrette, butter lettuce.",
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
    inventory: {
      quantity: 18,
      unitLabel: "wraps",
      status: InventoryStatus.LOW_STOCK,
    },
  },
];

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

async function main() {
  await seedAdmin();

  for (const recipeData of sampleRecipes) {
    const { inventory, ...recipeDetails } = recipeData;

    const recipe = await prisma.recipe.upsert({
      where: { slug: recipeDetails.slug },
      update: {
        title: recipeDetails.title,
        description: recipeDetails.description,
        cuisine: recipeDetails.cuisine,
        calories: recipeDetails.calories,
        proteinGrams: recipeDetails.proteinGrams,
        carbsGrams: recipeDetails.carbsGrams,
        fatGrams: recipeDetails.fatGrams,
        priceCents: recipeDetails.priceCents,
        tags: recipeDetails.tags,
        allergens: recipeDetails.allergens,
        healthyHighlights: recipeDetails.healthyHighlights,
        imageUrl: recipeDetails.imageUrl,
      },
      create: recipeDetails,
    });

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
