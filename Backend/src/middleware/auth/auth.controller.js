import { asyncHandler } from "../../utils/asyncHandler";
import { createToken } from "../../utils/token.utils";
import { setAuthCookie } from "../../utils/cookie.utils";

const saltRounds =13;

// export const signUpUser = asyncHandler(async(req,res)=>{
//     const {username,email,password} = req.body;

//     if(!username || !email || !password){
//       return res.status(400).json({
//          message:"All fields required"
//       });
//    }

//    const normalizedEmail = email.toLowerCase();
//    const passwordRegex =
//       /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

//       if(!passwordRegex.test(password)){
//        return res.status(400).json({
//             error:"Password must be 6-50 chars long and include uppercase, lowercase, number, and special char",
//         })
//       }

//    const hashedPassword = await bcrypt.hash(password,saltrounds);

//    const result = await pool.query(
//       "INSERT INTO user (username,email,password) values ($1,$2,$3) RETURNING",[username,normalizedEmail,hashedPassword]
//    );

//    const user = result.rows[0];
//    delete user.password;

//    const token = createToken(res,user);

//    res.status(201).json({ message: "User created & authenticated", user, token });

// })

export const signUpUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      message: "All fields required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must be 6-50 chars long and include uppercase, lowercase, number, and special char",
    });
  }

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING user_id, username, email",
      [username.trim(), normalizedEmail, hashedPassword]
    );

    const user = result.rows[0];

    const token = createToken(res, user);
    setAuthCookie(res, token);
    res.status(201).json({
      message: "User created & authenticated",
      user
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(400).json({
        message: "Email or Username already exists",
      });
    }

    res.status(500).json({
      message: "Something went wrong",
    });
  }
});