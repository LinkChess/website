# ChessLink Project Documentation

Welcome to the documentation for the ChessLink project!

ChessLink is a smart hardware chess interface designed to bridge the gap between physical chess play and the digital world. It uses custom sensor arrays on a physical board to detect moves in real-time and synchronizes them with a web application for analysis, training, and connected play.

## Project Components

This project consists of several key parts:

*   **Hardware:** The physical chessboard with embedded sensors (Hall effect, phototransistors), RGB LEDs, and microcontrollers (ESP32-C3 master, ATtiny slaves).
*   **Backend Server:** A Python Flask application that communicates with the hardware via serial port, processes chess moves, validates them, manages game state, and saves games to a database.
*   **Frontend:** A Vite + React web application built with TypeScript and Tailwind CSS that provides the user interface for viewing game state, playing games, accessing demos, and managing settings.
*   **Database:** A SQLite database (`server/chess_games.db`) used by the backend to store game history and metadata.

Navigate through the documentation sections to learn more about each component, how to set up the system, and how to contribute. 