import { useEffect, useState } from "react";
import axios from "axios";

interface UserProfile {
  steamId: string;
  displayName: string;
  avatar: string;
  rankTier?: number;
}

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("https://dotaw-tracker-production.up.railway.app/api/user", {
        withCredentials: true,
      })
      .then((res) => {
        const currentUser = res.data;
        if (currentUser && currentUser.steamId) {
          setUser(currentUser);
          const accountId = (
            BigInt(currentUser.steamId) - BigInt("76561197960265728")
          ).toString();
          axios
            .get(`https://api.opendota.com/api/players/${accountId}`)
            .then((rankRes) => {
              if (rankRes.data && rankRes.data.rank_tier) {
                setUser((prev) =>
                  prev ? { ...prev, rankTier: rankRes.data.rank_tier } : prev
                );
              }
            })
            .catch((err) => console.error("Error fetching rank:", err));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        setError("Failed to fetch user");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-900 dark:text-gray-100">Loading...</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-semibold text-blue-600 mb-2 text-center">
            Profile
          </h1>
          <div className="metro-card text-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              Not Logged In
            </h2>
            <a
              href="https://dotaw-tracker-production.up.railway.app/auth/steam"
              className="metro-button"
            >
              Login with Steam
            </a>
          </div>
        </div>
      </div>
    );

  const getRankName = (rankTier: number | undefined) => {
    if (!rankTier) return "Unranked";
    const tier = Math.floor(rankTier / 10);
    const subTier = rankTier % 10;
    const ranks = [
      "Herald",
      "Guardian",
      "Crusader",
      "Archon",
      "Legend",
      "Ancient",
      "Divine",
      "Immortal",
    ];
    return `${ranks[tier - 1]} ${subTier}` || "Unranked";
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-2">Profile</h1>
        <div className="metro-card flex items-center gap-2 mb-2 p-2">
          <img
            src={user.avatar || "https://via.placeholder.com/128"}
            alt={user.displayName}
            className="w-16 h-16 rounded"
          />
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {user.displayName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              SteamID: {user.steamId}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rank: {getRankName(user.rankTier)}
            </p>
          </div>
        </div>
        <div className="metro-card">
          <h3 className="text-md font-medium text-blue-600 mb-1">Statistics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Match history and stats will be available after OpenDota
            integration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
