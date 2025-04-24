# ChessLink System Architecture

This document provides a comprehensive overview of the ChessLink system architecture, data flow, and testing procedures.

## System Overview

ChessLink is a system that connects physical chess hardware to a web application, allowing live broadcasting of chess games. The system consists of three main components:

1. **Chess Hardware** - Physical electronic chessboard that detects piece movements
2. **Backend Server** - Python Flask application with WebSocket support for real-time communication
3. **Web Frontend** - React application that displays live chess games

```mermaid
graph TD
    A[Chess Hardware] -->|Serial Connection| B[Backend Server]
    B -->|WebSocket| C[Web Frontend]
    C -->|User Interaction| D[End Users/Viewers]
    
    subgraph Hardware Layer
        A
    end
    
    subgraph Application Layer
        B
    end
    
    subgraph Presentation Layer
        C
        D
    end
```

## Detailed Architecture

```mermaid
graph TB
    Hardware[Chess Hardware] -->|FEN Strings via Serial| Server
    
    subgraph "Backend Server"
        Server[Flask + SocketIO Server] 
        Server -->|Read| Serial[Serial Connection Handler]
        Server -->|Store| DB[(SQLite Database)]
        Server -->|Emit Events| Socket[WebSocket Handler]
        Server -->|Process| Game[Chess Game Logic]
        Game -->|Analyze| MoveDetection[Move Detection]
        Game -->|Validate| Rules[Chess Rules Engine]
    end
    
    Socket -->|WebSocket Events| Frontend
    
    subgraph "Web Frontend"
        Frontend[React Application]
        Frontend -->|Display| Board[Chessboard Component]
        Frontend -->|List| Games[Game List Component]
        Frontend -->|Control| Controls[Game Controls]
    end
    
    Users[End Users] -->|View| Frontend
```

## Data Flow

```mermaid
sequenceDiagram
    participant H as Chess Hardware
    participant S as Backend Server
    participant DB as Database
    participant F as Web Frontend
    participant U as User
    
    Note over H,U: Game Setup Phase
    U->>F: Open Live Games Page
    F->>S: Connect (WebSocket)
    S->>F: Current Hardware Status
    U->>F: Connect to Hardware
    F->>S: connect_hardware request
    S->>H: Open Serial Connection
    H-->>S: Connection Established
    S->>F: hardware_connected event
    
    Note over H,U: Game Start Phase
    U->>F: Start New Game
    F->>S: start_game request
    S->>DB: Create/Load Game
    S->>F: game_started event
    S->>F: Broadcast new_game to all clients
    
    Note over H,U: Game Play Phase
    H->>S: FEN position data
    S->>S: Process position
    S->>S: Detect and validate moves
    S->>DB: Store move
    S->>F: position event (broadcast)
    F->>U: Update display
    
    Note over H,U: Game End Phase
    U->>F: End Game
    F->>S: end_game request
    S->>DB: Update game status
    S->>F: game_ended event
    U->>F: Disconnect Hardware
    F->>S: disconnect_hardware request
    S->>H: Close Serial Connection
    S->>F: hardware_disconnected event
```

## Component Descriptions

### 1. Hardware Layer

The hardware layer consists of an electronic chessboard that detects piece movements and transmits the board state to the server as FEN (Forsyth–Edwards Notation) strings via a serial connection.

```mermaid
classDiagram
    class ChessHardware {
        +SerialPort connection
        +DetectPieceMovement()
        +TransmitBoardState()
        +GenerateFEN()
    }
```

### 2. Backend Server

The backend is built with Flask and Flask-SocketIO, providing both REST API endpoints and WebSocket connections. It handles:
- Hardware connections via serial port
- Game state management
- Move detection and validation
- Data persistence
- Real-time communications

```mermaid
classDiagram
    class AppServer {
        +Flask app
        +SocketIO socketio
        +SerialConnection serial_connection
        +ChessGame active_game
        +HandleClientConnection()
        +ProcessPositionData()
        +BroadcastGameUpdates()
    }
    
    class ChessGame {
        +String game_id
        +Array~ChessMove~ master_state
        +Array~String~ processing_queue
        +String event
        +String white
        +String black
        +AddToQueue(fen)
        +ProcessQueue()
        +SaveToDB()
        +LoadFromDB(game_id)
    }
    
    class ChessMove {
        +String move_id
        +String fen
        +String player
        +DateTime timestamp
        +String algebraic
        +Boolean is_legal
    }
    
    AppServer --> ChessGame : manages
    ChessGame --> ChessMove : contains
```

