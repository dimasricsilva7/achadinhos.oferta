"use client";

import { useEffect, useState } from "react";
import { crediarioConfig, VALIDITY_FORMATS } from "@/lib/crediario";
import { CrediarioFields, EMPTY_CREDIARIO, type CrediarioValue } from "@/components/checkout/CrediarioFields";

type Def = { key: string; label: string; type?: "text" | "textarea" | "number" | "check" | "format"; hint?: string };
const GROUPS: { title: string; fields: Def[] }[] = [
  {
    title: "Status e apresentação",
    fields: [
      { key: "crediario_enabled", label: "Crediário ativo no checkout", type: "check" },
      { key: "crediario_method_label", label: "Nome do método", hint: "Ex.: Crediário, Pagamento por Protocolo" },
      { key: "crediario_method_subtitle", label: "Texto abaixo do nome (opção de pagamento)", hint: "{parcelas} = máximo de parcelas" },
      { key: "crediario_section_title", label: "Título da seção" },
      { key: "crediario_description", label: "Descrição", type: "textarea" },
    ],
  },
  {
    title: "Campo do protocolo",
    fields: [
      { key: "crediario_protocol_label", label: "Título" },
      { key: "crediario_protocol_placeholder", label: "Placeholder" },
      { key: "crediario_protocol_digits", label: "Quantidade de dígitos", type: "number" },
      { key: "crediario_protocol_help", label: "Texto auxiliar" },
      { key: "crediario_protocol_error", label: "Mensagem de erro", hint: "{n} = quantidade de dígitos" },
    ],
  },
  {
    title: "Validade",
    fields: [
      { key: "crediario_validity_label", label: "Título" },
      { key: "crediario_validity_placeholder", label: "Placeholder" },
      { key: "crediario_validity_format", label: "Formato", type: "format" },
      { key: "crediario_validity_error", label: "Mensagem de erro (formato)", hint: "{formato} = formato configurado" },
      { key: "crediario_validity_expired_error", label: "Mensagem de erro (vencido)" },
      { key: "crediario_validity_reject_expired", label: "Recusar protocolo com validade vencida", type: "check" },
    ],
  },
  {
    title: "Últimos dígitos do CPF",
    fields: [
      { key: "crediario_cpf_label", label: "Título" },
      { key: "crediario_cpf_placeholder", label: "Placeholder" },
      { key: "crediario_cpf_digits", label: "Quantidade de dígitos", type: "number" },
      { key: "crediario_cpf_error", label: "Mensagem de erro", hint: "{n} = quantidade de dígitos" },
    ],
  },
  {
    title: "Parcelamento",
    fields: [
      { key: "crediario_installments_label", label: "Título" },
      { key: "crediario_installments_description", label: "Descrição" },
      { key: "crediario_max_installments", label: "Quantidade máxima de parcelas", type: "number" },
      { key: "crediario_installment_text", label: "Texto da opção", hint: "{n} = parcelas · {valor} = valor da parcela · {total} = total" },
    ],
  },
  {
    title: "Mensagens e botão",
    fields: [
      { key: "crediario_help_text", label: "Texto auxiliar", type: "textarea" },
      { key: "crediario_info_message", label: "Mensagem de informação" },
      { key: "crediario_error_message", label: "Mensagem de erro geral" },
      { key: "crediario_success_title", label: "Título de sucesso" },
      { key: "crediario_success_message", label: "Mensagem de sucesso", type: "textarea" },
      { key: "crediario_button_label", label: "Texto do botão" },
      { key: "crediario_security_text", label: "Texto de segurança", type: "textarea" },
    ],
  },
];

const SAMPLE_TOTAL = 9990;
const inputCls = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-brand";

export default function AdminCrediarioPage() {
  const [s, setS] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<CrediarioValue>(EMPTY_CREDIARIO);

  useEffect(() => {
    fetch("/api/admin/crediario")
      .then((r) => r.json())
      .then(setS)
      .catch(() => setS({}));
  }, []);

  if (!s) return <p className="text-sm text-foreground/50">Carregando…</p>;

  const cfg = crediarioConfig(s);
  const set = (k: string, v: string) => {
    setS((p) => ({ ...(p ?? {}), [k]: v }));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/crediario", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      if (res.ok) {
        setS(await res.json());
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-lg font-bold text-foreground">Crediário (pagamento)</h1>
      <p className="mb-4 max-w-2xl text-xs text-foreground/50">
        Método próprio por protocolo (não é cartão, não cobra nada na hora — o pedido fica registrado para você analisar).
        Ligue/desligue e edite todos os textos aqui. As mudanças valem no checkout na hora, sem deploy.
      </p>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {GROUPS.map((g) => (
            <section key={g.title} className="rounded-xl border border-border bg-surface">
              <header className="border-b border-border px-4 py-3"><h2 className="text-sm font-semibold text-foreground">{g.title}</h2></header>
              <div className="grid gap-4 p-4 md:grid-cols-2">
                {g.fields.map((f) =>
                  f.type === "check" ? (
                    <label key={f.key} className="flex items-center gap-2 text-sm font-medium text-foreground md:col-span-2">
                      <input type="checkbox" checked={s[f.key] === "true"} onChange={(e) => set(f.key, String(e.target.checked))} className="h-4 w-4" />
                      {f.label}
                    </label>
                  ) : (
                    <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
                      <label className="mb-1 block text-xs font-medium text-foreground/60" htmlFor={f.key}>{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea id={f.key} rows={2} value={s[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
                      ) : f.type === "format" ? (
                        <select id={f.key} value={s[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls}>
                          {VALIDITY_FORMATS.map((v) => <option key={v}>{v}</option>)}
                        </select>
                      ) : (
                        <input id={f.key} type={f.type === "number" ? "number" : "text"} value={s[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} className={inputCls} />
                      )}
                      {f.hint && <p className="mt-1 text-[11px] text-foreground/40">{f.hint}</p>}
                    </div>
                  )
                )}
              </div>
            </section>
          ))}

          <div className="sticky bottom-0 flex items-center gap-3 border-t border-border bg-background/95 py-3 backdrop-blur">
            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Salvando…" : "Salvar crediário"}
            </button>
            {saved && <span className="text-xs font-medium text-success">Salvo! Já vale no checkout.</span>}
          </div>
        </div>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/50">Prévia no checkout (total de exemplo {(SAMPLE_TOTAL / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</p>
          <div className="rounded-2xl border border-border bg-[#f5f5f5] p-4">
            {!cfg.enabled && <p className="mb-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">Crediário desativado — não aparece no checkout.</p>}
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-[#EE4D2D] bg-[#fff6f4] p-3">
                <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-[#EE4D2D]"><span className="h-2.5 w-2.5 rounded-full bg-[#EE4D2D]" /></span>
                <span>
                  <span className="block text-sm font-bold text-neutral-800">{cfg.methodLabel}</span>
                  {cfg.methodSubtitle && <span className="block text-xs text-neutral-500">{cfg.methodSubtitle}</span>}
                </span>
              </div>
              <CrediarioFields cfg={cfg} totalCents={SAMPLE_TOTAL} value={preview} onChange={(v) => setPreview(v)} />
              <button type="button" className="mt-4 w-full rounded-lg bg-[#EE4D2D] py-2.5 text-sm font-semibold text-white">{cfg.buttonLabel}</button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-foreground/40">A prévia é interativa (digite para testar a máscara). Nada é enviado.</p>
        </aside>
      </div>
    </div>
  );
}
