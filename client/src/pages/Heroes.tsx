import { useState, useEffect } from "react";
import { heroes } from "../data/heroes";

interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  legs: number;
}

function Heroes() {
  const [search, setSearch] = useState("");
  const [attrFilter, setAttrFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    // Убираем анимацию загрузки
  }, []);

  const attributeMap: { [key: string]: string } = {
    str: "Strength",
    agi: "Agility",
    int: "Intelligence",
    all: "Universal",
  };

  const filteredHeroes: Hero[] = heroes.filter((hero: Hero) => {
    const matchesSearch = hero.localized_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesAttr = attrFilter ? hero.primary_attr === attrFilter : true;
    const matchesRole = roleFilter ? hero.roles.includes(roleFilter) : true;
    return matchesSearch && matchesAttr && matchesRole;
  });

  const attributes = ["str", "agi", "int", "all"];
  const roles = [
    "Carry",
    "Support",
    "Nuker",
    "Disabler",
    "Durable",
    "Escape",
    "Pusher",
    "Initiator",
  ];

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold text-blue-600 mb-4 text-center">
          Dota 2 Heroes
        </h1>
        <div className="mb-4 flex flex-col sm:flex-row gap-2 justify-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search heroes..."
            className="metro-input w-full sm:w-64"
          />
          <select
            value={attrFilter}
            onChange={(e) => setAttrFilter(e.target.value)}
            className="metro-input"
          >
            <option value="">All Attributes</option>
            {attributes.map((attr) => (
              <option key={attr} value={attr}>
                {attributeMap[attr]}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="metro-input"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredHeroes.map((hero: Hero) => (
            <div
              key={hero.id}
              className="metro-card bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <img
                src={`https://cdn.dota2.com/apps/dota2/images/heroes/${hero.name.replace(
                  "npc_dota_hero_",
                  ""
                )}_full.png`}
                alt={hero.localized_name}
                className="w-full h-32 object-cover rounded-t-lg"
              />
              <div className="p-2">
                <h3 className="text-md font-medium text-gray-900 dark:text-gray-100">
                  {hero.localized_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Attribute: {attributeMap[hero.primary_attr]}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Attack: {hero.attack_type}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Roles: {hero.roles.join(", ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Heroes;
