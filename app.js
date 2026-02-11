import express from "express";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";

import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/users", usersRouter);
app.use("/", authRouter);

export default app;
