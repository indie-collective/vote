import QRCode from "qrcode";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EXPIRE_TIME = process.env.EXPIRE_TIME || 1000 * 60 * 2;

export default async function (host) {
  const timestamp = Date.now();
  const token = jwt.sign({ expires: timestamp + EXPIRE_TIME }, JWT_SECRET);
  const code = await QRCode.toDataURL(`http://${host}/vote/${token}`);

  return { code, token };
}
