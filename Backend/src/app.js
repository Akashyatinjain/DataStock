import express from "express"
import Helmet from "helmet"
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import  errorHandler  from "./middleware/errorHandler";

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

app.use(errorHandler);

export default app;