
// import bcrypt from "bcrypt";
// import  asyncHandler  from "../../utils/asyncHandler.js";
// import { createToken } from "../../utils/token.utils.js";
// import { setAuthCookie } from "../../utils/cookie.utils.js";
// import prisma from "../../config/db.js";

// const saltRounds = 13;

// /* ===========================
//    SIGN UP
// =========================== */

// export const signUpUser = asyncHandler(async (req, res) => {

//   const { username, email, password, authProvider = "local" } = req.body;

//   if (!username || !email) {
//     return res.status(400).json({
//       message: "Username and email are required",
//     });
//   }

//   const normalizedEmail = email.toLowerCase().trim();
//   let hashedPassword = null;

//   // Only hash password for local users
//   if (authProvider === "local") {

//     if (!password) {
//       return res.status(400).json({
//         message: "Password is required for local signup",
//       });
//     }

//     const passwordRegex =
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

//     if (!passwordRegex.test(password)) {
//       return res.status(400).json({
//         message: "Password is too weak",
//       });
//     }

//     hashedPassword = await bcrypt.hash(password, saltRounds);
//   }

//   try {
//     const user = await prisma.user.create({
//   data: {
//     username: username.trim(),
//     email: normalizedEmail,
//     password: hashedPassword,
//     authProvider
//   },
//   select: {
//     id: true,
//     username: true,
//     email: true
//   }
// });


//     const token = createToken(user);
//     setAuthCookie(res, token);

//     res.status(201).json({
//       message: "User created & authenticated",
//       user,
//     });

//   } catch (error) {

//     if (error.code === "P2002") {
//   return res.status(400).json({
//     message: "Email already exists",
//   });
// }

//     res.status(500).json({
//       message: "Something went wrong",
//       error
//     });
//   }

// });


// /* ===========================
//    SIGN IN
// =========================== */

// export const signInUser = asyncHandler(async (req, res) => {

//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       message: "Email and password are required",
//     });
//   }

//   const normalizedEmail = email.toLowerCase().trim();

//  const user = await prisma.user.findUnique({
//   where: { email: normalizedEmail }
// });

//   if (!user) {
//   return res.status(400).json({
//     message: "Invalid credentials",
//   });
// }

  

//   // Block non-local login attempts
//   if (user.authProvider !== "local") {
//     return res.status(400).json({
//       message: "Please login using your original authentication method",
//     });
//   }

//   const isMatch = await bcrypt.compare(password, user.password);

//   if (!isMatch) {
//     return res.status(400).json({
//       message: "Invalid credentials",
//     });
//   }

//   const token = createToken(user);
//   setAuthCookie(res, token);

//   delete user.password;

//   res.status(200).json({
//     message: "Signed in successfully",
//     user,
//   });

// });

import bcrypt from "bcrypt";
import asyncHandler from "../../utils/asyncHandler.js";
import { createToken } from "../../utils/token.utils.js";
import { setAuthCookie } from "../../utils/cookie.utils.js";
import prisma from "../../config/db.js";

const saltRounds = 13;

/* ===========================
   SIGN UP
=========================== */

export const signUpUser = asyncHandler(async (req, res) => {

  const { username, email, password, authProvider = "local" } = req.body;

  // Basic validation
  if (!username || !email) {
    return res.status(400).json({
      message: "Username and email are required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  let hashedPassword = null;

  // Password validation only for local auth
  if (authProvider === "local") {

    if (!password) {
      return res.status(400).json({
        message: "Password is required for local signup",
      });
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: "Password is too weak",
      });
    }

    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  try {

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        authProvider,
      },
      select: {
        id: true,
        username: true,
        email: true,
        authProvider: true
      }
    });

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: "User created & authenticated",
      user,
    });

  } catch (error) {

    // Prisma duplicate error
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    console.error("Signup Error:", error);

    return res.status(500).json({
      message: "Something went wrong",
    });
  }
});


/* ===========================
   SIGN IN
=========================== */

export const signInUser = asyncHandler(async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  // Block non-local login
  if (user.authProvider !== "local") {
    return res.status(400).json({
      message: "Please login using your original authentication method",
    });
  }

  // extra safety (password may be null for google/otp users)
  if (!user.password) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  const token = createToken(user);
  setAuthCookie(res, token);

  // Remove sensitive data
  const { password: _, ...safeUser } = user;

  return res.status(200).json({
    message: "Signed in successfully",
    user: safeUser,
  });
});