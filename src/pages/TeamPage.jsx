import { useRef, useState } from "react";
import { Link } from "react-router";
import TeamAnalysis from "../components/TeamAnalysis";
import { apiRequest } from "../utils/api";

function TeamPage({
  team,
  onRemoveFromTeam,
  onViewDetails,
  onReplaceTeam,
}) {
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomError, setRandomError] = useState("");

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Tracks the current team even while an old request is waiting.
  const teamKey = team.map((pokemon) => pokemon.id).join(",");
  const currentTeamKey = useRef(teamKey);
  currentTeamKey.current = teamKey;

  // Results only appear for the exact team they analyzed.
  const visibleAnalysis =
    analysisResult?.teamKey === teamKey
      ? analysisResult.data
      : null;

  const visibleAnalysisError =
    analysisError?.teamKey === teamKey
      ? analysisError.message
      : "";

  async function generateRandomTeam() {
    if (team.length > 0) {
      const confirmed = window.confirm(
        "Replace your current team with six random Pokémon?"
      );

      if (!confirmed) {
        return;
      }
    }

    setRandomLoading(true);
    setRandomError("");

    try {
      const data = await apiRequest("/api/random-team");

      const validTeam =
        Array.isArray(data.team) &&
        data.team.length === 6 &&
        new Set(data.team.map((pokemon) => pokemon.id)).size === 6 &&
        data.team.every(
          (pokemon) =>
            Number.isInteger(pokemon.id) &&
            pokemon.id >= 1 &&
            pokemon.id <= 1025 &&
            typeof pokemon.name === "string" &&
            Array.isArray(pokemon.types) &&
            Array.isArray(pokemon.stats) &&
            Array.isArray(pokemon.abilities)
        );

      if (!validTeam) {
        throw new Error("The server returned an invalid team.");
      }

      // Only replace the current team after a successful request.
      onReplaceTeam(data.team);
      setAnalysisResult(null);
      setAnalysisError(null);
    } catch (error) {
      setRandomError(error.message);
    } finally {
      setRandomLoading(false);
    }
  }

  async function analyzeTeam() {
    if (team.length === 0) {
      return;
    }

    const requestedTeamKey = teamKey;

    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const data = await apiRequest("/api/analyze-team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pokemonIds: team.map((pokemon) => pokemon.id),
        }),
      });

      const validAnalysis = [
        "weaknesses",
        "resistances",
        "immunities",
      ].every((category) => {
        const counts = data[category];

        return (
          counts !== null &&
          typeof counts === "object" &&
          !Array.isArray(counts) &&
          Object.values(counts).every(
            (count) =>
              Number.isInteger(count) &&
              count >= 1 &&
              count <= team.length
          )
        );
      });

      if (!validAnalysis) {
        throw new Error("The server returned invalid analysis.");
      }

      // Ignore results if the team changed during the request.
      if (currentTeamKey.current === requestedTeamKey) {
        setAnalysisResult({
          teamKey: requestedTeamKey,
          data,
        });
      }
    } catch (error) {
      if (currentTeamKey.current === requestedTeamKey) {
        setAnalysisError({
          teamKey: requestedTeamKey,
          message: error.message,
        });
      }
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <section>
      <h2>Your team ({team.length}/6)</h2>

      <div className="team-actions">
        <button
          type="button"
          onClick={generateRandomTeam}
          disabled={randomLoading}
        >
          {randomLoading
            ? "Generating..."
            : team.length > 0
              ? "Replace with random team"
              : "Generate random team"}
        </button>

        <button
          type="button"
          onClick={analyzeTeam}
          disabled={
            team.length === 0 ||
            analysisLoading ||
            randomLoading
          }
        >
          {analysisLoading ? "Analyzing..." : "Analyze team"}
        </button>
      </div>

      {randomLoading && (
        <p role="status">Finding six different Pokémon...</p>
      )}

      {randomError && <p role="alert">{randomError}</p>}

      {team.length === 0 && (
        <p>
          Add Pokémon from <Link to="/">Search</Link> or generate
          a random team to get started.
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
                      disabled={randomLoading}
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

      {analysisLoading && (
        <p role="status">Checking defensive type matchups...</p>
      )}

      {visibleAnalysisError && (
        <p role="alert">{visibleAnalysisError}</p>
      )}

      {visibleAnalysis && (
        <TeamAnalysis analysis={visibleAnalysis} />
      )}
    </section>
  );
}

export default TeamPage;