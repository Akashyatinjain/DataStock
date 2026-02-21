// import { asyncHandler } from "../../utils/asyncHandler";
// import { createToken } from "../../utils/token.utils";
// import { setAuthCookie } from "../../utils/cookie.utils";

// const saltRounds =13;

// // export const signUpUser = asyncHandler(async(req,res)=>{
// //     const {username,email,password} = req.body;

// //     if(!username || !email || !password){
// //       return res.status(400).json({
// //          message:"All fields required"
// //       });
// //    }

// //    const normalizedEmail = email.toLowerCase();
// //    const passwordRegex =
// //       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

// //       if(!passwordRegex.test(password)){
// //        return res.status(400).json({
// //             error:"Password must be 6-50 chars long and include uppercase, lowercase, number, and special char",
// //         })
// //       }

// //    const hashedPassword = await bcrypt.hash(password,saltrounds);

// //    const result = await pool.query(
// //       "INSERT INTO user (username,email,password) values ($1,$2,$3) RETURNING",[username,normalizedEmail,hashedPassword]
// //    );

// //    const user = result.rows[0];
// //    delete user.password;

// //    const token = createToken(res,user);

// //    res.status(201).json({ message: "User created & authenticated", user, token });

// // })

// export const signUpUser = asyncHandler(async (req, res) => {

//   const { username, email, password, authProvider = "local" } = req.body;

//   if (!username || !email) {
//     return res.status(400).json({ message: "Required fields missing" });
//   }

//   const normalizedEmail = email.toLowerCase().trim();

//   let hashedPassword = null;

//   if (authProvider === "local") {

//     if (!password) {
//       return res.status(400).json({ message: "Password required" });
//     }

//     const passwordRegex =
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

//     if (!passwordRegex.test(password)) {
//       return res.status(400).json({
//         message: "Weak password",
//       });
//     }

//     hashedPassword = await bcrypt.hash(password, saltRounds);
//   }

//   try {

//     const result = await pool.query(
//       "INSERT INTO User (username, email, password, auth_provider) VALUES ($1,$2,$3,$4) RETURNING user_id, username, email",
//       [username.trim(), normalizedEmail, hashedPassword, authProvider]
//     );

//     const user = result.rows[0];

//     const token = createToken(user);
//     setAuthCookie(res, token);

//     res.status(201).json({
//       message: "User created & authenticated",
//       user,
//     });

//   } catch (error) {

//     if (error.code === "23505") {
//       return res.status(400).json({
//         message: "Email or Username already exists",
//       });
//     }

//     res.status(500).json({ message: "Something went wrong" });
//   }

// });

// // export const signInUser=asyncHandler(async(req,res)=>{
// //    try{
// //    const {email,password} = req.body;
// //     if (!email || !password)
// //       return res.status(400).json({ error: "All fields are required" });

// //     const userQuery = await pool.query(
// //       "select * from User where email = $1 returning",[email]
// //     );

// //     if(userQuery.rows.length ==0){
// //       return res.status(400).json({
// //          message:"User does not exists"
// //       });
// //     }

// //     const user = userQuery.rows[0];

// //     if(user.auth_provider !== "local" ){
// //       return res.status(404).json({
// //          message:"This is accountis alredy registerd with with google or OTP try to sign in with that"
// //       });
// //     }

// //     const match = await bcrypt.compare(password,user.rows.hashedPassword);
// //     if(!match){
// //       return res.status(400).json({
// //          message:"password in valid please retry"
// //       });
// //     }
// //    const token = createToken(user);
// //    setAuthCookie(res, token);

// //    const safeUser = { ...user };
// //    delete safeUser.hashedPassword;
// //    res.status(201).json({
// //       message: "Signed in Successfully",
// //       safeUser,
// //     });
// //    }catch (err) {
// //     console.error("Signin error:", err);
// //     res.status(500).json({ error: err.message || "Something went wrong" });
// //   }
// // });


// export const signInUser = asyncHandler(async (req, res) => {

//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({
//       message: "All fields are required"
//     });
//   }

//   const result = await pool.query(
//     "SELECT user_id, username, email, password_hash, auth_provider FROM User WHERE email = $1",
//     [email.toLowerCase().trim()]
//   );

//   if (!result.rows.length) {
//     return res.status(400).json({
//       message: "Invalid credentials"
//     });
//   }

//   const user = result.rows[0];

//   // block non-local login
//   if (user.auth_provider !== "local") {
//     return res.status(400).json({
//       message: "Invalid credentials"
//     });
//   }

//   const match = await bcrypt.compare(password, user.password);

//   if (!match) {
//     return res.status(400).json({
//       message: "Invalid credentials"
//     });
//   }

//   const token = createToken(user);
//   setAuthCookie(res, token);

//   delete user.password_hash;

//   res.status(200).json({
//     message: "Signed in successfully",
//     user,
//   });

// });



import bcrypt from "bcrypt";
import  asyncHandler  from "../../utils/asyncHandler.js";
import { createToken } from "../../utils/token.utils.js";
import { setAuthCookie } from "../../utils/cookie.utils.js";
import pool from "../../config/db.js";

const saltRounds = 13;

/* ===========================
   SIGN UP
=========================== */

export const signUpUser = asyncHandler(async (req, res) => {

  const { username, email, password, authProvider = "local" } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      message: "Username and email are required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  let hashedPassword = null;

  // Only hash password for local users
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
    const result = await pool.query(
      `INSERT INTO "User" (username, email, password, "authProvider")
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email`,
      [username.trim(), normalizedEmail, hashedPassword, authProvider]
    );

    const user = result.rows[0];

    const token = createToken(user);
    setAuthCookie(res, token);

    res.status(201).json({
      message: "User created & authenticated",
      user,
    });

  } catch (error) {

    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    res.status(500).json({
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

  const result = await pool.query(
    `SELECT id, username, email, password, "authProvider"
     FROM "User"
     WHERE email = $1`,
    [normalizedEmail]
  );

  if (!result.rows.length) {
    return res.status(400).json({
      message: "Invalid credentials",
    });
  }

  const user = result.rows[0];

  // Block non-local login attempts
  if (user.authProvider !== "local") {
    return res.status(400).json({
      message: "Please login using your original authentication method",
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

  delete user.password;

  res.status(200).json({
    message: "Signed in successfully",
    user,
  });

});

