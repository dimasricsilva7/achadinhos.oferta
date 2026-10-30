// Configuração dos Pixels da Meta (navegador) e tokens da Conversions API (servidor).
// Dois (ou mais) pixels rodam em paralelo; cada evento é enviado aos dois com o MESMO
// event_id, então o Meta deduplica navegador x servidor POR PIXEL. Tudo vem de env,
// lido só no servidor:
//   META_PIXEL_IDS   = "1453520040067694,2298008410985632"
//   META_CAPI_TOKENS = "1453520040067694:EAAP...,2298008410985632:EAAQ..."
// (o id do pixel não é segredo; os tokens do CAPI são — por isso ficam como Sensitive.)

export function getMetaPixelIds(): string[] {
  return (process.env.META_PIXEL_IDS || "")
    .split(",")
    .map((s) => s.trim())
    // Só dígitos: o id é injetado num <script> inline, então nunca aceitar outra coisa.
    .filter((s) => /^\d+$/.test(s));
}

export type MetaCapiPair = { pixelId: string; token: string };

export function getMetaCapiPairs(): MetaCapiPair[] {
  return (process.env.META_CAPI_TOKENS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf(":");
      if (i <= 0) return null;
      const pixelId = pair.slice(0, i).trim();
      const token = pair.slice(i + 1).trim();
      return /^\d+$/.test(pixelId) && token ? { pixelId, token } : null;
    })
    .filter((p): p is MetaCapiPair => p !== null);
}
