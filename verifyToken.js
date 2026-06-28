const { jwtVerify, createRemoteJWKSet } = require("jose");

/**
 * .env-এ AUTH_APP_URL বসাও — যেখানে Next.js app চলছে:
 *   dev:  AUTH_APP_URL=http://localhost:3000
 *   prod: AUTH_APP_URL=https://তোমার-deployed-client-url.vercel.app
 */
const JWKS = createRemoteJWKSet(new URL(`${process.env.AUTH_APP_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.AUTH_APP_URL,
      audience: process.env.AUTH_APP_URL,
    });
    req.decoded = payload; // { id, email, role, iat, exp, iss, aud, sub }
    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

module.exports = verifyToken;