import QRCode from "qrcode";
import { issueQrToken } from "./voting";

/** A fresh QR code (inline SVG) pointing at /vote/<token> on this site. */
export async function freshQrCode(origin: string, edition: string, key: string) {
  const url = `${origin}/vote/${await issueQrToken(edition, key)}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    color: { dark: "#000000ff", light: "#ffffff00" },
  });
  return { url, svg };
}
