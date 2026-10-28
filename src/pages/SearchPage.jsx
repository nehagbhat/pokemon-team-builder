import { useState } from "react";
import PokemonCard from "../components/PokemonCard";
import normalizePokemon from "../utils/normalizePokemon";

function SearchPage({ onAddToTeam, onViewDetails }) {
  const [query, setQuery] = useState("");
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    const searchValue = query.trim().toLowerCase();

    setError("");
    setPokemon(null);

    if (searchValue === "") {
      setError("Enter a Pokémon name or Pokédex number.");
      return;
    }

    const apiName =
      searchValue === "mr. mime" ? "mr-mime" : searchValue;

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(apiName)}`,
        { signal: controller.signal }
      );

      if (response.status === 404) {
        setError("No Pokémon matched that search.");
        return;
      }

      if (!response.ok) {
        setError("PokéAPI is having trouble. Please try again.");
        return;
      }

      const rawPokemon = await response.json();
      setPokemon(normalizePokemon(rawPokemon));
    } catch (err) {
      if (err.name === "AbortError") {
        setError("The search took too long. Please try again.");
      } else {
        setError("Could not connect to PokéAPI. Check your connection.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Find a Pokémon</h2>

      <form onSubmit={handleSearch} className="search-form">
        <label htmlFor="pokemon-search">
          Pokémon name or Pokédex number
        </label>

        <div className="search-controls">
          <input
            id="pokemon-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try pikachu or 25"
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {loading && <p role="status">Looking for your Pokémon...</p>}
      {error && <p role="alert">{error}</p>}

      {pokemon && (
        <PokemonCard
          key={pokemon.id}
          pokemon={pokemon}
          onAddToTeam={onAddToTeam}
          onViewDetails={onViewDetails}
        />
      )}
    </section>
  );
}

export default SearchPage;