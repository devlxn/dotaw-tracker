import { Schema, model } from "mongoose";

const userSchema = new Schema({
  steamId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default model("User", userSchema);