### 3. Web Frontend

The React-based frontend provides a user interface for:
- Connecting to chess hardware
- Starting/managing live games
- Viewing game broadcasts
- Browsing historical games

```mermaid
classDiagram
    class WebFrontend {
        +WebSocket connection
        +ConnectToServer()
        +ConnectHardware()
        +StartGame()
        +ViewLiveGames()
    }
    
    class LivePage {
        +Boolean isConnected
        +Boolean isHostingGame
        +Array~Game~ liveGames
        +ConnectWebSocket()
        +StartHostingGame()
        +ViewLiveGame()
    }
    
    class GameViewer {
        +String gameId
        +String fen
        +Array~Move~ moves
        +LoadGame()
        +DisplayPosition()
    }
    
    WebFrontend --> LivePage : contains
    WebFrontend --> GameViewer : contains
```

## Testing the System

### Prerequisites

1. Python environment with required packages:
   - flask
   - flask-socketio
   - flask-cors
   - python-socketio
   - pyserial
   - chess
   - sqlalchemy

2. Node.js and npm for the React frontend

### Step 1: Start the Backend Server

```bash
# Navigate to the server directory
cd /path/to/website/server

# Create and activate virtual environment (if not already done)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

The server will start on `http://localhost:8765`.

### Step 2: Test the Server Without Hardware

You can test the server functionality without physical chess hardware using the mock hardware connection:

```bash
# Run the comprehensive test script
python test_full_flow.py
```

This script:
1. Connects to the server via WebSocket
2. Uses a simulated (mock) hardware connection
3. Starts a new chess game
4. Sends a series of chess positions to simulate game play
5. Verifies the server's responses

### Step 3: Start the Frontend

```bash
# Navigate to the website root directory
cd /path/to/website

# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Step 4: Testing with the Web Interface

1. Open your browser and navigate to `http://localhost:5173`
2. Go to the Live Games page
3. Click "Connect to ChessLink" to establish a WebSocket connection
4. If you have physical chess hardware:
   - Connect it to your computer
   - Click "Connect to Hardware" and select the appropriate port
5. If you don't have physical hardware:
   - Use the "MOCK" port in testing scripts
6. Once connected:
   - Configure game details (title, player names)
   - Click "Start Live Game"
7. The game will appear in the "Watch Games" tab
8. Click "Watch Game" to view the live broadcast

## Testing with Real Hardware

If you have physical ChessLink hardware:

1. Connect the hardware to your computer via USB
2. Start the server as described above
3. From the frontend, connect to the hardware by selecting the appropriate port
4. Start a game
5. Make moves on the physical board
6. Observe the moves being transmitted to the web interface in real-time

## Simulating Hardware for Testing

For development and testing without physical hardware:

1. Use the provided `test_full_flow.py` script which simulates hardware input
2. Modify the script to generate your own sequence of moves if desired
3. Use the 'MOCK' port when connecting from your own testing scripts

## Troubleshooting

### Common Issues:

1. **Server won't start**
   - Check if port 8765 is already in use
   - Verify all dependencies are installed

2. **Cannot connect to hardware**
   - Verify the hardware is properly connected
   - Check if the port is correct
   - Try a different USB port

3. **Moves not being detected**
   - Check the hardware connection
   - Verify the hardware is sending valid FEN strings
   - Check server logs for parsing errors

4. **WebSocket connection fails**
   - Verify the server is running
   - Check for CORS issues
   - Verify the correct WebSocket URL is being used

## System Limitations

1. Currently supports only one active game at a time
2. Requires continuous connection to hardware during game play
3. Limited validation of illegal moves
4. No authentication/authorization for game management

## Future Enhancements

1. Multiple simultaneous games
2. User authentication
3. More sophisticated move analysis
4. Mobile app support
5. Enhanced game statistics and analytics 