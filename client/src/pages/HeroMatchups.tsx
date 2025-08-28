import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { heroes } from "../data/heroes";

interface Matchup {
  hero_id: number;
  games_played: number;
  wins: number;
  win_rate: number;
}

function HeroMatchups() {
  const { heroId } = useParams<{ heroId: string }>();
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchups = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `https://api.opendota.com/api/heroes/${heroId}/matchups`
        );
        const data = response.data as any[];
        const matchupsWithWinRate = data.map((matchup) => ({
          hero_id: matchup.hero_id,
          games_played: matchup.games_played,
          wins: matchup.wins,
          win_rate: (matchup.wins / matchup.games_played) * 100,
        }));
        const goodAgainst = [...matchupsWithWinRate]
          .sort((a: Matchup, b: Matchup) => b.win_rate - a.win_rate)
          .slice(0, 5);

        const badAgainst = [...matchupsWithWinRate]
          .sort((a: Matchup, b: Matchup) => a.win_rate - b.win_rate)
          .slice(0, 5);

        const allMatchups = [
          ...new Map(matchupsWithWinRate.map((m) => [m.hero_id, m])).values(),
        ].sort((a, b) => b.win_rate - a.win_rate);
        setMatchups([...goodAgainst, ...badAgainst, ...allMatchups]);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch matchups";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (heroId) {
      fetchMatchups();
    }
  }, [heroId]);

  const selectedHero = heroes.find((h) => h.id === Number(heroId));

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
  if (!selectedHero)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Hero not found
        </p>
      </div>
    );

  return (
    <div className="min-h-screen p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6">
          <h1 className="hitech-header text-2xl sm:text-3xl font-[Orbitron] text-blue-600 dark:text-blue-400">
            Matchups for {selectedHero.localized_name}
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="metro-button bg-gray-500 hover:bg-gray-600 mt-2 sm:mt-0 w-full sm:w-auto"
          >
            Back
          </button>
        </div>
        <div className="grid gap-6 sm:gap-8">
          {/* Good Against Section */}
          <div className="hitech-card bg-gray-900 dark:bg-gray-800 p-2 sm:p-4">
            <h2 className="text-lg sm:text-xl font-[Orbitron] text-green-600 dark:text-green-400 mb-2">
              Good Against (Top 5)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {matchups.slice(0, 5).map((matchup) => {
                const opponentHero = heroes.find(
                  (h) => h.id === matchup.hero_id
                );
                const isGood = matchup.win_rate > 50;
                return (
                  <div
                    key={matchup.hero_id}
                    className="flex items-center p-1 sm:p-2 bg-gray-700 dark:bg-gray-600 rounded"
                  >
                    <img
                      src={`https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/${opponentHero?.name.replace(
                        "npc_dota_hero_",
                        ""
                      )}_sb.png`}
                      alt={opponentHero?.localized_name}
                      className="w-8 sm:w-10 h-8 sm:h-10 mr-1 sm:mr-2 object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div>
                      <p className="text-sm sm:text-base text-gray-100 font-medium">
                        {opponentHero?.localized_name ||
                          `Unknown (${matchup.hero_id})`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Win Rate: {matchup.win_rate.toFixed(2)}%
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Games: {matchup.games_played}
                      </p>
                    </div>
                    <span className="ml-auto text-lg sm:text-xl text-green-500">
                      {isGood ? "↑" : "→"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bad Against Section */}
          <div className="hitech-card bg-gray-900 dark:bg-gray-800 p-2 sm:p-4">
            <h2 className="text-lg sm:text-xl font-[Orbitron] text-red-600 dark:text-red-400 mb-2">
              Bad Against (Top 5)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {matchups.slice(5, 10).map((matchup) => {
                const opponentHero = heroes.find(
                  (h) => h.id === matchup.hero_id
                );
                const isBad = matchup.win_rate < 50;
                return (
                  <div
                    key={matchup.hero_id}
                    className="flex items-center p-1 sm:p-2 bg-gray-700 dark:bg-gray-600 rounded"
                  >
                    <img
                      src={`https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/${opponentHero?.name.replace(
                        "npc_dota_hero_",
                        ""
                      )}_sb.png`}
                      alt={opponentHero?.localized_name}
                      className="w-8 sm:w-10 h-8 sm:h-10 mr-1 sm:mr-2 object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div>
                      <p className="text-sm sm:text-base text-gray-100 font-medium">
                        {opponentHero?.localized_name ||
                          `Unknown (${matchup.hero_id})`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Win Rate: {matchup.win_rate.toFixed(2)}%
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Games: {matchup.games_played}
                      </p>
                    </div>
                    <span className="ml-auto text-lg sm:text-xl text-red-500">
                      {isBad ? "↓" : "→"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Matchups Section */}
          <div className="hitech-card bg-gray-900 dark:bg-gray-800 p-2 sm:p-4">
            <h2 className="text-lg sm:text-xl font-[Orbitron] text-gray-300 dark:text-gray-400 mb-2">
              All Matchups
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {matchups.slice(10).map((matchup) => {
                const opponentHero = heroes.find(
                  (h) => h.id === matchup.hero_id
                );
                const isGood = matchup.win_rate > 50;
                const isBad = matchup.win_rate < 50;
                return (
                  <div
                    key={matchup.hero_id}
                    className="flex items-center p-1 sm:p-2 bg-gray-700 dark:bg-gray-600 rounded"
                  >
                    <img
                      src={`https://steamcdn-a.akamaihd.net/apps/dota2/images/heroes/${opponentHero?.name.replace(
                        "npc_dota_hero_",
                        ""
                      )}_sb.png`}
                      alt={opponentHero?.localized_name}
                      className="w-8 sm:w-10 h-8 sm:h-10 mr-1 sm:mr-2 object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                    <div>
                      <p className="text-sm sm:text-base text-gray-100 font-medium">
                        {opponentHero?.localized_name ||
                          `Unknown (${matchup.hero_id})`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Win Rate: {matchup.win_rate.toFixed(2)}%
                      </p>
                      <p className="text-xs sm:text-sm text-gray-300">
                        Games: {matchup.games_played}
                      </p>
                    </div>
                    <span className="ml-auto text-lg sm:text-xl">
                      {isGood ? (
                        <span className="text-green-500">↑</span>
                      ) : isBad ? (
                        <span className="text-red-500">↓</span>
                      ) : (
                        <span className="text-gray-400">→</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroMatchups;
