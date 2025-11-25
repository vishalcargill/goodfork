import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { generateRecipeEmbeddings } from "../src/services/server/recipe-embeddings.server";

async function main() {
  const limitArg = process.argv[2] ? Number(process.argv[2]) : undefined;
  const result = await generateRecipeEmbeddings({ limit: limitArg });
  console.log(
    `Embedding sync completed. Attempted: ${result.attempted}, Upserted: ${result.upserted}`
  );
}

main()
  .catch((error) => {
    console.error("Embedding sync failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
