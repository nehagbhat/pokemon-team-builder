import { useState } from "react";

function PokemonCard({ pokemon, onViewDetails, onAddToTeam }) {
  const [failedImage, setFailedImage] = useState(null);

  const displayName = pokemon.name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const showImage =
    pokemon.image && failedImage !== pokemon.image;

  return (
    <article className="pokemon-card">
      <p className="pokemon-number">
        #{String(pokemon.id).padStart(3, "0")}
      </p>

      {showImage ? (
        <img
          className="pokemon-image"
          src={pokemon.image}
          alt={displayName}
          onError={() => setFailedImage(pokemon.image)}
        />
      ) : (
        <div className="image-placeholder">
          No image available
        </div>
      )}

      <h2>{displayName}</h2>

      <ul className="pokemon-types" aria-label="Types">
        {pokemon.types.map((type) => (
          <li key={type} className="type-badge">
            {type}
          </li>
        ))}
      </ul>

      <div className="card-actions">
        <button
          type="button"
          disabled={!onViewDetails}
          onClick={() => onViewDetails?.(pokemon)}
        >
          View details
        </button>

        <button
          type="button"
          disabled={!onAddToTeam}
          onClick={() => onAddToTeam?.(pokemon)}
        >
          Add to team
        </button>
      </div>
    </article>
  );
}

export default PokemonCard;