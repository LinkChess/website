# ChessLink Project Documentation

Welcome to the documentation for the ChessLink project!

ChessLink is a smart hardware chess interface designed to bridge the gap between physical chess play and the digital world. It uses custom sensor arrays on a physical board to detect moves in real-time and synchronizes them with a web application for analysis, training, and connected play.

## Project Components

This project consists of several key parts:

*   **Hardware:** The physical chessboard with embedded sensors (phototransistors and LEDs), RGB LEDs, and microcontrollers (4 Arduino Nanos).
*   **Backend Server:** A Python application that communicates with the hardware via serial port, processes chess moves, validates them, manages game state, and saves games to a local database.
*   **Frontend:** A NextJS web application that renders local games on the local pc for debugging and demoing.
*   **Database:** A SQLite database (`server/chess_games.db`) used by the backend to store game history and metadata.
*   **Public Website:** A Vite + React web application built with TypeScript and Tailwind CSS that provides the user interface for viewing game state, playing games, accessing demos, and managing settings.


Navigate through the documentation sections to learn more about each component, how to set up the system, and how to contribute.

*(Note: This documentation supports [Mermaid](https://mermaid.js.org/) syntax for diagrams and flowcharts. You'll see examples in the Hardware and Software sections.)* 