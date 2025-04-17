import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const games = await prisma.game.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const { name, pgn } = await request.json();
  if (!name || !pgn) {
    return NextResponse.json({ error: "Name and PGN required" }, { status: 400 });
  }
  const newGame = await prisma.game.create({
    data: { name, pgn },
  });
  return NextResponse.json(newGame, { status: 201 });
}