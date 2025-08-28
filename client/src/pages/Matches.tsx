import { useState, useEffect } from "react";
import axios from "axios";
import { heroes } from "../data/heroes";
import { Link, useNavigate } from "react-router-dom";

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

interface User {
  steamId: string;
  displayName: string;
  avatar: string;
}

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndMatches = async () => {
      try {
        const userResponse = await axios.get(
          "https://dotaw-tracker-production.up.railway.app/api/user",
          {
            withCredentials: true,
          }
        );
        const currentUser = userResponse.data;
        if (currentUser && currentUser.steamId) {
          setUser(currentUser);
          await fetchMatches(currentUser.steamId, 1);
        } else {
          setError("Please log in to view your matches");
          setLoading(false);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch user";
        console.error("Error fetching user:", message);
        setError(`Error: ${message}`);
        setLoading(false);
      }
    };

    fetchUserAndMatches();
  }, []);

  const fetchMatches = async (steamId: string, page: number) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    if (user?.steamId) fetchMatches(user.steamId, newPage);
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-2 text-center sm:text-3xl">
          Your Matches
        </h1>
        {loading && (
          <div className="flex justify-center mb-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && (
          <p className="text-center text-red-500 dark:text-red-400 mb-2">
            {error}
          </p>
        )}
        {!loading && !error && user && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 sm:mb-6">
              <div className="metro-card bg-blue-100 dark:bg-blue-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-blue-700 dark:text-blue-300">
                  Total Matches
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.totalMatches}
                </p>
              </div>
              <div className="metro-card bg-green-100 dark:bg-green-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-green-700 dark:text-green-300">
                  Wins
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.wins}
                </p>
              </div>
              <div className="metro-card bg-yellow-100 dark:bg-yellow-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-yellow-700 dark:text-yellow-300">
                  Win Rate
                </h3>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {winRate}%
                </p>
              </div>
              <div className="metro-card bg-red-100 dark:bg-red-900 p-2 sm:p-4">
                <h3 className="text-md font-medium text-red-700 dark:text-red-300">
                  Average KDA
                </h3>
                <p className="text-lg text-gray-900 dark:text-gray-100">
                  {avgKDA}
                </p>
              </div>
            </div>
            {matches.length > 0 && (
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {matches.map((match) => {
                    const hero = heroes.find((h) => h.id === match.hero_id);
                    return (
                      <Link
                        key={match.match_id}
                        to={`/match/${match.match_id}?steamId=${user.steamId}`}
                        className="metro-card bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 p-2"
                      >
                        <div className="flex items-center gap-2">
                          {hero && (
                            <img
                              src={`https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/${hero.name.replace(
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
                          Result:{" "}
                          {(match.radiant_win && match.player_slot < 128) ||
                          (!match.radiant_win && match.player_slot >= 128)
                            ? "Win"
                            : "Loss"}
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
            {matches.length === 0 && (
              <p className="text-center text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                No matches found for your account.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Matches;
