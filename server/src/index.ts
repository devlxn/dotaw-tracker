import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import cors from "cors";
import axios from "axios";
import axiosRetry from "axios-retry";
import { createClient, RedisClientType } from "redis";
import connectRedis from "connect-redis"; // Импортируем как функцию
import session, { SessionOptions } from "express-session"; // Импортируем SessionOptions

import User from "./models/User";
import Match from "./models/Match";

dotenv.config();

/** Расширяем типы express-session для passport */
declare module "express-session" {
  interface SessionData {
    passport?: { user: string };
  }
}

/** Расширяем тип пользователя */
declare global {
  namespace Express {
    interface User {
      steamId: string;
      displayName?: string;
      avatar?: string | null;
    }
  }
}

/** Настройка axios с повторными попытками */
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) =>
    axiosRetry.isNetworkError(error) ||
    axiosRetry.isIdempotentRequestError(error) ||
    error.response?.status === 429,
});

interface SteamProfile {
  id: string;
  displayName: string;
  photos: { value: string }[];
  [key: string]: any;
}

const app = express();
const port = Number(process.env.PORT) || 5000;
app.set("trust proxy", 1); // за прокси (Railway/Nginx)

/** Redis client */
const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis connection error:", err));

/** CORS */
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

/** Сессии (connect-redis v7) */
const RedisStoreConstructor = connectRedis(session); // Получаем конструктор
const sessionStore = new RedisStoreConstructor({
  client: redisClient,
  prefix: "sess:",
}); // Создаем экземпляр

// Используем тип SessionOptions
const sessionOptions: SessionOptions = {
  store: sessionStore, // Используем созданный экземпляр
  secret: process.env.SESSION_SECRET || "hBlGYtAWhM",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
};
app.use(session(sessionOptions));

/** Passport */
app.use(passport.initialize());
app.use(passport.session());

/** MongoDB */
mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

passport.serializeUser((user: any, done) => {
  done(null, user.steamId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findOne({ steamId: id });
    done(null, user || null);
  } catch (err) {
    done(err, null);
  }
});

/** Steam OpenID */
const serverUrl = (
  process.env.SERVER_URL || `http://localhost:${port}`
).replace(/\/$/, "");

