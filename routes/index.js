import express from "express";

var indexRouter = express.Router();

indexRouter.get("/", (req, res) => {
  res.send("Anyone can read this!");
});

export default indexRouter;
