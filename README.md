# ChessLink - Smart Hardware Chess Interface

**ChessLink** is a smart chess interface that bridges physical chess with digital capabilities. The hardware-focused system uses custom sensor arrays to detect moves on a physical board and synchronize them with a digital platform for analysis, training, and connected play. This repository contains the project's documentation website and related source code.

---

## Table of Contents

1. [Hardware Architecture](#hardware-architecture)
2. [System Overview](#system-overview)
3. [Features](#features)
4. [Software Components](#software-components)
5. [Development Status](#development-status)
6. [Installation](#installation)
7. [Usage (Website Development)](#usage-website-development)
8. [Configuration](#configuration)
9. [Contributing](#contributing)
10. [License](#license)

---

## Hardware Architecture

### Core Hardware Components

- **Sensor Array**: 64-square (8×8) matrix of phototransistors and LEDs that detect chess pieces through light interruption, 64-square (8×8) matrix of RGB LEDs for visual feedback and move guidance.
- **LED System**: RGB LEDs integrated into each square for visual feedback and move guidance
- **Microcontroller Unit**: 4-custom PCBs each equipped with Arduino microcontrollers communicating through UART
- **PCB Design**: Custom multi-layer PCB (currently in development) integrating all electronic components
- **Power System**: 5V system with regulated power distribution for sensors, LEDs, and microcontrollers
- **I/O Interface**: Serial/USB connection to host application, with Bluetooth/WiFi capabilities

*(For more details, see the Hardware section in the documentation.)*

*(Sections on PCB Development, Sensor Technology, Physical Dimensions, and Circuit Design have been moved to the main documentation site.)*

---

## System Overview

ChessLink creates a seamless connection between physical chess play and digital analysis by:

1. **Detecting physical moves** through the sensor array
2. **Validating moves** against chess rules
3. **Providing feedback** through LEDs and sound
4. **Synchronizing** with the web application/documentation site
5. **Enabling analysis** and training features (via connected software)

The system is designed for:
- Chess enthusiasts wanting physical play with digital benefits
- Beginners learning through interactive guidance
- Events and streamers needing real-time digital tracking

---

## Features

- **Real-Time Move Detection**: Automatically captures piece movements and positions
- **Visual Guidance**: LED system highlights valid moves, checks, and training suggestions
- **Audio Feedback**: Sound effects and spoken move announcements
- **Training Mode**: Receive move suggestions and error notifications
- **Analysis Integration**: Connect with chess engines for post-game analysis
- **Game Recording**: Automatically stores game history for review
- **Accessibility Features**: Audio announcements and high-contrast visual cues

*(Detailed feature descriptions and usage can be found in the documentation.)*

---

## Software Components

The software stack complements the hardware system:

1. **Firmware**: Arduino code handling sensor data and LED control
2. **Web Application / Documentation Site**: This Docusaurus-based site providing project information, visualization, and guides.
3. **API Layer**: Connects hardware with software systems
4. **Optional Server**: For online play and advanced features

See the [Software Documentation](/docs/category/software) section of this site for detailed information.

---

## Development Status

**Current Status: Hardware Prototype Phase**

- ✅ Hardware architecture designed
- ✅ Sensor and LED testing completed
- ✅ Software interface working
- ✅ PCB design in progress
- ✅ Final component selection being evaluated
- ✅ 4×4 prototype board operational
- 🔄 Full 8×8 board assembly
- 🔄 Case design and manufacturing

*(Track progress and details in the Development section of the documentation.)*

---

## Installation

1.  **Clone the Repository**
    ```bash
    # Replace <repository-url> with the actual URL of this repository
    git clone <repository-url> website
    cd website
    ```

2.  **Install Dependencies**
    Using npm:
    ```bash
    npm install
    ```
    Or using Yarn:
    ```bash
    yarn install
    ```

*(For hardware setup and firmware installation, please refer to the Hardware Setup Guide in the documentation.)*

---

## Usage (Website Development)

1.  **Start the Development Server**
    Using npm:
    ```bash
    npm run start
    ```
    Or using Yarn:
    ```bash
    yarn start
    ```
    This command starts a local development server for the Docusaurus website and opens up a browser window (usually at `http://localhost:3000`). Most documentation changes are reflected live.

*(For instructions on using the actual ChessLink hardware and associated applications, see the Usage Guides in the documentation.)*

---

## Configuration

- **Website Configuration**: The main Docusaurus site configuration is in `docusaurus.config.ts`.
- **Project Configuration**: Details for configuring firmware, environment variables for related applications, etc., can be found in the relevant documentation sections.

---

## Contributing

We welcome contributions! Please follow standard Git practices (fork, branch, commit, pull request).

1.  **Fork the Repository**
2.  **Create a Feature Branch**: `git checkout -b feature/your-feature`
3.  **Commit Your Changes**: `git commit -m 'Add some feature'`
4.  **Push to Branch**: `git push origin feature/your-feature`
5.  **Open a Pull Request**

*(See [CONTRIBUTING.md](CONTRIBUTING.md) if available for more detailed guidelines.)*

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.
