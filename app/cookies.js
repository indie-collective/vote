import { createCookie } from "@remix-run/node";

export const stunvote = createCookie("stunvote", {
  voted: false,
  maxAge: 7 * 24 * 60 * 60,
});
