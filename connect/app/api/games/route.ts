import { NextResponse } from "next/server";

interface ChessGame {
  id: number;
  name: string;
  pgn: string;
}

let store: ChessGame[] = [
  { id: 1, name: "Sample Game", pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6" },
];

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const { name, pgn } = await request.json();
  const game: ChessGame = {
    id: store.length + 1,
    name,
    pgn,
  };
  store.push(game);
  return NextResponse.json(game);
}