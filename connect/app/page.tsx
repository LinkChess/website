"use client";

import { useState, useEffect, FormEvent } from "react";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false }
);

interface ChessGame {
  id: number;
  name: string;
  pgn: string;
}

export default function Home() {
  const [games, setGames] = useState<ChessGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [pgn, setPgn] = useState("");

  useEffect(() => {
    fetch("/api/games")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(setGames)
      .catch((err) => setError(err.message));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pgn }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      const newGame = await res.json();
      setGames((prev) => [...prev, newGame]);
      setName("");
      setPgn("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Chess Game Visualizer</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Game name"
          className="border p-2"
          required
        />
        <textarea
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder="PGN text"
          rows={5}
          className="border p-2"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2">
          Add Game
        </button>
      </form>

      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((game) => {
          // compute last position from PGN
          const chess = new Chess();
          chess.loadPgn(game.pgn);
          const fen = chess.fen();
          return (
            <div key={game.id} className="border p-4">
              <h2 className="font-bold mb-2">{game.name}</h2>
              <Chessboard position={fen} />
              <pre className="mt-2 bg-gray-100 p-2 overflow-auto">
                {game.pgn}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