passport.use(
  new SteamStrategy(
    {
      returnURL: `${serverUrl}/auth/steam/return`,
      realm: `${serverUrl}/`,
      apiKey: process.env.STEAM_API_KEY || "",
    },
    async (
      _identifier: string,
      profile: SteamProfile,
      done: (err: any, user?: any) => void
    ) => {
      try {
        if (!profile.id) throw new Error("Invalid Steam profile");
        const user = await User.findOneAndUpdate(
          { steamId: profile.id },
          {
            steamId: profile.id,
            displayName: profile.displayName,
            avatar: profile.photos?.[2]?.value || "",
          },
          { upsert: true, new: true, runValidators: true }
        );
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/** Routes */
app.get("/", (_req, res) => res.send("Dota 2 Tracker Backend"));

app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: `${CLIENT_URL}/` }),
  (_req, res) => res.redirect(`${CLIENT_URL}/profile`)
);

app.get("/auth/logout", (req, res) => {
  (req as any).logout((err: any) => {
    if (err) return res.status(500).json({ error: "Failed to logout" });
    req.session.destroy((err) => {
      if (err)
        return res.status(500).json({ error: "Failed to destroy session" });
      res.json({ message: "Logged out successfully" });
    });
  });
});

app.get("/api/user", (req, res) => {
  if (req.user) return res.json(req.user);
  const steamId = req.session?.passport?.user;
  if (steamId) {
    User.findOne({ steamId })
      .then((user) => res.json(user || null))
      .catch(() => res.status(500).json({ error: "Server error" }));
  } else {
    res.json(null);
  }
});

app.get(
  "/api/matches/:steamId",
  async (
    req: express.Request<
      { steamId: string },
      {},
      {},
      { page?: string; limit?: string }
    >,
    res
  ) => {
    const steamId = req.params.steamId;
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");
    const skip = (page - 1) * limit;

    try {
      if (!/^\d{17}$/.test(steamId)) {
        return res.status(400).json({ error: "Invalid SteamID format" });
      }

      const STEAM_ID_BASE = BigInt("76561197960265728");
      const accountId = String(BigInt(steamId) - STEAM_ID_BASE);
      const cacheKey = `matches:${steamId}:page:${page}:limit:${limit}`;

      const cached = await redisClient.get(cacheKey);
      if (cached !== null) {
        return res.json(JSON.parse(cached));
      }

      const response = await axios.get(
        `https://api.opendota.com/api/players/${accountId}/matches`,
        { params: { limit: 100 }, timeout: 5000 }
      );
      const allMatches = response.data;

      if (!Array.isArray(allMatches)) {
        return res
          .status(500)
          .json({ error: "Invalid response format from OpenDota" });
      }

      for (const match of allMatches) {
        await Match.findOneAndUpdate(
          { matchId: match.match_id },
          {
            matchId: match.match_id,
            playerId: steamId,
            heroId: match.hero_id,
            duration: match.duration,
            kills: match.kills,
            deaths: match.deaths,
            assists: match.assists,
            result:
              (match.radiant_win && match.player_slot < 128) ||
              (!match.radiant_win && match.player_slot >= 128)
                ? "win"
                : "loss",
            playedAt: new Date(match.start_time * 1000),
          },
          { upsert: true }
        );
      }

      const totalMatches = allMatches.length;
      const totalPages = Math.ceil(totalMatches / limit);
      const paginatedMatches = allMatches.slice(skip, skip + limit);

      const result = {
        matches: paginatedMatches,
        totalPages,
        currentPage: page,
        totalMatches,
      };

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      res.json(result);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch matches", details: err.message });
    }
  }
);

app.get(
  "/api/match/:matchId",
  async (req: express.Request<{ matchId: string }>, res) => {
    const { matchId } = req.params;
    try {
      if (!/^\d+$/.test(matchId)) {
        return res.status(400).json({ error: "Invalid Match ID format" });
      }
      const cacheKey = `match:${matchId}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const response = await axios.get(
        `https://api.opendota.com/api/matches/${matchId}`,
        { timeout: 5000 }
      );
      const match = response.data;
      if (!match.match_id) {
        return res
          .status(500)
          .json({ error: "Invalid match data from OpenDota" });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(match));
      res.json(match);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: "Failed to fetch match data", details: err.message });
    }
  }
);

app.get(
  "/api/search",
  async (req: express.Request<{}, {}, {}, { query: string }>, res) => {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    try {
      const queryStr = String(query).trim();
      const cacheKey = `search:${queryStr.toLowerCase()}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const STEAM_ID_BASE = BigInt("76561197960265728");
      let result: any = null;

      if (/^\d+$/.test(queryStr)) {
        const accountId = queryStr;
        const steamId = String(BigInt(accountId) + STEAM_ID_BASE);

        try {
          const response = await axios.get(
            `https://api.opendota.com/api/players/${accountId}`,
            { timeout: 5000 }
          );
          if (response.data && response.data.profile) {
            result = [
              {
                steamId,
                displayName:
                  response.data.profile.personaname || `Player ${accountId}`,
                avatar: response.data.profile.avatar || null,
              },
            ];
            await User.updateOne(
              { steamId },
              {
                steamId,
                displayName:
                  response.data.profile.personaname || `Player ${accountId}`,
                avatar: response.data.profile.avatar || null,
              },
              { upsert: true }
            );
          }
        } catch (err) {
          // глушим 404 и сетевые проблемы
        }
      }

      if (!result || (Array.isArray(result) && result.length === 0)) {
        return res.status(404).json({ error: "Player not found" });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      res.json(result);
    } catch (err: any) {
      res
        .status(500)
        .json({ error: "Failed to search player", details: err.message });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running on ${serverUrl}`);
});
