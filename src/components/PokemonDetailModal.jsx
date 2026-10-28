import { useEffect, useRef } from "react";

function PokemonDetailModal({ pokemon, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;

    dialog.showModal();

    return () => {
      dialog.close();

      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, []);

  function handleBackdropClick(event) {
    if (event.target !== event.currentTarget) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    const outsideDialog =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;

    if (outsideDialog) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="pokemon-dialog"
      aria-labelledby="pokemon-detail-title"
      onClick={handleBackdropClick}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        className="close-button"
        onClick={onClose}
        autoFocus
      >
        Close details
      </button>

      <h2 id="pokemon-detail-title" className="pokemon-name">
        {pokemon.name.replaceAll("-", " ")}
      </h2>

      <p>Pokédex #{pokemon.id}</p>
      <p>Types: {pokemon.types.join(", ")}</p>

      <h3>Base stats</h3>

      <dl className="stats-list">
        {pokemon.stats.map((stat) => (
          <div key={stat.name}>
            <dt>{stat.name.replaceAll("-", " ")}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <h3>Abilities</h3>

      <ul>
        {pokemon.abilities.map((ability) => (
          <li key={ability} className="pokemon-name">
            {ability.replaceAll("-", " ")}
          </li>
        ))}
      </ul>
    </dialog>
  );
}

export default PokemonDetailModal;