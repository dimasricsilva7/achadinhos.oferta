import { getSettings } from "@/lib/settings-service";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div>
      <h1 className="mb-6 text-lg font-bold text-foreground">Configurações</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
