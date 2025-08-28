import { useState, useEffect } from "react";
import axios from "axios";
import { heroes } from "../data/heroes";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface Match {
  match_id: number;
  hero_id: number;
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  radiant_win: boolean;
  player_slot: number;
}

interface Player {
  steamId: string;
  displayName: string;
  avatar: string;
  rankTier?: number;
}

function Search() {
  const [query, setQuery] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const convertSteamIdToAccountId = (steamId: string): string => {
    const STEAM_ID_BASE = BigInt("76561197960265728");
    try {
      const accountId = BigInt(steamId) - STEAM_ID_BASE;
      return accountId.toString();
    } catch (e) {
      throw new Error("Invalid SteamID format");
    }
  };

  const isValidSteamId = (id: string): boolean => {
    return /^(7656119[0-9]{10})$/.test(id);
  };

  const isValidAccountId = (id: string): boolean => {
    return /^\d+$/.test(id) && Number(id) > 0;
  };

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

  useEffect(() => {
    const steamIdFromUrl = searchParams.get("steamId");
    if (steamIdFromUrl && isValidSteamId(steamIdFromUrl)) {
      setLoading(true);
      setError("");
      setPlayer(null);
      setMatches([]);
      setPage(1);

      const fetchPlayerData = async () => {
        try {
          const accountId = convertSteamIdToAccountId(steamIdFromUrl);
          const response = await axios.get(
            `https://dotaw-tracker-production.up.railway.app/api/search?query=${accountId}`,
            { withCredentials: true }
          );
          const data = response.data;

          if (data && data.length === 1) {
            const playerData = data[0];
            const rankResponse = await axios.get(
              `https://api.opendota.com/api/players/${accountId}`
            );
            const rankTier = rankResponse.data?.rank_tier;
            setPlayer({ ...playerData, rankTier });
            await fetchMatches(playerData.steamId, 1);
          } else {
            setError("Player not found with the provided SteamID");
          }
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch player data";
          setError(`Error: ${message}`);
        } finally {
          setLoading(false);
        }
      };

      fetchPlayerData();
    }
  }, [searchParams]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setPlayer(null);
    setMatches([]);
    setPage(1);

    try {
      const inputId = query.trim();
      let accountId: string;

      if (isValidSteamId(inputId)) {
        accountId = convertSteamIdToAccountId(inputId);
      } else if (isValidAccountId(inputId)) {
        accountId = inputId;
      } else {
        setError(
          "Please enter a valid SteamID (e.g., 76561197960265728) or AccountID (e.g., 123456789)"
        );
        return;
      }

      const response = await axios.get(
        `https://dotaw-tracker-production.up.railway.app/api/search?query=${accountId}`,
        { withCredentials: true }
      );
      const data = response.data;

      if (!data || !data.length) {
        setError("Player not found with the provided ID");
      } else if (data.length === 1) {
        const playerData = data[0];
        const rankResponse = await axios.get(
          `https://api.opendota.com/api/players/${accountId}`
        );
        const rankTier = rankResponse.data?.rank_tier;
        setPlayer({ ...playerData, rankTier });
        await fetchMatches(playerData.steamId, 1);
        navigate(`?steamId=${playerData.steamId}`);
      } else {
        setError("Unexpected response format");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to search player";
      console.error("Search error:", err);
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async (steamId: string, page: number) => {
    try {
      const response = await axios.get(
        `https://dotaw-tracker-production.up.railway.app/api/matches/${steamId}`,
        {
          params: { page, limit: 20 },
          withCredentials: true,
        }
      );
      setMatches(response.data.matches);
      setTotalPages(response.data.totalPages);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch matches";
      console.error("Error fetching matches:", err);
      setError(`Error: ${message}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setPlayer(null);
    setMatches([]);
    setError("");
    setPage(1);
    navigate("/search");
  };

  const stats = matches.reduce(
    (acc, match) => {
      const isWin =
        (match.radiant_win && match.player_slot < 128) ||
        (!match.radiant_win && match.player_slot >= 128);
      return {
        totalMatches: acc.totalMatches + 1,
        wins: acc.wins + (isWin ? 1 : 0),
        kills: acc.kills + match.kills,
        deaths: acc.deaths + match.deaths,
        assists: acc.assists + match.assists,
      };
    },
    { totalMatches: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
  );

  const winRate = stats.totalMatches
    ? ((stats.wins / stats.totalMatches) * 100).toFixed(2)
    : "0.00";
  const avgKDA = stats.totalMatches
    ? `${(stats.kills / stats.totalMatches).toFixed(2)}/${(
        stats.deaths / stats.totalMatches
      ).toFixed(2)}/${(stats.assists / stats.totalMatches).toFixed(2)}`
    : "0/0/0";

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    if (player) fetchMatches(player.steamId, newPage);
  };

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-2 text-center sm:text-3xl">
          Player Search
        </h1>
        <p className="text-center mb-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Enter SteamID (e.g., 76561197960265728) or AccountID (e.g.,
          123456789).
        </p>
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 mb-2 sm:mb-4 relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter SteamID or AccountID"
            className="metro-input flex-1 p-2 text-sm sm:text-base"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm sm:text-base"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="metro-button p-2 text-sm sm:text-base"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        {loading && (
          <div className="flex justify-center mb-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <p className="text-center text-red-500 dark:text-red-400 mb-2 text-sm sm:text-base">
            {error}
          </p>
        )}
        {player && (
          <div className="mb-4">
            <div className="metro-card flex items-center gap-2 mb-2 p-2 sm:p-4">
              <img
                src={player.avatar || "https://via.placeholder.com/50"}
                alt={player.displayName}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded"
              />
              <div>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                  {player.displayName}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  SteamID: {player.steamId}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                  Rank: {getRankName(player.rankTier)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 sm:mb-4">
              <div className="metro-card bg-blue-100 dark:bg-blue-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-blue-700 dark:text-blue-300 text-sm sm:text-base">
                  Total Matches
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalMatches}
                </p>
              </div>
              <div className="metro-card bg-green-100 dark:bg-green-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-green-700 dark:text-green-300 text-sm sm:text-base">
                  Wins
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.wins}
                </p>
              </div>
              <div className="metro-card bg-yellow-100 dark:bg-yellow-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-yellow-700 dark:text-yellow-300 text-sm sm:text-base">
                  Win Rate
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {winRate}%
                </p>
              </div>
              <div className="metro-card bg-red-100 dark:bg-red-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-red-700 dark:text-red-300 text-sm sm:text-base">
                  Average KDA
                </h3>
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  {avgKDA}
                </p>
              </div>
            </div>
            {matches.length > 0 && (
              <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
                <h3 className="text-lg font-medium text-blue-600 mb-2 text-center sm:text-xl">
                  Matches
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => {
                    const hero = heroes.find((h) => h.id === match.hero_id);
                    return (
                      <Link
                        key={match.match_id}
                        to={`/match/${match.match_id}?steamId=${player.steamId}`}
                        className="metro-card bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2"
                      >
                        <div className="flex items-center gap-2">
                          {hero && (
                            <img
                              src={`https://cdn.dota2.com/apps/dota2/images/heroes/${hero.name.replace(
                                "npc_dota_hero_",
                                ""
                              )}_icon.png`}
                              alt={hero.localized_name}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <p className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                            Hero:{" "}
                            {hero?.localized_name ||
                              `Unknown (${match.hero_id})`}
                          </p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm p-1">
                          Duration: {Math.floor(match.duration / 60)}:
                          {(match.duration % 60).toString().padStart(2, "0")}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm p-1">
                          KDA: {match.kills}/{match.deaths}/{match.assists}
                        </p>
                        <p
                          className={
                            (match.radiant_win && match.player_slot < 128) ||
                            (!match.radiant_win && match.player_slot >= 128)
                              ? "text-green-600 dark:text-green-400 text-xs sm:text-sm p-1"
                              : "text-red-600 dark:text-red-400 text-xs sm:text-sm p-1"
                          }
                        >
                          Result:
                          {" " +
                            ((match.radiant_win && match.player_slot < 128) ||
                            (!match.radiant_win && match.player_slot >= 128)
                              ? "Win"
                              : "Loss")}
                        </p>
                      </Link>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="metro-button bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-sm sm:text-base px-2 sm:px-4 py-1"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`metro-button ${
                          p === page
                            ? "bg-blue-500 text-white"
                            : "bg-gray-500 hover:bg-gray-600"
                        } text-sm sm:text-base px-2 sm:px-4 py-1`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="metro-button bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-sm sm:text-base px-2 sm:px-4 py-1"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;
