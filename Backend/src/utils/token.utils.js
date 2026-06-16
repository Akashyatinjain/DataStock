import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const JWT_ALGORITHM = "HS256";

export const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion ?? 0,
      type: "access",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: JWT_ALGORITHM,
    }
  );
};

// Backward-compatible alias used across the codebase.
export const createToken = createAccessToken;

export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: [JWT_ALGORITHM],
  });
};
