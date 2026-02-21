export const setAuthCookie = (res, token) => {
   res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
   });
};