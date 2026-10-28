export default function normalizePokemon(raw) {
  return {
    id: raw.id,
    name: raw.name,

    image:
      raw.sprites?.other?.["official-artwork"]?.front_default ??
      raw.sprites?.front_default ??
      null,

    types: (raw.types ?? []).map((item) => item.type.name),

    stats: (raw.stats ?? []).map((item) => ({
      name: item.stat.name,
      value: item.base_stat,
    })),

    abilities: (raw.abilities ?? []).map(
      (item) => item.ability.name
    ),
  };
}