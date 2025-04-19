# ChessLink Hardware and Simulation Architecture

This document describes the architecture of the ChessLink system and its simulation components. The ChessLink is primarily a **physical chess board with embedded sensors** that transmit real-time data to a web application, with simulation modes provided for development and testing purposes.

## Primary System Overview

The ChessLink's core purpose is to create a bridge between physical chess play and digital analysis:

1. **Physical Chess Board**: The hardware centerpiece with embedded sensors that detect piece movements
2. **Sensor Array**: 64-square matrix of Hall effect sensors and phototransistors that detect magnetic chess pieces
3. **LED System**: RGB LEDs in each square for visual feedback and move guidance
4. **Microcontroller**: ESP32-C3 with multiple ATtiny microcontrollers for sensor/LED management
5. **Web Application**: React-based frontend that displays the synchronized digital board
6. **Communication Layer**: Serial/USB or Wireless connections between hardware and software

## Physical Hardware Architecture

```mermaid
graph TB
    subgraph "Physical Hardware"
        BOARD[Physical Chess Board]
        SENS[Sensor Array]
        LED[LED Matrix]
        MCU[Arduino Nano ATmega328P microcontroller]
    end

    subgraph "Communication"
        SERIAL[Serial/USB]
        BT[Bluetooth/WiFi]
    end

    subgraph "Software"
        WEB[Web Application]
        CHESS[Chess Engine]
    end

    BOARD --> SENS
    SENS --> MCU
    MCU --> LED
    LED --> BOARD
    
    MCU --> SERIAL
    MCU --> BT
    SERIAL --> WEB
    BT --> WEB
    WEB --> CHESS

    classDef primary fill:#f9f,stroke:#333,stroke-width:2px
    classDef communication fill:#bbf,stroke:#333,stroke-width:1px
    classDef software fill:#bfb,stroke:#333,stroke-width:1px
    
    class BOARD,SENS,LED,MCU primary
    class SERIAL,BT communication
    class WEB,CHESS software
```

## Sensor System

The physical board uses two types of sensors to detect chess pieces:

1. **Hall Effect Sensors**: Detect the magnetic field from specially prepared chess pieces
2. **Phototransistors**: Measure light reflectance from the bottom of pieces for identification

These sensors are organized in an 8×8 matrix configuration and managed by multiple microcontrollers.

## Hardware Circuit Design

```
+-----------------+    +-----------------+    +-----------------+
| Sensor Module   |    | Arduino Nano (x16) |    | Arduino     |
| Phototransistor|====> Each Handles 2×2 |====> Main Controller |
| Hall Effect     |    | Grid Section     |    | (UART Master)   |
| IR Emitter      |    | UART to ESP32    |    |                 |
| RGB LEDs        |    | (4 ATtiny in P1) |    |                 |
+-----------------+    +-----------------+    +-----------------+
                                                             
                                               | USB/Bluetooth/WiFi
                                               v
                                        +-----------------+
                                        | Web Application |
                                        | Chess Display   |
                                        | Analysis Tools  |
                                        +-----------------+
```

## Simulation Architecture

For development and testing without physical hardware, the ChessLink system includes simulation components that emulate the physical board's behavior.

### Simulation Components

1. **PGN Files**: Source of chess games used to generate positions
2. **Emulation Layer**:
   - **WebSocket Emulator**: Sends chess positions to the web application via WebSocket
   - **Serial Emulator**: Sends chess positions through a serial port, mimicking the physical board
3. **Web Application**: Connects to either the physical hardware or simulation components

```mermaid
graph TB
    subgraph "Development Tools"
        PGN[PGN Files]
        WSE[WebSocket Emulator]
        SE[Serial Emulator]
    end

    subgraph "Client Layer"
        WA[Web Application]
        HW[Physical Hardware]
    end

    subgraph "Presentation Layer"
        CB[Chess Board Display]
    end

    PGN --> WSE
    PGN --> SE
    WSE --> WA
    SE --> HW
    WA --> CB
    HW --> CB

    classDef dev fill:#bbf,stroke:#333,stroke-width:1px
    classDef client fill:#bfb,stroke:#333,stroke-width:1px
    classDef presentation fill:#f9f,stroke:#333,stroke-width:2px
    
    class PGN,WSE,SE dev
    class WA,HW client
    class CB presentation
```

