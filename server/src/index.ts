import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClient } from "redis";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Redis
const redisClient = createClient({
  url: process.env.REDIS_URL,
});
redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis connection error:", err));

app.get("/", (req, res) => {
  res.send("Dota 2 Tracker Backend");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
