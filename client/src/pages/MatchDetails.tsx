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
  account_id: number;
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold text-blue-600 mb-4 text-center">
          Match {match.match_id}
        </h1>
        <p className="text-center mb-4 text-gray-600 dark:text-gray-400">
          Duration: {Math.floor(match.duration / 60)}:
          {(match.duration % 60).toString().padStart(2, "0")} | Winner:{" "}
          {match.radiant_win ? "Radiant" : "Dire"}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="metro-card bg-green-100 dark:bg-green-900">
            <h2 className="text-xl font-medium text-green-700 dark:text-green-300 mb-2">
              Radiant
            </h2>
            <div className="grid gap-2">
              {radiantPlayers.map((player) => {
                const heroIcon = getHeroIcon(player.hero_id);
                return (
                  <div
                    key={player.account_id}
                    className="metro-card bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                      {player.personaname || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-2 p-2">
                      {heroIcon && (
                        <img
                          src={heroIcon}
                          alt={getHeroName(player.hero_id)}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <p>Hero: {getHeroName(player.hero_id)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          KDA
                        </p>
                        <p className="text-lg">
                          {player.kills}/{player.deaths}/{player.assists}
                        </p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          GPM/XPM
                        </p>
                        <p className="text-lg">
                          {player.gold_per_min}/{player.xp_per_min}
                        </p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hero Damage
                        </p>
                        <p className="text-lg">{player.hero_damage}</p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tower Damage
                        </p>
                        <p className="text-lg">{player.tower_damage}</p>
                      </div>
                      <div className="metro-card col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last Hits
                        </p>
                        <p className="text-lg">{player.last_hits}</p>
                      </div>
                      <div className="metro-card col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Items
                        </p>
                        <div className="flex gap-2 flex-wrap">
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
                                className="w-8 h-8 object-contain"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : null
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="metro-card bg-red-100 dark:bg-red-900">
            <h2 className="text-xl font-medium text-red-700 dark:text-red-300 mb-2">
              Dire
            </h2>
            <div className="grid gap-2">
              {direPlayers.map((player) => {
                const heroIcon = getHeroIcon(player.hero_id);
                return (
                  <div
                    key={player.account_id}
                    className="metro-card bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                      {player.personaname || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-2 p-2">
                      {heroIcon && (
                        <img
                          src={heroIcon}
                          alt={getHeroName(player.hero_id)}
                          className="w-6 h-6 object-contain"
                        />
                      )}
                      <p>Hero: {getHeroName(player.hero_id)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          KDA
                        </p>
                        <p className="text-lg">
                          {player.kills}/{player.deaths}/{player.assists}
                        </p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          GPM/XPM
                        </p>
                        <p className="text-lg">
                          {player.gold_per_min}/{player.xp_per_min}
                        </p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Hero Damage
                        </p>
                        <p className="text-lg">{player.hero_damage}</p>
                      </div>
                      <div className="metro-card">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Tower Damage
                        </p>
                        <p className="text-lg">{player.tower_damage}</p>
                      </div>
                      <div className="metro-card col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Last Hits
                        </p>
                        <p className="text-lg">{player.last_hits}</p>
                      </div>
                      <div className="metro-card col-span-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Items
                        </p>
                        <div className="flex gap-2 flex-wrap">
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
                                className="w-8 h-8 object-contain"
                                onError={(e) =>
                                  (e.currentTarget.style.display = "none")
                                }
                              />
                            ) : null
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
          onClick={() => {
            const searchParams = new URLSearchParams(location.search);
            const steamId = searchParams.get("steamId");
            navigate(steamId ? `/search?steamId=${steamId}` : "/search");
          }}
          className="mt-4 metro-button bg-gray-500 hover:bg-gray-600"
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default MatchDetails;