## Communication Flow

### Hardware Communication Flow

```mermaid
sequenceDiagram
    participant BOARD as Physical Board
    participant MCU as Microcontroller
    participant WA as Web Application
    participant UI as User Interface
    
    BOARD->>MCU: Piece movement detected
    MCU->>MCU: Process sensor data
    MCU->>WA: Send FEN position
    WA->>UI: Update board display
    UI->>MCU: User interaction
    MCU->>BOARD: Activate LEDs for guidance
```

### Simulation Communication Flow

```mermaid
sequenceDiagram
    participant PGN as PGN Files
    participant WS as WebSocket Emulator
    participant WA as Web Application
    participant CB as Chess Board
    
    WA->>WS: Connect(game=immortal)
    activate WS
    WS->>PGN: Load(immortal.pgn)
    PGN-->>WS: Game Data
    WS-->>WA: Game Info & Available Games
    loop For each position
        WS-->>WA: FEN Position
        WA->>CB: Update Board
        Note over WS: Wait (delay seconds)
    end
    deactivate WS
```

## Usage Modes

The ChessLink system supports multiple operating modes:

### Hardware Mode (Primary Use Case)
```mermaid
flowchart LR
    BOARD[Physical Board] -- Serial/USB/BT --> WA[Web App]
    WA --> DISPLAY[Chess Display]
```

### WebSocket Simulation Mode (Development Testing)
```mermaid
flowchart LR
    PGN[PGN Files] --> WSE[WebSocket Emulator]
    WSE -- "ws://localhost:8765" --> WA[Web App]
    WA --> CB[Chess Board Display]
```

### Serial Simulation Mode (Hardware Interface Testing)
```mermaid
flowchart LR
    PGN[PGN Files] --> SE[Serial Emulator]
    SE -- "/dev/cu.usbserial" --> HW[Hardware Interface]
    HW --> CB[Board Visualization]
```

## Benefits of the Architecture

1. **Real Physical Interaction**: Play chess on a tangible board with automatic digital synchronization
2. **Visual Guidance**: LED system highlights valid moves, checks, and training suggestions
3. **Development Flexibility**: Simulation modes allow development without physical hardware
4. **Multiple Testing Paths**: Test both hardware interfaces and software components separately
5. **Standardized Communication**: Uses FEN notation for consistent data interchange

## Technical Details

### Firmware and Hardware
- ESP32/Arduino code handling sensor data processing and LED control
- Custom PCB integrating sensors, LEDs, and microcontrollers
- Communication via Serial port, Bluetooth, or WiFi

### Software Components
- React-based web application
- WebSocket and Serial APIs for real-time communication
- PGN parsers for chess game simulation

## Data Flow

```mermaid
graph TD
    subgraph "Physical Board"
        SENS[Sensors] --> MCU[Microcontroller]
        MCU --> LED[LED Feedback]
    end

    subgraph "Data Processing"
        MCU --> FEN[FEN Generation]
        PGN[PGN Files] --> PARSER[PGN Parser]
        PARSER --> FEN
    end

    subgraph "Distribution"
        FEN --> WSS[WebSocket]
        FEN --> SP[Serial Port]
    end

    subgraph "Web Application"
        WSS --> APP[React App]
        SP --> APP
        APP --> UI[Chess UI]
    end
    
    classDef hardware fill:#f96,stroke:#333
    classDef data fill:#9cf,stroke:#333
    classDef endpoint fill:#9f9,stroke:#333
    
    class SENS,MCU,LED hardware
    class PGN,FEN,PARSER data
    class APP,UI endpoint
``` 