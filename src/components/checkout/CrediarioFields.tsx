"use client";

import { installmentOptions, maskValidity, onlyDigits, type CrediarioConfig } from "@/lib/crediario";

export type CrediarioValue = { protocol: string; validity: string; cpfLast3: string; installments: number };
export const EMPTY_CREDIARIO: CrediarioValue = { protocol: "", validity: "", cpfLast3: "", installments: 1 };

const SHOPEE = "#EE4D2D";

/**
 * Campos do CREDIÁRIO (protocolo — não é cartão). Todos os títulos, placeholders,
 * dígitos, formato da validade e textos vêm do admin. Visual Shopee (laranja #EE4D2D).
 * Usado no checkout e na prévia em Admin → Crediário.
 */
export function CrediarioFields({
  cfg,
  totalCents,
  value,
  onChange,
  errors = {},
  preview = false,
}: {
  cfg: CrediarioConfig;
  totalCents: number;
  value: CrediarioValue;
  onChange: (v: CrediarioValue, field: keyof CrediarioValue) => void;
  errors?: Record<string, string>;
  preview?: boolean;
}) {
  const opts = installmentOptions(totalCents, cfg);
  const set = (k: keyof CrediarioValue, v: string | number) => onChange({ ...value, [k]: v }, k);
  const inputCls =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#EE4D2D]";
  const err = (k: string) => errors[k] && <p className="mt-1 text-[11px] text-red-500">{errors[k]}</p>;

  return (
    <div className="space-y-4">
      {cfg.description && <p className="text-xs text-neutral-500">{cfg.description}</p>}

      <div>
        <label htmlFor="cred-protocol" className="mb-1 block text-xs font-medium text-neutral-600">{cfg.protocolLabel}</label>
        <input
          id="cred-protocol"
          value={value.protocol}
          onChange={(e) => set("protocol", onlyDigits(e.target.value).slice(0, cfg.protocolDigits))}
          inputMode="numeric"
          autoComplete="off"
          placeholder={cfg.protocolPlaceholder}
          className={`${inputCls} tabular-nums tracking-wider`}
          readOnly={preview}
        />
        <p className="mt-1 flex justify-between gap-2 text-[11px] text-neutral-400">
          <span>{cfg.protocolHelp}</span>
          <span className="tabular-nums">{value.protocol.length}/{cfg.protocolDigits}</span>
        </p>
        {err("protocol")}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cred-validity" className="mb-1 block text-xs font-medium text-neutral-600">{cfg.validityLabel}</label>
          <input
            id="cred-validity"
            value={value.validity}
            onChange={(e) => set("validity", maskValidity(e.target.value, cfg.validityFormat))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={cfg.validityFormat.length}
            placeholder={cfg.validityPlaceholder}
            className={`${inputCls} tabular-nums`}
            readOnly={preview}
          />
          {err("validity")}
        </div>
        <div>
          <label htmlFor="cred-cpf" className="mb-1 block text-xs font-medium text-neutral-600">{cfg.cpfLabel}</label>
          <input
            id="cred-cpf"
            value={value.cpfLast3}
            onChange={(e) => set("cpfLast3", onlyDigits(e.target.value).slice(0, cfg.cpfDigits))}
            inputMode="numeric"
            autoComplete="off"
            placeholder={cfg.cpfPlaceholder}
            className={`${inputCls} tabular-nums`}
            readOnly={preview}
          />
          {err("cpfLast3")}
        </div>
      </div>

      <fieldset>
        <legend className="mb-1 text-xs font-medium text-neutral-600">{cfg.installmentsLabel}</legend>
        {cfg.installmentsDescription && <p className="mb-2 text-[11px] text-neutral-400">{cfg.installmentsDescription}</p>}
        <div className="grid gap-2">
          {opts.map((o) => (
            <label
              key={o.n}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-4 ${
                value.installments === o.n ? "border-[#EE4D2D] bg-[#fff6f4]" : "border-neutral-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="cred-installments"
                checked={value.installments === o.n}
                onChange={() => set("installments", o.n)}
                className="h-4 w-4"
                style={{ accentColor: SHOPEE }}
              />
              <span className="text-sm font-medium text-neutral-800">{o.label}</span>
            </label>
          ))}
        </div>
        {err("installments")}
      </fieldset>

      {cfg.helpText && <p className="text-xs text-neutral-500">{cfg.helpText}</p>}
      {cfg.infoMessage && <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">{cfg.infoMessage}</p>}
      {cfg.securityText && (
        <p className="flex items-start gap-2 text-[11px] text-neutral-400">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-[#EE4D2D]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M6 10.5h12v10H6zM8.5 10.5V7.5a3.5 3.5 0 017 0v3" />
          </svg>
          {cfg.securityText}
        </p>
      )}
    </div>
  );
}
