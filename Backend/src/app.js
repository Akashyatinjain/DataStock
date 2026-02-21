import express from "express"
import Helmet from "helmet"
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import  {errorHandler}  from "./middleware/errorHandler.js";
import authRoutes from "./middleware/auth/auth.routes.js"

const app = express();
const limiter = rateLimit({
    windowMs:60*1000,
    max:10
})

app.disable("x-powered-by");
app.use(Helmet());
app.use(morgan("dev"));
app.use(limiter);
app.use(express.json());

app.use("/auth", authRoutes);


app.use(errorHandler);

export default app;