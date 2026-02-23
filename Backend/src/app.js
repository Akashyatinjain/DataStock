import express from "express"
import Helmet from "helmet"
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import  {errorHandler}  from "./middleware/errorHandler.js";
import authRoutes from "./middleware/auth/auth.routes.js"
import  session  from "express-session";
import passport from "./middleware/auth/providers/googleAuth.js";
const app = express();
const limiter = rateLimit({
    windowMs:60*1000,
    max:10
})

app.disable("x-powered-by");
app.use(
  session({
    secret: "secretkey",
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

app.use("/api/auth", authRoutes);


app.use(errorHandler);

export default app;