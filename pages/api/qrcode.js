const QRCode = require("qrcode");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const EXPIRE_TIME = process.env.EXPIRE_TIME || 1000 * 60;

export default async (req, res) => {
  const { host } = req.query;

  const timestamp = Date.now();
  const token = jwt.sign({ expires: timestamp + EXPIRE_TIME }, JWT_SECRET);
  const code = await QRCode.toDataURL(`http://${host}/vote/${token}`);

  res.status(200).send(code);
};
