<p align="center">
  <img src="https://img.shields.io/badge/Stream_Deck-Hub-6366f1?style=for-the-badge&logo=elgato&logoColor=white" alt="Stream Deck Hub">
</p>

<h1 align="center">Stream Deck Hub</h1>

<p align="center">
  <strong>A modern web-based control center for Elgato Stream Deck devices</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#usage">Usage</a> •
  <a href="#api">API</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README.de.md">Deutsch</a>
</p>

---

## Overview

Stream Deck Hub provides a unified platform to manage multiple Stream Deck devices with customizable button profiles, automation actions, and real-time synchronization. Control your smart home, streaming setup, media playback, and more - all from a beautiful web interface.

<p align="center">
  <img src="docs/images/screenshot-dashboard.png" alt="Dashboard Screenshot" width="800">
  <br>
  <em>Dashboard with connected devices and quick actions</em>
</p>

---

## Features

<table>
<tr>
<td width="50%">

### Device Management
- Multi-device support
- Real-time connection monitoring
- Device identification (flash)
- Brightness control

### Profile System
- Multi-page profiles
- Folder navigation
- Import/Export profiles
- Profile themes

</td>
<td width="50%">

### Button Configuration
- Custom icons & labels
- Background colors
- Toggle buttons (on/off states)
- Animations (pulse, flash, glow, etc.)

### Dynamic Displays
- Time/Date
- System info (CPU, RAM, Disk)
- Counters & Timers
- Media playback info

</td>
</tr>
</table>

### Integrations

| Integration | Features |
|-------------|----------|
| **Home Assistant** | Control lights, switches, scenes, and any entity |
| **Spotify** | Play, pause, skip, volume, shuffle, repeat |
| **Sonos** | Speaker control, grouping, volume |
| **Discord** | Webhooks, bot messages |
| **Twitch** | Clips, markers, chat, ads, stream info |
| **System** | Shell scripts, HTTP requests, hotkeys, Wake-on-LAN |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│                    http://localhost:5173                    │
└─────────────────────────────────────────────────────────────┘
                              ▼
                         WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                         │
│                   http://localhost:8000                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  REST API   │  │  WebSocket  │  │   Device    │        │
│  │  Endpoints  │  │   Server    │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                    ┌─────────────┐                         │
│                    │   SQLite    │                         │
│                    │   Database  │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Stream Deck Hardware (USB/HID)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Requirements

| Component | Requirement |
|-----------|-------------|
| **Python** | 3.9 or higher |
| **Node.js** | 18+ or Bun |
| **OS** | Linux (recommended), macOS |
| **Libraries** | libusb, hidapi |

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/streamdeck-hub.git
cd streamdeck-hub
```

### 2. Linux: Set up udev Rules

> **Note:** This step is required for non-root access to Stream Deck devices.

```bash
sudo cp 50-streamdeck.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Unplug and replug your Stream Deck after this step.

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Frontend Setup

```bash
cd frontend

# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 5. Assets (Optional)

```bash
mkdir -p Assets/fonts Assets/images
# Add custom fonts (.ttf) and images (.png)
```

---

## Usage

### Start Backend

```bash
cd backend
source venv/bin/activate
python run.py
```

> Backend runs on `http://localhost:8000`

### Start Frontend

```bash
cd frontend
bun run dev    # or: npm run dev
```

> Frontend runs on `http://localhost:5173`

### Open Application

Navigate to **http://localhost:5173** in your browser.

---

## Configuration

### Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./streamdeck_hub.db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Home Assistant (optional)
HOMEASSISTANT_URL=http://your-homeassistant:8123
HOMEASSISTANT_TOKEN=your_long_lived_access_token
```

<details>
<summary><strong>Home Assistant Setup</strong></summary>

1. Go to **Profile → Security → Long-Lived Access Tokens**
2. Create a new token
3. Add URL and token to `.env` or configure via Settings page

</details>

<details>
<summary><strong>Spotify Setup</strong></summary>

1. Create app at [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Add redirect URI: `http://localhost:8000/api/media/spotify/callback`
3. Configure Client ID and Secret in Settings page

</details>

<details>
<summary><strong>Twitch Setup</strong></summary>

1. Create app at [Twitch Developer Console](https://dev.twitch.tv/console)
2. Configure OAuth settings
3. Set up credentials in Settings page

</details>

---

## API

Interactive API documentation available at:

| Documentation | URL |
|---------------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |

---

## Project Structure

```
streamdeck-hub/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routers/         # API endpoints
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   └── store/           # State management
│   └── package.json
├── Assets/                  # Fonts & images
└── 50-streamdeck.rules      # Linux udev rules
```

---

## Troubleshooting

<details>
<summary><strong>Stream Deck not detected</strong></summary>

1. Check USB connection
2. Verify udev rules are installed (Linux)
3. Ensure user is in `plugdev` group
4. Try running as root to verify permissions

</details>

<details>
<summary><strong>WebSocket connection fails</strong></summary>

1. Check CORS settings in backend
2. Verify firewall allows ports 8000 and 5173
3. Check reverse proxy WebSocket configuration

</details>

<details>
<summary><strong>Actions not executing</strong></summary>

1. Verify action configuration
2. Check service credentials/tokens
3. Review backend logs for errors

</details>

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Elgato](https://www.elgato.com/) for Stream Deck hardware
- [python-elgato-streamdeck](https://github.com/abcminiuser/python-elgato-streamdeck) for the Python library
- All contributors and open-source libraries

---

<p align="center">
  Made with ❤️ for the Stream Deck community
</p>
