import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createClient } from "redis";
import { RedisClientType } from "redis";
import RedisStore from "connect-redis";
import passport from "passport";
import session from "express-session";
import { Strategy as SteamStrategy } from "passport-steam";
import cors from "cors";
import axios from "axios";
import axiosRetry from "axios-retry";
import User from "./models/User";
import Match from "./models/Match";

// Расширение типа Session для поддержки passport
declare module "express-session" {
  interface Session {
    passport?: {
      user: string;
    };
  }
}

dotenv.config();

// Настройка axios с повторными попытками
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

interface SteamProfile {
  id: string;
  displayName: string;
  photos: { value: string }[];
  [key: string]: any;
}

const app = express();
const port = process.env.PORT || 5000;

// Redis клиент
const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis connection error:", err));

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(
  session({
    store: new RedisStore({ client: redisClient as any, prefix: "sess:" }),
    secret: process.env.SESSION_SECRET || "hBlGYtAWhM",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Логирование запросов
app.use((req, res, next) => {
  console.log(
    `Request: ${req.method} ${req.url} - Query: ${JSON.stringify(req.query)}`
  );
  next();
});

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Passport
passport.serializeUser((user: any, done) => {
  console.log("Serializing user:", user);
  done(null, user.steamId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    console.log("Deserializing ID:", id);
    const user = await User.findOne({ steamId: id });
    if (!user) {
      console.log("User not found for steamId:", id);
      return done(null, null);
    }
    console.log("Deserialized user:", user);
    done(null, user);
  } catch (err) {
    console.error("Deserialize error:", err);
    done(err, null);
  }
});

passport.use(
  new SteamStrategy(
    {
      returnURL: "http://localhost:5000/auth/steam/return",
      realm: "http://localhost:5000/",
      apiKey: process.env.STEAM_API_KEY || "",
    },
    async (
      identifier: string,
      profile: SteamProfile,
      done: (err: any, user?: any) => void
    ) => {
      console.log("Steam auth callback, profile:", profile);
      try {
        if (!profile.id) {
          throw new Error("Invalid Steam profile");
        }
        const user = await User.findOneAndUpdate(
          { steamId: profile.id },
          {
            steamId: profile.id,
            displayName: profile.displayName,
            avatar: profile.photos?.[2]?.value || "",
          },
          { upsert: true, new: true, runValidators: true }
        );
        console.log("Updated/Saved user:", user);
        return done(null, user);
      } catch (err) {
        console.error("Steam auth error:", err);
        return done(err);
      }
    }
  )
);

// Routes
app.get("/", (req, res) => res.send("Dota 2 Tracker Backend"));

app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "http://localhost:5173/" }),
  (req, res) => {
    console.log("Steam auth return, user:", req.user);
    if (!req.user) {
      console.error("No user after authentication");
      return res.status(401).json({ error: "Authentication failed" });
    }
    res.redirect("http://localhost:5173/profile");
  }
);

app.get("/auth/logout", (req, res) => {
  console.log("Logout request received, session:", req.session);
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Failed to logout" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to destroy session" });
      }
      console.log("Session destroyed");
      res.json({ message: "Logged out successfully" });
    });
  });
});

app.get("/api/user", (req, res) => {
  console.log(
    "User request - Session:",
    req.session,
    "Passport user:",
    req.session?.passport?.user,
    "Cookies:",
    req.cookies
  );
  if (req.user) {
    console.log("Returning user from req.user:", req.user);
    res.json(req.user);
  } else if (req.session?.passport?.user) {
    User.findOne({ steamId: req.session.passport.user })
      .then((user) => {
        if (user) {
          console.log("Found user by steamId from session:", user);
          req.user = user;
          res.json(user);
        } else {
          console.log("No user found for steamId:", req.session.passport.user);
          res.json(null); // Возвращаем null вместо 401
        }
      })
      .catch((err) => {
        console.error("Error finding user:", err);
        res.status(500).json({ error: "Server error" });
      });
  } else {
    console.log("No user or session data, returning null");
    res.json(null); // Возвращаем null вместо 401
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
        console.log(
          `Returning cached matches for SteamID: ${steamId}, Page: ${page}`
        );
        return res.json(JSON.parse(cached));
      }

      console.log(
        `Fetching matches from OpenDota for SteamID: ${steamId} (AccountID: ${accountId}, Page: ${page})`
      );
      const response = await axios.get(
        `https://api.opendota.com/api/players/${accountId}/matches`,
        { params: { limit: 100 }, timeout: 5000 }
      );
      const allMatches = response.data;

      if (!Array.isArray(allMatches)) {
        console.log(
          `Invalid response format for AccountID: ${accountId}`,
          allMatches
        );
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
      console.log(
        `Cached ${paginatedMatches.length} matches for SteamID: ${steamId}, Page: ${page}`
      );
      res.json(result);
    } catch (err: any) {
      console.error(`Error fetching matches for SteamID: ${steamId}`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
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
        console.log(`Returning cached match data for MatchID: ${matchId}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`Fetching match data from OpenDota for MatchID: ${matchId}`);
      const response = await axios.get(
        `https://api.opendota.com/api/matches/${matchId}`,
        { timeout: 5000 }
      );
      const match = response.data;
      if (!match.match_id) {
        console.log(`Invalid match data for MatchID: ${matchId}`);
        return res
          .status(500)
          .json({ error: "Invalid match data from OpenDota" });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(match));
      console.log(`Cached match data for MatchID: ${matchId}`);
      res.json(match);
    } catch (err: any) {
      console.error(`Error fetching match data for MatchID: ${matchId}`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
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
      console.log(`Processing query (AccountID): ${queryStr}`);
      const cacheKey = `search:${queryStr.toLowerCase()}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log(`Returning cached search for AccountID: ${queryStr}`);
        return res.json(JSON.parse(cached));
      }

      const STEAM_ID_BASE = BigInt("76561197960265728");
      let result: any = null;

      // Поиск только по AccountID
      if (/^\d+$/.test(queryStr)) {
        const accountId = queryStr;
        const steamId = String(BigInt(accountId) + STEAM_ID_BASE);
        console.log(`Searching AccountID: ${accountId}, SteamID: ${steamId}`);

        try {
          const response = await axios.get(
            `https://api.opendota.com/api/players/${accountId}`,
            { timeout: 5000 }
          );
          console.log(
            `OpenDota response status: ${response.status}, data:`,
            response.data
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
            console.log(`Saved profile to MongoDB for SteamID: ${steamId}`);
          } else {
            console.log(
              `No valid profile found in OpenDota for AccountID: ${accountId}`
            );
          }
        } catch (err: any) {
          console.error(`OpenDota error for AccountID: ${accountId}`, {
            status: err.response?.status,
            message: err.message,
            data: err.response?.data,
          });
        }
      }

      if (!result || (Array.isArray(result) && result.length === 0)) {
        console.log(`No players found for AccountID: ${queryStr}`);
        return res.status(404).json({ error: "Player not found" });
      }

      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      console.log(`Search result cached for AccountID: ${queryStr}`);
      res.json(result);
    } catch (err: any) {
      console.error("Search error:", {
        message: err.message,
        stack: err.stack,
      });
      res
        .status(500)
        .json({ error: "Failed to search player", details: err.message });
    }
  }
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
