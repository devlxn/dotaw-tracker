import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

interface Player {
  name: string;
  steamId: string; // теперь всегда string
  teamName: string;
  teamTag?: string;
}

function ProTeams() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const teamsData = [

  // Статический список команд и их актуальных составов
  const teamsData = [
    {
      name: "AVULUS",
      tag: "AVL",
      players: ["dEsire", "Fly", "Smiling Knight", "Worick", "Xibbe"],
    },
    {
      name: "Gaimin Gladiators",
      tag: "GG",
      players: ["Ace", "Malady", "Quinn", "tOfu", "watson"],
    },
    {
      name: "MOUZ",
      tag: "MOUZ",
      players: ["Abed", "Ekki", "Kami", "Seleri", "zeal"],
    },
    {
      name: "OG",
      tag: "OG",
      players: ["daze", "Kidaro", "MikSa`", "Shad", "Stormstormer"],
    },
    {
      name: "Team Liquid",
      tag: "TL",
      players: ["Boxi", "Insania", "miCKe", "Nisha", "SabeRLighT"],
    },
    { name: "Team Secret", tag: "TS", players: ["Puppey"] },
    {
      name: "Tundra Esports",
      tag: "TND",
      players: ["33", "bzm", "Crystallis", "Saksa", "Whitemon"],
    },
    {
      name: "1w Team",
      tag: "1W",
      players: ["kasane", "Munkushi~", "squad1x", "SSS", "swedenstrong"],
    },
    {
      name: "4Pirates",
      tag: "4P",
      players: [
        "ariel",
        "nattynarwhal_",
        "Otaker",
        "PERDAN4IK",
        "мистер мораль",
      ],
    },
    {
      name: "Aurora Gaming",
      tag: "AUR",
      players: ["kiyotaka", "Mira", "Nightfall", "panto", "TORONTOTOKYO"],
    },
    {
      name: "BetBoom Team",
      tag: "BB",
      players: ["gpk", "Kataomi", "MieRo", "Pure", "Save-"],
    },
    {
      name: "L1GA TEAM",
      tag: "L1GA",
      players: ["erase", "Malik", "mrls", "RESPECT", "v1olent`"],
    },
    {
      name: "Natus Vincere",
      tag: "NaVi",
      players: ["gotthejuice", "Niku", "pma", "Riddys", "Zayac"],
    },
    {
      name: "Nemiga Gaming",
      tag: "NEM",
      players: ["bashka", "Covisnine", "monodrama", "xsvampire", "young G"],
    },
    {
      name: "One Move",
      tag: "OM",
      players: ["bb3px", "Difference", "eyesxght", "Gilgir", "Vazya"],
    },
    {
      name: "PARIVISION",
      tag: "PV",
      players: ["9Class", "DM", "Dukalis", "None-", "Satanic"],
    },
    {
      name: "Team Spirit",
      tag: "SPT",
      players: ["Collapse", "Larl", "Miposhka", "rue", "Yatoro"],
    },
    {
      name: "Team Yandex",
      tag: "YAN",
      players: ["CHIRA_JUNIOR", "Noticed", "prblms", "Solo", "TA2000"],
    },
    {
      name: "Virtus.pro",
      tag: "VP",
      players: ["Antares", "Daxak", "lorenof", "Rein", "V-Tune"],
    },
    {
      name: "Nigma Galaxy (MENA)",
      tag: "NG",
      players: ["GH", "KuroKy", "No!ob", "OmaR", "SumaiL"],
    },
    {
      name: "Team Falcons (MENA)",
      tag: "FAL",
      players: ["ATF", "Cr1t-", "Malr1ne", "skiter", "Sneyking"],
    },
    {
      name: "Winter Bear (MENA)",
      tag: "WB",
      players: ["Jeezy", "KaChal", "Lodine", "Mikey", "ReTy", "Stoic"],
    },
    {
      name: "Team Tidebound",
      tag: "TB",
      players: ["Bach", "NothingToSay", "planet", "shiro", "y`"],
    },
    {
      name: "Xtreme Gaming",
      tag: "XG",
      players: ["Ame", "poloson", "XinQ", "Xm", "Xx"],
    },
    {
      name: "Yakult Brothers",
      tag: "YB",
      players: ["Beyond", "BoBoKa", "Emo", "flyfly", "Oli"],
    },
    {
      name: "BOOM Esports",
      tag: "BOOM",
      players: ["Armel", "Jabz", "JaCkky", "Jaunuel", "TIMS"],
    },
    {
      name: "Execration",
      tag: "EXE",
      players: ["cml", "lewis", "Palos", "Shanks", "Tino"],
    },
    { name: "Myth Avenue Gaming", tag: "MAG", players: ["MooN"] },
    {
      name: "Talon Esports",
      tag: "TAL",
      players: ["23savage", "Jhocam", "Kuku", "Mikoto", "Ws"],
    },
    {
      name: "Team Nemesis",
      tag: "TN",
      players: ["Akashi", "Erice", "Jing", "Mac", "Raven"],
    },
    {
      name: "The MongolZ",
      tag: "MON",
      players: ["Ace12", "FortuneSoul", "Osocle~", "Panda", "winter"],
    },
    {
      name: "Yangon Galacticos",
      tag: "YG",
      players: ["JG", "Ksh", "Skill Lay", "Young PH", "ZawRain"],
    },
    {
      name: "CDUB Esports",
      tag: "CDUB",
      players: ["Dante inferno", "Luis", "MarinoKi", "Th3", "wxkeupparalyzed"],
    },
    { name: "Fart Studios", tag: "FS", players: ["BSJ", "Jenkins", "Newsham"] },
    {
      name: "Shopify Rebellion",
      tag: "SR",
      players: ["Davai Lama", "Hellscream", "skem", "Timado", "Yopaj"],
    },
    {
      name: "Wildcard",
      tag: "WC",
      players: ["Bignum", "Fayde", "RCY", "Speeed", "Yamsun"],
    },
    { name: "Edge", tag: "EDGE", players: ["Michael-", "PiPi", "Vitaly"] },
    {
      name: "HEROIC",
      tag: "HERO",
      players: ["4nalog", "KJ", "Scofield", "Wisper", "Yuma"],
    },
    { name: "Hokori", tag: "HOK", players: ["Gardick", "Lumière"] },
    {
      name: "Infamous",
      tag: "INF",
      players: ["CHAAANNN", "JP", "lalatronii", "sl4d1n-", "TakeCare"],
    },
    { name: "Infinity", tag: "INFY", players: ["Costabile", "fcr", "n1ght"] },
    {
      name: "Lava Esports",
      tag: "LAVA",
      players: ["kendallx", "Mjz", "pamplona", "S1RENM", "Wits"],
    },
  ];

  useEffect(() => {
    const fetchProPlayers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          "https://api.opendota.com/api/proPlayers"
        );
        const apiPlayers = response.data as any[];

        const allPlayers: Player[] = teamsData.flatMap((team) =>
          team.players.map((playerName) => {
            const matchedPlayer = apiPlayers.find(
              (p: any) => p.name === playerName || p.personaname === playerName
            );
            return {
              name: playerName,
              steamId: matchedPlayer?.steamid ?? "", // всегда string
              teamName: team.name,
              teamTag: team.tag,
            };
          })
        );
        setPlayers(allPlayers);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch pro players";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProPlayers();
  }, []);

  const handlePlayerClick = (steamId: string) => {
    if (!steamId) return;
    navigate(`/search?steamId=${steamId}`);
  };

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

  const teams = players.reduce((acc, player) => {
    if (!acc[player.teamName]) {
      acc[player.teamName] = {
        name: player.teamName,
        tag: player.teamTag,
        players: [],
      };
    }
    acc[player.teamName].players.push(player);
    return acc;
  }, {} as { [key: string]: { name: string; tag?: string; players: Player[] } });

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="hitech-header text-3xl font-[Orbitron] text-blue-600 dark:text-blue-400 mb-6 text-center">
          Professional Teams
        </h1>
        {Object.values(teams).map((team) => (
          <div
            key={team.name}
            className="hitech-card mb-6 p-4 bg-gray-900 dark:bg-gray-800"
          >
            <h2 className="text-xl font-[Orbitron] text-green-600 dark:text-green-400 mb-2">
              {team.name} {team.tag ? `(${team.tag})` : ""}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {team.players.map((player) => (
                <div
                  key={player.name}
                  className="hitech-card bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 p-2"
                >
                  <h3
                    className="text-md font-medium text-gray-100 cursor-pointer hover:text-blue-400"
                    onClick={() => handlePlayerClick(player.steamId)}
                  >
                    {player.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProTeams;
