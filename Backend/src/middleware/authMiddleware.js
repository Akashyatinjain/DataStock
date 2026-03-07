import jwt from "jsonwebtoken";

export const authenticateUser = (req, res, next) => {
  try {

    let token;

    // Check cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check Authorization header
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token expired"
      });
    }

    return res.status(401).json({
      message: "Invalid token"
    });

  }
};