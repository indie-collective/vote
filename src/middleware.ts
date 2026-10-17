import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import { LOCALE_COOKIE, pickLocale } from "./lib/i18n";
import { isOrganiser, loginUrl, ORGANISER_COOKIE } from "./lib/organiser";

const ORGANISER_PATHS = ["/host", "/admin"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request } = context;

  // Ballots and organiser sessions must never travel over plain HTTP.
  if (url.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.protocol = "https:";
    return Response.redirect(url, 301);
  }

  const query = url.searchParams.get("lang");
  const locale = pickLocale({
    query,
    cookie: cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });
  if (query === locale) {
    cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 24 * 60 * 60, sameSite: "lax" });
  }
  context.locals.locale = locale;

  context.locals.organiser = await isOrganiser(cookies.get(ORGANISER_COOKIE)?.value, env.SIGNING_KEY);
  const needsOrganiser = ORGANISER_PATHS.some(
    (path) => url.pathname === path || url.pathname.startsWith(`${path}/`)
  );
  if (needsOrganiser && !context.locals.organiser) {
    return context.redirect(loginUrl(url));
  }

  return next();
});
