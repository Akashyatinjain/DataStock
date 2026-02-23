import { createUser,findUserByEmail }   from "./auth.repository.js";
import { hashPassword,comparePassword } from "./providers/passwordAuth.js";
import { createToken } from "../../utils/token.utils.js";
import { setAuthCookie } from "../../utils/cookie.utils.js";

export const signUpUserLocal = async ({username,email,password},res) =>{
    if (!username || !email) {
    return res.status(400).json({
      message: "Username and email are required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existUser = await findUserByEmail(normalizedEmail);
  if(existUser){
    throw new Error("Email already exists");
  }

  const hashedPassword = await hashPassword(password);
  const user = await createUser({
    username: username.trim(),
    email:normalizedEmail,
    password:hashedPassword,
    authProvider: "local"
  });

  const token = createToken(user);
  setAuthCookie(res, token);

   return {
    message: "User created & authenticated",
    user
  };
}



export const signInUserLocal = async ({ email, password }, res) => {

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw new Error("Invalid credentials");

  if (user.authProvider !== "local") {
    throw new Error("Use original login method");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const token = createToken(user);
  setAuthCookie(res, token);

  const { password: _, ...safeUser } = user;

  return {
    message: "Signed in successfully",
    user: safeUser
  };
};



export const googleLogin = async (googleUser) => {

  const { email, name, googleId } = googleUser;

  // 1️⃣ Check if user already exists by email
  let user = await authRepo.findUserByEmail(email);

  if (user) {

    // If user exists but signed up via password
    if (user.authProvider !== "google") {
      throw new Error("Account already exists with different login method");
    }

    return user;
  }

  // 2️⃣ Create new Google user
  user = await authRepo.createGoogleUser({
    email,
    username: name,
    googleId
  });

  return user;
};