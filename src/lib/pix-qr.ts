import "server-only";
import QRCode from "qrcode";

// Gera o QR Code (data URL PNG) a partir do "copia e cola" do Pix — o próprio código
// copia-e-cola é o payload EMV, então o QR gerado a partir dele é um Pix válido. Isso
// evita depender de o gateway devolver uma imagem pronta. Falha silenciosa: sem QR, a
// tela de pagamento ainda mostra o copia-e-cola.
export async function pixQrDataUrl(copyPaste: string | null | undefined): Promise<string | null> {
  if (!copyPaste) return null;
  try {
    return await QRCode.toDataURL(copyPaste, { errorCorrectionLevel: "M", margin: 1, width: 320 });
  } catch {
    return null;
  }
}
