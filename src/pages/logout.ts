import type { APIRoute } from "astro";
import { ORGANISER_COOKIE } from "../lib/organiser";

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(ORGANISER_COOKIE, { path: "/" });
  return redirect("/", 303);
};
