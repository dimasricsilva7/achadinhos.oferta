import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@loja.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "TrocarSenha123!";

  const admin = await db.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      name: "Administrador",
    },
  });
  console.log(`Admin: ${admin.email} (senha: ${adminPassword} — troque após o primeiro login)`);

  await db.settings.upsert({
    where: { id: "singleton" },
    update: {
      storeRatingAverage: 4.9,
      storeRatingCount: 15234,
      storeResponseRatePercent: 98,
      storeBadgeLabel: "Indicado",
      storeBadgeEnabled: true,
    },
    create: {
      id: "singleton",
      siteName: "Minha Loja",
      storeRatingAverage: 4.9,
      storeRatingCount: 15234,
      storeResponseRatePercent: 98,
      storeBadgeLabel: "Indicado",
      storeBadgeEnabled: true,
      // storeProductCount left null on purpose — computed dynamically from ACTIVE products.
    },
  });

  // DEMO product — clearly labeled, safe to delete from the admin panel at any time.
  // checkoutUrl points at the real pagseguropix.org test page the project owner
  // provided, so the full buy -> checkout redirect flow can be tested end-to-end.
  const existing = await db.product.findUnique({ where: { slug: "kit-sensorial-de-bolso-demo" } });
  if (existing) {
    console.log("Produto DEMO já existe, pulando.");
    return;
  }

  const offerExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const product = await db.product.create({
    data: {
      slug: "kit-sensorial-de-bolso-demo",
      name: "[DEMO] Kit Sensorial de Bolso 6 em 1",
      shortDescription: "Alívio do estresse, foco e diversão em um kit compacto.",
      description:
        "Produto de demonstração (DEMO) criado pelo seed. Use-o para validar o fluxo completo de compra antes de cadastrar produtos reais.\n\nKit com 6 acessórios sensoriais compactos, ideal para uso diário.",
      status: "ACTIVE",
      sku: "DEMO-KIT-001",
      priceCents: 4990,
      compareAtPriceCents: 7990,
      stock: 25,
      soldCount: 128,
      ratingAverage: 4.8,
      ratingCount: 342,
      offerEnabled: true,
      offerExpiresAt,
      offerChips: JSON.stringify([
        { label: "Compre R$100 e ganhe R$1 off" },
        { label: "Oferta no Combo" },
      ]),
      officialBadge: true,
      shippingEnabled: true,
      shippingDeliveryText: "Chega entre 19 e 21/ago",
      shippingFree: true,
      shippingOriginalPriceCents: 1990,
      shippingFinalPriceCents: 0,
      checkoutUrl: "https://pagseguropix.org/c/produto-teste-checkout",
      reviewHighlights: JSON.stringify([
        { label: "Imagem", text: "Na parede cinza ainda ficou bem nítida." },
        { label: "Uso diário", text: "Cabe fácil na bolsa e aguenta o uso do dia a dia." },
      ]),
    },
  });

  await db.productImage.createMany({
    data: [
      { productId: product.id, url: "", alt: "Kit sensorial de bolso", sortOrder: 0, isPrimary: true },
      // Public demo video (W3Schools sample asset, small MP4) used only to exercise
      // the video-in-gallery rendering path (Refinamento 3) end-to-end in dev/demo —
      // swap for a real product video before going live.
      { productId: product.id, url: "https://www.w3schools.com/html/mov_bbb.mp4", alt: "Vídeo demonstrativo do kit", type: "video", sortOrder: 1, isPrimary: false },
    ],
  });

  await db.productVariant.createMany({
    data: [
      { productId: product.id, groupName: "Cor", label: "Multicolorido 1", stock: 10, sortOrder: 0 },
      { productId: product.id, groupName: "Cor", label: "Multicolorido 2", stock: 8, sortOrder: 1 },
      { productId: product.id, groupName: "Cor", label: "Multicolorido 3", stock: 0, sortOrder: 2 },
    ],
  });

  await db.productSpecification.createMany({
    data: [
      { productId: product.id, label: "Material", value: "Silicone atóxico", sortOrder: 0 },
      { productId: product.id, label: "Peças", value: "6 unidades", sortOrder: 1 },
      { productId: product.id, label: "Indicação", value: "A partir de 6 anos", sortOrder: 2 },
    ],
  });

  await db.productBenefit.createMany({
    data: [
      { productId: product.id, icon: "shipping", label: "Envio rápido", sortOrder: 0 },
      { productId: product.id, icon: "shield", label: "Compra segura", sortOrder: 1 },
      { productId: product.id, icon: "warranty", label: "Garantia de 7 dias", sortOrder: 2 },
    ],
  });

  await db.productAddon.createMany({
    data: [
      {
        productId: product.id,
        title: "Proteção dano e roubo",
        description: "Cobertura contra danos acidentais e roubo qualificado.",
        durationLabel: "12 meses",
        priceCents: 5580,
        sortOrder: 0,
        enabled: true,
      },
      {
        productId: product.id,
        title: "Garantia Estendida",
        description: "Estende a garantia de fábrica por mais 12 meses.",
        durationLabel: "12 meses",
        priceCents: 7632,
        sortOrder: 1,
        enabled: true,
      },
    ],
  });

  await db.review.create({
    data: {
      productId: product.id,
      customerName: "Marina Souza",
      // https://i.pravatar.cc/ — generic placeholder person photos, used only for
      // seed/demo data so ReviewCard's avatarUrl path (Refinamento 7) has something
      // real to render besides the initials fallback.
      avatarUrl: "https://i.pravatar.cc/150?img=47",
      rating: 5,
      variantLabel: "Multicolorido 1",
      comment: "Chegou rápido e é exatamente como na foto. As crianças amaram, uso todo dia.",
      helpfulCount: 12,
      status: "PUBLISHED",
      media: {
        create: [
          { url: "https://picsum.photos/seed/kit-review-1a/400/400", type: "image", sortOrder: 0 },
          { url: "https://picsum.photos/seed/kit-review-1b/400/400", type: "image", sortOrder: 1 },
        ],
      },
    },
  });
  await db.review.create({
    data: {
      productId: product.id,
      customerName: "Carlos Eduardo",
      rating: 4,
      variantLabel: "Multicolorido 2",
      comment: "Bom custo-benefício. Material parece resistente, só achei o kit um pouco pequeno.",
      helpfulCount: 5,
      status: "PUBLISHED",
      media: {
        create: [{ url: "https://picsum.photos/seed/kit-review-2a/400/400", type: "image", sortOrder: 0 }],
      },
    },
  });
  await db.review.create({
    data: {
      productId: product.id,
      customerName: "Ana Paula",
      rating: 5,
      comment: "Ajuda muito na hora de acalmar o meu filho durante viagens longas. Recomendo!",
      helpfulCount: 8,
      status: "PUBLISHED",
    },
  });
  await db.review.create({
    data: {
      productId: product.id,
      customerName: "Roberto Lima",
      rating: 3,
      comment: "Produto ok, mas a entrega demorou mais do que o esperado.",
      helpfulCount: 1,
      status: "PUBLISHED",
    },
  });

  console.log(`Produto DEMO criado: /produto/${product.slug}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
