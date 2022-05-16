import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EXPIRE_TIME = 10 * 1000 //process.env.EXPIRE_TIME || 1000 * 60 * 2;

export async function generateQRCode(host) {
  const timestamp = Date.now();
  const token = jwt.sign({ expires: timestamp + EXPIRE_TIME }, JWT_SECRET);
  const code = await QRCode.toDataURL(`http://${host}/vote/${token}`);

  return { code, token };
}

export function checkCode(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.expires < Date.now()) {
      return { error: "expired" };
    }
  } catch (err) {
    return { error: "invalid" };
  }
  
  return { success: true };
}
