import { Link } from "react-router";

function TeamPage({ team, onRemoveFromTeam, onViewDetails }) {
  return (
    <section>
      <h2>Your team ({team.length}/6)</h2>

      {team.length === 0 && (
        <p>
          Your team is empty. <Link to="/">Find your first Pokémon!</Link>
        </p>
      )}

      <ol className="team-grid">
        {Array.from({ length: 6 }, (_, index) => {
          const pokemon = team[index];

          return (
            <li
              key={pokemon ? pokemon.id : `empty-${index}`}
              className="team-slot"
            >
              <p>Slot {index + 1}</p>

              {pokemon ? (
                <>
                  <h3 className="pokemon-name">
                    {pokemon.name.replaceAll("-", " ")}
                  </h3>

                  <p>#{pokemon.id}</p>
                  <p>{pokemon.types.join(" / ")}</p>

                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={() => onViewDetails(pokemon)}
                    >
                      View details
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveFromTeam(pokemon.id)}
                    >
                      Remove
                    </button>
                  </div>
                </>
              ) : (
                <p>Empty slot</p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default TeamPage;