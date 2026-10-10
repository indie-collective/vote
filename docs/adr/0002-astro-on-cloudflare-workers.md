# Rewrite in Astro on Cloudflare Workers + D1 instead of upgrading the Remix app

The original app (Remix v1, React 17, Chakra UI v1, Prisma on a SQLite file, served by Node) can't run on Cloudflare as-is, and every part of the stack was out of date. The app is only about three pages, so we rewrote it in Astro (server output, `@astrojs/cloudflare` adapter) with D1 for votes and settings and plain browser JavaScript instead of React. A rewrite cost about the same as a port and leaves nothing old to maintain. Phones on festival Wi-Fi also load much less JavaScript.

## Considered Options

- **Port Remix v1 to its Cloudflare adapter with D1**: rejected. It keeps the outdated React 17 and Chakra v1 code.
- **React Router v7 (Remix's successor)**: viable, but needs React for interaction the pages barely have.
- **Astro with React islands reusing the existing components**: rejected. Porting Chakra roughly doubles the work.
