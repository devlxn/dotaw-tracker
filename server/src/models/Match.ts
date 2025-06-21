import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  matchId: { type: Number, required: true, unique: true },
  playerId: { type: String, required: true },
  heroId: { type: Number, required: true },
  duration: { type: Number, required: true },
  kills: { type: Number, required: true },
  deaths: { type: Number, required: true },
  assists: { type: Number, required: true },
  result: { type: String, enum: ["win", "loss"], required: true },
  playedAt: { type: Date, required: true },
});

export default mongoose.model("Match", matchSchema);
