// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  // Organiser and ballot state live in signed cookies, so no KV-backed sessions.
  session: false,
  // The toolbar covers the fixed Vote button on phones.
  devToolbar: { enabled: false },
  adapter: cloudflare({ imageService: "passthrough" }),
});
