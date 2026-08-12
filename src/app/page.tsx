import Link from "next/link";
import { db } from "@/lib/db";
import { formatCentsBRL } from "@/lib/money";

export default async function HomePage() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { images: { where: { isPrimary: true }, take: 1 } },
  });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">Produtos</h1>

      {products.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Nenhum produto publicado ainda. Acesse{" "}
          <Link href="/admin" className="text-brand underline">
            /admin
          </Link>{" "}
          para cadastrar o primeiro.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => {
            const image = p.images[0]?.url;
            return (
              <Link
                key={p.id}
                href={`/produto/${p.slug}`}
                className="group overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
              >
                <div className="aspect-square bg-neutral-100">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="p-2">
                  <p className="line-clamp-2 text-xs text-foreground/80">{p.name}</p>
                  <p className="mt-1 text-sm font-bold text-price">{formatCentsBRL(p.priceCents)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
