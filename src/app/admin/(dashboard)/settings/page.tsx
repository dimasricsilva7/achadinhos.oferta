import { getSettings } from "@/lib/settings-service";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const [settings, products] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, status: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-foreground">Configurações</h1>
      <SettingsForm initial={settings} availableProducts={products} />
    </div>
  );
}
