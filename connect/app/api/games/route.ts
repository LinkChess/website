import { NextResponse } from "next/server";

let store: Array<{ id: number; name: string; status: string }> = [
  { id: 1, name: "Game 1", status: "Active" },
  { id: 2, name: "Game 2", status: "Completed" },
];

export async function GET() {
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const game = await request.json();
  store.push({ ...game, id: store.length + 1 });
  console.log("Incoming game data:", game);
  return NextResponse.json({ message: "Game data received successfully" });
}