import express from "express"
import Helmet from "helmet"
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import  {errorHandler}  from "./middleware/errorHandler.js";
import authRoutes from "./modules/auth/auth.routes.js"
import  session  from "express-session";
import passport from "./modules/auth/providers/googleAuth.js";
import cookieParser from "cookie-parser";
import userRoutes from "./modules/user/user.routes.js";
import listEndpoints from "express-list-endpoints";

const app = express();
const limiter = rateLimit({
    windowMs:60*1000,
    max:100
})

app.disable("x-powered-by");
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(Helmet());
app.use(morgan("dev"));
app.use(limiter);
app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use(errorHandler);

console.log(listEndpoints(app));
export default app;