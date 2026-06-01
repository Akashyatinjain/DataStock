// import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";

// passport.use(
//     new GoogleStrategy(
//         {
//             clientID:process.env.GOOGLE_CLIENT_ID,
//             clientSecret:process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: "http://localhost:5000/api/auth/google/callback",
//         },
//         res.redirect("http://localhost:5173/dashboard");
//         async (accessTokern,refreshToken,profile,done)=>{
//             const email =
//   profile.emails && profile.emails.length > 0
//     ? profile.emails[0].value
//     : null;
//             try{
//                 const userData ={
//                     googleId : profile.id,
//                     name:profile.displayName,
//                     email:email,
//                 }
//                 return done(null, userData);
//             }
//             catch (error) {
//                 return done(error, null);
//             }
//         }
//     )
// );
// export default passport;

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

const backendUrl = (process.env.BACKEND_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${backendUrl}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      const email =
        profile.emails && profile.emails.length > 0
          ? profile.emails[0].value
          : null;

      try {
        const userData = {
          googleId: profile.id,
          name: profile.displayName,
          email: email,
        };

        return done(null, userData);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;