# ChessLink WebSocket Server

This server integrates the ChessLink hardware with the website to provide real-time chess game broadcasting. It acts as a bridge between physical chess hardware (connected via serial port) and the web interface, allowing for live game displays, real-time move updates, and multi-viewer spectating.

## Overview

The server uses both REST API and WebSocket protocols:

- **REST API** (HTTP): For managing games, listing available ports, etc.
- **WebSockets**: For real-time, bidirectional communication between the server and clients

## Architecture

```
Physical Hardware ↔ Serial Connection ↔ Local Server (This App) ↔ WebSockets ↔ Web Browsers
```

1. **Hardware Connection**: The physical ChessLink board connects to your computer via USB/Serial
2. **Local Server**: This Python application reads data from the hardware and manages game state
3. **WebSockets**: Provides real-time connectivity to the web interface
4. **Browser Clients**: Both the host controlling the broadcast and viewers watching the game

## Features

- Connect to and read from ChessLink hardware in real-time
- Start, manage, and end live game broadcasts
- Share live games with multiple spectators
- Store and retrieve game history with PGN notation
- Provide real-time position updates to all connected clients

## Requirements

- Python 3.7+
- ChessLink hardware (or compatible chess hardware)
- The packages listed in `requirements.txt`

## Setup

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Make sure your ChessLink hardware is connected to your computer.

3. Start the server:

```bash
python app.py
```

The server will run on `localhost:8765` by default.

## Integration with the Website

The ChessLink website (React application) connects to this server using WebSockets to:

1. Connect to the physical chess hardware
2. Broadcast live games
3. Provide real-time updates to spectators

### WebSocket Events from Client to Server

| Event | Description | Payload |
|-------|-------------|---------|
| `connect_hardware` | Connect to ChessLink hardware | `{ port: "COM1", baudRate: 115200 }` |
| `disconnect_hardware` | Disconnect from hardware | `{}` |
| `start_game` | Start broadcasting a game | `{ id: "game123", title: "My Game", white: "Player1", black: "Player2" }` |
| `end_game` | End a game broadcast | `{ gameId: "game123" }` |
| `get_live_games` | Get list of active games | `{}` |
| `get_game_state` | Get state of a specific game | `{ gameId: "game123" }` |

### WebSocket Events from Server to Client

| Event | Description | Payload |
|-------|-------------|---------|
| `hardware_status` | Hardware connection status | `{ status: "connected"/"disconnected", port: "COM1" }` |
| `hardware_connected` | Hardware connection success | `{ status: "connected", port: "COM1" }` |
| `hardware_disconnected` | Hardware disconnected | `{ status: "disconnected" }` |
| `game_started` | Game broadcast started | `{ gameId: "game123", initialPosition: "..." }` |
| `game_ended` | Game broadcast ended | `{ message: "Game ended" }` |
| `position` | Position update for a game | `{ type: "position", gameId: "game123", fen: "..." }` |
| `live_games_list` | List of active games | `{ type: "live_games_list", games: [...] }` |
| `error` | Error message | `{ message: "Error details" }` |

## Testing

### Running the WebSocket Test Client

To test the WebSocket server without hardware, use the provided test script:

```bash
# Run both host and spectator tests
python testWebSocket.py

# Run only host test
python testWebSocket.py host

# Run only spectator test
python testWebSocket.py spectator
```

### Running Unit Tests

To run the unit tests:

```bash
# Navigate to the server directory
cd server

# Create and activate a virtual environment (recommended)
python3 -m venv test_env
source test_env/bin/activate  # Use test_env\Scripts\activate on Windows

# Install dependencies (including test dependencies)
pip install -r requirements.txt
pip install requests websocket-client

# Run the main unit tests (testGetMove)
python runTests.py

# Run integration tests (requires a running server instance)
# First, start the test server in one terminal:
python test_socketio_server.py

# Then, in another terminal (in the same virtual environment):
python test_clean.py
python test_chesslink_client.py
python test_full_flow.py

# Deactivate the virtual environment when done
deactivate
```

## Troubleshooting

### Common Issues

1. **Serial Port Not Found**: Make sure the ChessLink hardware is properly connected and the correct port is selected.

2. **WebSocket Connection Failed**: Ensure the server is running on port 8765 and there are no firewall issues.

3. **Position Updates Not Working**: Check the serial connection and make sure the hardware is sending valid FEN strings.

## License

This project is part of the ChessLink platform, available under the terms of the MIT License.

## Acknowledgments

- Thanks to the `pyserial` library for serial port communication
- Thanks to `flask-socketio` for WebSocket integration
- Thanks to the python-chess library for chess move validation and PGN handling 