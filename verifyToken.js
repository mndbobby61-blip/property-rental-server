let josePromise;
function getJose() {
  if (!josePromise) {
    josePromise = import("jose");
  }
  return josePromise;
}

let JWKS;

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { jwtVerify, createRemoteJWKSet } = await getJose();

    if (!JWKS) {
      JWKS = createRemoteJWKSet(new URL(`${process.env.AUTH_APP_URL}/api/auth/jwks`));
    }

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