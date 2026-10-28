import { useState } from "react";
import {
  BrowserRouter,
  NavLink,
  Route,
  Routes,
} from "react-router";

import SearchPage from "./pages/SearchPage";
import TeamPage from "./pages/TeamPage";
import PokemonDetailModal from "./components/PokemonDetailModal";
import "./App.css";

function App() {
  const [team, setTeam] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  function addToTeam(pokemon) {
    if (team.some((member) => member.id === pokemon.id)) {
      setMessage(`${pokemon.name} is already on your team.`);
      return;
    }

    if (team.length >= 6) {
      setMessage("Your team is full. Remove a member first.");
      return;
    }

    setTeam((currentTeam) => [...currentTeam, pokemon]);
    setMessage(`${pokemon.name} was added to your team!`);
  }

  function removeFromTeam(pokemonId) {
    setTeam((currentTeam) =>
      currentTeam.filter((member) => member.id !== pokemonId)
    );

    setMessage("Pokémon removed from your team.");
  }

  function replaceTeam(newTeam) {
    setTeam(newTeam);
    setMessage("Your random team is ready!");
  }

  return (
    <BrowserRouter>
      <main className="app">
        <h1>Pokémon Team Builder</h1>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            Search
          </NavLink>

          <NavLink to="/team">
            My team ({team.length}/6)
          </NavLink>
        </nav>

        <p className="team-message" role="status">
          {message}
        </p>

        <Routes>
          <Route
            path="/"
            element={
              <SearchPage
                onAddToTeam={addToTeam}
                onViewDetails={setSelectedPokemon}
              />
            }
          />

          <Route
            path="/team"
            element={
              <TeamPage
                team={team}
                onRemoveFromTeam={removeFromTeam}
                onViewDetails={setSelectedPokemon}
                onReplaceTeam={replaceTeam}
              />
            }
          />

          <Route path="*" element={<h2>Page not found</h2>} />
        </Routes>

        {selectedPokemon && (
          <PokemonDetailModal
            pokemon={selectedPokemon}
            onClose={() => setSelectedPokemon(null)}
          />
        )}
      </main>
    </BrowserRouter>
  );
}

export default App;