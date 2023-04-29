import cookie from "cookie";

export default async function isAuthorized(request) {
  const { token } = await cookie.parse(request.headers.get("Cookie") || "");

  return token === process.env.TOKEN;
}
