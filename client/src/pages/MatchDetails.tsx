import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { heroes } from "../data/heroes";

const itemIdToName: { [key: number]: string } = {
  1: "blink",
  2: "magic_stick",
  3: "gauntlets",
};

interface Player {
  account_id: number; // 32-битный account_id
  personaname: string;
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  tower_damage: number;
  last_hits: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  player_slot: number;
}

interface Match {
  match_id: number;
  duration: number;
  radiant_win: boolean;
  players: Player[];
}

function MatchDetails() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatch = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `http://localhost:5000/api/match/${matchId}`
        );
        setMatch(response.data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch match data";
        console.error("Match error:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

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
  if (!match)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          No match data available
        </p>
      </div>
    );

  const radiantPlayers = match.players.filter((p) => p.player_slot < 128);
  const direPlayers = match.players.filter((p) => p.player_slot >= 128);

  // Подсчет общего числа киллов
  const radiantKills = radiantPlayers.reduce(
    (sum, player) => sum + player.kills,
    0
  );
  const direKills = direPlayers.reduce((sum, player) => sum + player.kills, 0);

  // Общая статистика
  const radiantStats = {
    totalKills: radiantKills,
    totalDeaths: radiantPlayers.reduce((sum, player) => sum + player.deaths, 0),
    totalAssists: radiantPlayers.reduce(
      (sum, player) => sum + player.assists,
      0
    ),
    totalGPM:
      radiantPlayers.reduce((sum, player) => sum + player.gold_per_min, 0) / 5,
    totalXPM:
      radiantPlayers.reduce((sum, player) => sum + player.xp_per_min, 0) / 5,
    totalHeroDamage: radiantPlayers.reduce(
      (sum, player) => sum + player.hero_damage,
      0
    ),
    totalTowerDamage: radiantPlayers.reduce(
      (sum, player) => sum + player.tower_damage,
      0
    ),
    totalLastHits: radiantPlayers.reduce(
      (sum, player) => sum + player.last_hits,
      0
    ),
  };

  const direStats = {
    totalKills: direKills,
    totalDeaths: direPlayers.reduce((sum, player) => sum + player.deaths, 0),
    totalAssists: direPlayers.reduce((sum, player) => sum + player.assists, 0),
    totalGPM:
      direPlayers.reduce((sum, player) => sum + player.gold_per_min, 0) / 5,
    totalXPM:
      direPlayers.reduce((sum, player) => sum + player.xp_per_min, 0) / 5,
    totalHeroDamage: direPlayers.reduce(
      (sum, player) => sum + player.hero_damage,
      0
    ),
    totalTowerDamage: direPlayers.reduce(
      (sum, player) => sum + player.tower_damage,
      0
    ),
    totalLastHits: direPlayers.reduce(
      (sum, player) => sum + player.last_hits,
      0
    ),
  };

  const getHeroName = (heroId: number): string => {
    const hero = heroes.find((h) => h.id === heroId);
    return hero ? hero.localized_name : `Unknown (${heroId})`;
  };

  const getHeroIcon = (heroId: number): string | null => {
    const hero = heroes.find((h) => h.id === heroId);
    return hero
      ? `https://cdn.dota2.com/apps/dota2/images/heroes/${hero.name.replace(
          "npc_dota_hero_",
          ""
        )}_icon.png`
      : null;
  };

  const getItemImage = (itemId: number) => {
    const itemName = itemIdToName[itemId] || `item_${itemId}`;
    return `https://dota2.ru/img/items/${itemName}.webp`;
  };

  const handlePlayerClick = (accountId: number) => {
    // Преобразование account_id в SteamID с явной проверкой
    const steamId = BigInt(76561197960265728) + BigInt(accountId);
    navigate(`/search?steamId=${steamId.toString()}`);
    console.log("Converted SteamID:", steamId.toString()); // Для отладки
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="hitech-card mb-4 p-6">
          <h1 className="hitech-header">Match {match.match_id}</h1>
          <div className="flex justify-center gap-6 text-gray-900 dark:text-gray-100">
            <p>
              Duration: {Math.floor(match.duration / 60)}:
              {(match.duration % 60).toString().padStart(2, "0")}
            </p>
            <p
              className={
                match.radiant_win
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }
            >
              Result: {match.radiant_win ? "Radiant Win" : "Dire Win"}
            </p>
            <p>
              Score: {radiantKills} - {direKills}
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="hitech-card bg-green-900 dark:bg-green-950">
            <h2 className="text-xl font-[Orbitron] text-green-600 dark:text-green-400 mb-2 text-center">
              Radiant
            </h2>
            <div className="grid gap-4">
              {radiantPlayers.map((player) => {
                const heroIcon = getHeroIcon(player.hero_id);
                return (
                  <div
                    key={player.account_id}
                    className="hitech-card bg-gray-900 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <h3
                      className="text-md font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handlePlayerClick(player.account_id)}
                    >
                      {player.personaname || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-2 p-2">
                      {heroIcon && (
                        <img
                          src={heroIcon}
                          alt={getHeroName(player.hero_id)}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <p className="text-gray-700 dark:text-gray-200">
                        Hero: {getHeroName(player.hero_id)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          KDA
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.kills}/{player.deaths}/{player.assists}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          GPM/XPM
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.gold_per_min}/{player.xp_per_min}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hero Damage
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.hero_damage}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tower Damage
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.tower_damage}
                        </p>
                      </div>
                      <div className="hitech-card col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last Hits
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.last_hits}
                        </p>
                      </div>
                      <div className="hitech-card col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Items
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            player.item_0,
                            player.item_1,
                            player.item_2,
                            player.item_3,
                            player.item_4,
                            player.item_5,
                          ].map((itemId, index) =>
                            getItemImage(itemId) ? (
                              <img
                                key={index}
                                src={getItemImage(itemId)}
                                alt={`Item ${itemId}`}
                                className="w-10 h-10 object-contain"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : (
                              <div
                                key={index}
                                className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="hitech-card bg-gray-200 dark:bg-gray-900">
            <h2 className="text-xl font-[Orbitron] text-blue-600 dark:text-blue-400 mb-2 text-center">
              Match Statistics
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="hitech-card bg-green-900 dark:bg-green-950">
                <h3 className="text-lg font-[Orbitron] text-green-600 dark:text-green-400">
                  Radiant
                </h3>
                <p>Total Kills: {radiantStats.totalKills}</p>
                <p>Total Deaths: {radiantStats.totalDeaths}</p>
                <p>Total Assists: {radiantStats.totalAssists}</p>
                <p>Avg GPM: {radiantStats.totalGPM.toFixed(1)}</p>
                <p>Avg XPM: {radiantStats.totalXPM.toFixed(1)}</p>
                <p>Total Hero Damage: {radiantStats.totalHeroDamage}</p>
                <p>Total Tower Damage: {radiantStats.totalTowerDamage}</p>
                <p>Total Last Hits: {radiantStats.totalLastHits}</p>
              </div>
              <div className="hitech-card bg-red-900 dark:bg-red-950">
                <h3 className="text-lg font-[Orbitron] text-red-600 dark:text-red-400">
                  Dire
                </h3>
                <p>Total Kills: {direStats.totalKills}</p>
                <p>Total Deaths: {direStats.totalDeaths}</p>
                <p>Total Assists: {direStats.totalAssists}</p>
                <p>Avg GPM: {direStats.totalGPM.toFixed(1)}</p>
                <p>Avg XPM: {direStats.totalXPM.toFixed(1)}</p>
                <p>Total Hero Damage: {direStats.totalHeroDamage}</p>
                <p>Total Tower Damage: {direStats.totalTowerDamage}</p>
                <p>Total Last Hits: {direStats.totalLastHits}</p>
              </div>
            </div>
          </div>
          <div className="hitech-card bg-red-900 dark:bg-red-950">
            <h2 className="text-xl font-[Orbitron] text-red-600 dark:text-red-400 mb-2 text-center">
              Dire
            </h2>
            <div className="grid gap-4">
              {direPlayers.map((player) => {
                const heroIcon = getHeroIcon(player.hero_id);
                return (
                  <div
                    key={player.account_id}
                    className="hitech-card bg-gray-900 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    <h3
                      className="text-md font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handlePlayerClick(player.account_id)}
                    >
                      {player.personaname || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-2 p-2">
                      {heroIcon && (
                        <img
                          src={heroIcon}
                          alt={getHeroName(player.hero_id)}
                          className="w-8 h-8 object-contain"
                        />
                      )}
                      <p className="text-gray-700 dark:text-gray-200">
                        Hero: {getHeroName(player.hero_id)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          KDA
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.kills}/{player.deaths}/{player.assists}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          GPM/XPM
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.gold_per_min}/{player.xp_per_min}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hero Damage
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.hero_damage}
                        </p>
                      </div>
                      <div className="hitech-card">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tower Damage
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.tower_damage}
                        </p>
                      </div>
                      <div className="hitech-card col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Last Hits
                        </p>
                        <p className="text-lg text-gray-900 dark:text-gray-100">
                          {player.last_hits}
                        </p>
                      </div>
                      <div className="hitech-card col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Items
                        </p>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            player.item_0,
                            player.item_1,
                            player.item_2,
                            player.item_3,
                            player.item_4,
                            player.item_5,
                          ].map((itemId, index) =>
                            getItemImage(itemId) ? (
                              <img
                                key={index}
                                src={getItemImage(itemId)}
                                alt={`Item ${itemId}`}
                                className="w-10 h-10 object-contain"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : (
                              <div
                                key={index}
                                className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"
                              />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <button
          className="mt-6 hitech-button"
          onClick={() => {
            const searchParams = new URLSearchParams(location.search);
            const steamId = searchParams.get("steamId");
            navigate(steamId ? `/search?steamId=${steamId}` : "/search");
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default MatchDetails;
