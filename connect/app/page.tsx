"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface Game {
  id: number;
  name: string;
  status: string;
}

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch("/api/games");
        if (!response.ok) throw new Error("Failed to fetch games");
        setGames(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    };
    fetchGames();
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-2xl font-bold">Game Visualizer</h1>
        {error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <ul className="w-full max-w-2xl list-disc list-inside">
            {games.length > 0
              ? games.map(game => (
                  <li key={game.id} className="p-2 border-b">
                    <strong>{game.name}</strong> – {game.status}
                  </li>
                ))
              : <p>No games available.</p>
            }
          </ul>
        )}
      </main>
    </div>
  );
}
