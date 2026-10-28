function AnalysisGroup({ title, counts }) {
  const entries = Object.entries(counts).sort(
    (first, second) =>
      second[1] - first[1] || first[0].localeCompare(second[0])
  );

  return (
    <section className="analysis-group">
      <h4>{title}</h4>

      {entries.length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {entries.map(([type, count]) => (
            <li key={type}>
              <span className="pokemon-name">{type}</span>
              <strong>
                {count} {count === 1 ? "member" : "members"}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TeamAnalysis({ analysis }) {
  return (
    <section className="team-analysis">
      <h3>Defensive type analysis</h3>

      <p>
        Counts show how many team members are weak, resistant,
        or immune to each incoming attack type.
        Abilities, moves, and items are not included.
      </p>

      <div className="analysis-grid">
        <AnalysisGroup
          title="Weak to"
          counts={analysis.weaknesses}
        />

        <AnalysisGroup
          title="Resists"
          counts={analysis.resistances}
        />

        <AnalysisGroup
          title="Immune to"
          counts={analysis.immunities}
        />
      </div>
    </section>
  );
}

export default TeamAnalysis;