import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EXPIRE_TIME = process.env.EXPIRE_TIME || 1000 * 60 * 2;

export async function generateQRCode(host) {
  const timestamp = Date.now();
  const token = jwt.sign({ expires: timestamp + EXPIRE_TIME }, JWT_SECRET);
  const code = await QRCode.toString(`http://${host}/vote/${token}`, {
    type: "svg",
    color: {
      dark: "#000000ff",
      light: "#ffffff00",
    },
    margin: 0,
  });

  return { code, token };
}

export function checkCode(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.expires < Date.now()) {
      return { error: "expired" };
    }

    return { success: true, expiresIn: payload.expires };
  } catch (err) {
    return { error: "invalid" };
  }
}
