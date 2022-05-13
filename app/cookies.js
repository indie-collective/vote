import { createCookie } from "@remix-run/node";

export const stunvote = createCookie("stunvote", {
  voted: false,
});
