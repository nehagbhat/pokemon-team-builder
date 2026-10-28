import express from "express";
import { randomInt } from "node:crypto";
import normalizePokemon from "../src/utils/normalizePokemon.js";

const app = express();
const PORT = 3001;
const MAX_POKEMON_ID = 1025;

const ATTACK_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

// Parse JSON before routes try to read req.body.
app.use(express.json({ limit: "10kb" }));

function sendError(res, status, code, message) {
  return res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

// Store successfully fetched data in server memory.
const pokemonCache = new Map();
const typeCache = new Map();

async function fetchPokeApi(path) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/${path}`,
    {
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!response.ok) {
    throw new Error(`PokéAPI returned ${response.status}`);
  }

  return response.json();
}

async function getPokemon(id) {
  if (pokemonCache.has(id)) {
    return pokemonCache.get(id);
  }

  const raw = await fetchPokeApi(`pokemon/${id}`);

  // Reject data that cannot support our display and analysis.
  if (
    raw.id !== id ||
    typeof raw.name !== "string" ||
    !Array.isArray(raw.types) ||
    raw.types.length < 1 ||
    raw.types.length > 2 ||
    raw.types.some(
      (entry) => !ATTACK_TYPES.includes(entry?.type?.name)
    ) ||
    !Array.isArray(raw.stats) ||
    raw.stats.some(
      (entry) =>
        typeof entry?.stat?.name !== "string" ||
        !Number.isFinite(entry.base_stat)
    ) ||
    !Array.isArray(raw.abilities) ||
    raw.abilities.some(
      (entry) => typeof entry?.ability?.name !== "string"
    )
  ) {
    throw new Error("PokéAPI returned unexpected Pokémon data.");
  }

  const pokemon = normalizePokemon(raw);
  pokemonCache.set(id, pokemon);

  return pokemon;
}

async function getTypeRelations(typeName) {
  if (typeCache.has(typeName)) {
    return typeCache.get(typeName);
  }

  const raw = await fetchPokeApi(`type/${typeName}`);
  const relations = raw.damage_relations;

  const requiredLists = [
    "double_damage_from",
    "half_damage_from",
    "no_damage_from",
  ];

  if (
    !relations ||
    requiredLists.some(
      (key) =>
        !Array.isArray(relations[key]) ||
        relations[key].some(
          (entry) => !ATTACK_TYPES.includes(entry?.name)
        )
    )
  ) {
    throw new Error("PokéAPI returned unexpected type data.");
  }

  typeCache.set(typeName, relations);
  return relations;
}

function isValidTeam(pokemonIds) {
  return (
    Array.isArray(pokemonIds) &&
    pokemonIds.length >= 1 &&
    pokemonIds.length <= 6 &&
    pokemonIds.every(
      (id) =>
        Number.isInteger(id) &&
        id >= 1 &&
        id <= MAX_POKEMON_ID
    ) &&
    new Set(pokemonIds).size === pokemonIds.length
  );
}

function generateRandomIds() {
  // Partial Fisher–Yates shuffle: choose six without replacement.
  const pool = Array.from(
    { length: MAX_POKEMON_ID },
    (_, index) => index + 1
  );

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = randomInt(index, pool.length);

    [pool[index], pool[randomIndex]] = [
      pool[randomIndex],
      pool[index],
    ];
  }

  return pool.slice(0, 6);
}

function getMultiplier(attackType, defensiveRelations) {
  let multiplier = 1;

  for (const relations of defensiveRelations) {
    const includesAttack = (list) =>
      list.some((type) => type.name === attackType);

    if (includesAttack(relations.no_damage_from)) {
      return 0;
    }

    if (includesAttack(relations.double_damage_from)) {
      multiplier *= 2;
    }

    if (includesAttack(relations.half_damage_from)) {
      multiplier *= 0.5;
    }
  }

  return multiplier;
}

// GET /api/random-team
app.get("/api/random-team", async (req, res) => {
  try {
    const ids = generateRandomIds();
    const team = await Promise.all(ids.map(getPokemon));

    res.status(200).json({ team });
  } catch (error) {
    console.error("Random team failed:", error.message);

    sendError(
      res,
      502,
      "UPSTREAM_FAILURE",
      "Could not generate a team from PokéAPI. Please try again."
    );
  }
});

// POST /api/analyze-team
app.post("/api/analyze-team", async (req, res) => {
  const pokemonIds = req.body?.pokemonIds;

  if (!isValidTeam(pokemonIds)) {
    return sendError(
      res,
      400,
      "INVALID_TEAM",
      "Use one to six distinct integer Pokémon IDs from 1 to 1025."
    );
  }

  try {
    const team = await Promise.all(pokemonIds.map(getPokemon));

    const defensiveTypes = [
      ...new Set(team.flatMap((pokemon) => pokemon.types)),
    ];

    const typeEntries = await Promise.all(
      defensiveTypes.map(async (typeName) => [
        typeName,
        await getTypeRelations(typeName),
      ])
    );

    const relationsByType = Object.fromEntries(typeEntries);

    const analysis = {
      weaknesses: {},
      resistances: {},
      immunities: {},
    };

    for (const attackType of ATTACK_TYPES) {
      for (const pokemon of team) {
        const defensiveRelations = pokemon.types.map(
          (typeName) => relationsByType[typeName]
        );

        const multiplier = getMultiplier(
          attackType,
          defensiveRelations
        );

        let category;

        if (multiplier === 0) {
          category = "immunities";
        } else if (multiplier > 1) {
          category = "weaknesses";
        } else if (multiplier < 1) {
          category = "resistances";
        } else {
          // Neutral damage is not counted.
          continue;
        }

        analysis[category][attackType] =
          (analysis[category][attackType] ?? 0) + 1;
      }
    }

    res.status(200).json(analysis);
  } catch (error) {
    console.error("Analysis failed:", error.message);

    sendError(
      res,
      502,
      "UPSTREAM_FAILURE",
      "Could not analyze the team using PokéAPI. Please try again."
    );
  }
});

// Give unknown API routes the same error format.
app.use("/api", (req, res) => {
  sendError(
    res,
    404,
    "NOT_FOUND",
    "That API route does not exist."
  );
});

// Handle malformed JSON and other middleware errors.
app.use((error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return sendError(
      res,
      400,
      "INVALID_JSON",
      "The request body must contain valid JSON."
    );
  }

  if (error.type === "entity.too.large") {
    return sendError(
      res,
      400,
      "INVALID_BODY",
      "The request body is too large."
    );
  }

  console.error(error);

  sendError(
    res,
    500,
    "SERVER_ERROR",
    "Something went wrong on the server."
  );
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});