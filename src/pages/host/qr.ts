import type { APIRoute } from "astro";
import { app } from "../../lib/app";
import { freshQrCode } from "../../lib/qr";
import { getStatus } from "../../lib/store";

/** Polled by the Host Screen for its next QR code. */
export const GET: APIRoute = async ({ url }) => {
  const { db, key, edition } = app();
  const { votingOpen } = await getStatus(db, edition.id);
  const qr = votingOpen ? await freshQrCode(url.origin, edition.id, key) : null;
  return Response.json({ votingOpen, ...qr }, { headers: { "cache-control": "no-store" } });
};
