<p align="center">
  <img src="https://img.shields.io/badge/Stream_Deck-Hub-6366f1?style=for-the-badge&logo=elgato&logoColor=white" alt="Stream Deck Hub">
</p>

<h1 align="center">Stream Deck Hub</h1>

<p align="center">
  <strong>Ein modernes webbasiertes Kontrollzentrum für Elgato Stream Deck Geräte</strong>
</p>

<p align="center">
  <a href="#funktionen">Funktionen</a> •
  <a href="#installation">Installation</a> •
  <a href="#konfiguration">Konfiguration</a> •
  <a href="#verwendung">Verwendung</a> •
  <a href="#api">API</a> •
  <a href="#mitwirken">Mitwirken</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square" alt="Lizenz">
</p>

<p align="center">
  <a href="./README.md">English</a> |
  <a href="./README.de.md">Deutsch</a>
</p>

---

## Überblick

Stream Deck Hub bietet eine einheitliche Plattform zur Verwaltung mehrerer Stream Deck Geräte mit anpassbaren Button-Profilen, Automatisierungsaktionen und Echtzeit-Synchronisation. Steuere dein Smart Home, Streaming-Setup, Medienwiedergabe und mehr - alles über eine moderne Weboberfläche.

<p align="center">
  <img src="docs/images/screenshot-dashboard.png" alt="Dashboard Screenshot" width="800">
  <br>
  <em>Dashboard mit verbundenen Geräten und Schnellaktionen</em>
</p>

---

## Funktionen

<table>
<tr>
<td width="50%">

### Geräteverwaltung
- Multi-Geräte-Unterstützung
- Echtzeit-Verbindungsüberwachung
- Geräteidentifikation (Blinken)
- Helligkeitssteuerung

### Profilsystem
- Mehrseitige Profile
- Ordner-Navigation
- Import/Export von Profilen
- Profil-Themes

</td>
<td width="50%">

### Button-Konfiguration
- Eigene Icons & Beschriftungen
- Hintergrundfarben
- Toggle-Buttons (An/Aus-Zustände)
- Animationen (Pulsieren, Blinken, Leuchten, etc.)

### Dynamische Anzeigen
- Uhrzeit/Datum
- Systeminfo (CPU, RAM, Festplatte)
- Zähler & Timer
- Medienwiedergabe-Info

</td>
</tr>
</table>

### Integrationen

| Integration | Funktionen |
|-------------|------------|
| **Home Assistant** | Steuerung von Lichtern, Schaltern, Szenen und beliebigen Entitäten |
| **Spotify** | Abspielen, Pause, Überspringen, Lautstärke, Shuffle, Wiederholen |
| **Sonos** | Lautsprechersteuerung, Gruppierung, Lautstärke |
| **Discord** | Webhooks, Bot-Nachrichten |
| **Twitch** | Clips, Marker, Chat, Werbung, Stream-Info |
| **System** | Shell-Skripte, HTTP-Anfragen, Hotkeys, Wake-on-LAN |

---

## Architektur

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
│  │  REST API   │  │  WebSocket  │  │   Geräte-   │        │
│  │  Endpunkte  │  │   Server    │  │   Service   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                    ┌─────────────┐                         │
│                    │   SQLite    │                         │
│                    │  Datenbank  │                         │
│                    └─────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Stream Deck Hardware (USB/HID)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Voraussetzungen

| Komponente | Anforderung |
|------------|-------------|
| **Python** | 3.9 oder höher |
| **Node.js** | 18+ oder Bun |
| **Betriebssystem** | Linux (empfohlen), macOS |
| **Bibliotheken** | libusb, hidapi |

---

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/yourusername/streamdeck-hub.git
cd streamdeck-hub
```

### 2. Linux: udev-Regeln einrichten

> **Hinweis:** Dieser Schritt ist erforderlich für den Zugriff auf Stream Deck Geräte ohne Root-Rechte.

```bash
sudo cp 50-streamdeck.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
sudo udevadm trigger
```

Trenne das Stream Deck nach diesem Schritt kurz vom USB und verbinde es erneut.

### 3. Backend einrichten

```bash
cd backend

# Virtuelle Umgebung erstellen
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Abhängigkeiten installieren
pip install -r requirements.txt
```

### 4. Frontend einrichten

```bash
cd frontend

# Mit Bun (empfohlen)
bun install

# Oder mit npm
npm install
```

### 5. Assets (Optional)

```bash
mkdir -p Assets/fonts Assets/images
# Eigene Schriftarten (.ttf) und Bilder (.png) hinzufügen
```

---

## Verwendung

### Backend starten

```bash
cd backend
source venv/bin/activate
python run.py
```

> Backend läuft auf `http://localhost:8000`

### Frontend starten

```bash
cd frontend
bun run dev    # oder: npm run dev
```

> Frontend läuft auf `http://localhost:5173`

### Anwendung öffnen

Navigiere zu **http://localhost:5173** in deinem Browser.

---

## Konfiguration

### Umgebungsvariablen

Erstelle `backend/.env`:

```env
# Datenbank
DATABASE_URL=sqlite:///./streamdeck_hub.db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Home Assistant (optional)
HOMEASSISTANT_URL=http://dein-homeassistant:8123
HOMEASSISTANT_TOKEN=dein_langlebiger_zugriffstoken
```

<details>
<summary><strong>Home Assistant Einrichtung</strong></summary>

1. Gehe zu **Profil → Sicherheit → Langlebige Zugriffstoken**
2. Erstelle einen neuen Token
3. Füge URL und Token zur `.env` hinzu oder konfiguriere über die Einstellungsseite

</details>

<details>
<summary><strong>Spotify Einrichtung</strong></summary>

1. Erstelle eine App im [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Füge Redirect-URI hinzu: `http://localhost:8000/api/media/spotify/callback`
3. Konfiguriere Client ID und Secret auf der Einstellungsseite

</details>

<details>
<summary><strong>Twitch Einrichtung</strong></summary>

1. Erstelle eine App in der [Twitch Developer Console](https://dev.twitch.tv/console)
2. Konfiguriere OAuth-Einstellungen
3. Richte Anmeldedaten auf der Einstellungsseite ein

</details>

---

## API

Interaktive API-Dokumentation verfügbar unter:

| Dokumentation | URL |
|---------------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |

---

## Projektstruktur

```
streamdeck-hub/
├── backend/
│   ├── app/
│   │   ├── models/          # Datenbankmodelle
│   │   ├── routers/         # API-Endpunkte
│   │   ├── schemas/         # Pydantic-Schemas
│   │   ├── services/        # Geschäftslogik
│   │   └── utils/           # Hilfsfunktionen
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/      # React-Komponenten
│   │   ├── hooks/           # Custom Hooks
│   │   ├── pages/           # Seitenkomponenten
│   │   ├── services/        # API-Client
│   │   └── store/           # Zustandsverwaltung
│   └── package.json
├── Assets/                  # Schriftarten & Bilder
└── 50-streamdeck.rules      # Linux udev-Regeln
```

---

## Fehlerbehebung

<details>
<summary><strong>Stream Deck wird nicht erkannt</strong></summary>

1. USB-Verbindung überprüfen
2. Überprüfen, ob udev-Regeln installiert sind (Linux)
3. Sicherstellen, dass der Benutzer in der Gruppe `plugdev` ist
4. Versuchen, als Root auszuführen, um Berechtigungen zu überprüfen

</details>

<details>
<summary><strong>WebSocket-Verbindung schlägt fehl</strong></summary>

1. CORS-Einstellungen im Backend überprüfen
2. Überprüfen, ob die Firewall die Ports 8000 und 5173 zulässt
3. Reverse-Proxy WebSocket-Konfiguration überprüfen

</details>

<details>
<summary><strong>Aktionen werden nicht ausgeführt</strong></summary>

1. Aktionskonfiguration überprüfen
2. Service-Anmeldedaten/Token überprüfen
3. Backend-Logs auf Fehler überprüfen

</details>

---

## Mitwirken

Beiträge sind willkommen! Erstelle gerne einen Pull Request.

1. Repository forken
2. Feature-Branch erstellen: `git checkout -b feature/tolles-feature`
3. Änderungen committen: `git commit -m 'Tolles Feature hinzufügen'`
4. Branch pushen: `git push origin feature/tolles-feature`
5. Pull Request öffnen

---

## Lizenz

Dieses Projekt ist unter der **MIT-Lizenz** lizenziert - siehe die [LICENSE](LICENSE) Datei für Details.

---

## Danksagungen

- [Elgato](https://www.elgato.com/) für die Stream Deck Hardware
- [python-elgato-streamdeck](https://github.com/abcminiuser/python-elgato-streamdeck) für die Python-Bibliothek
- Alle Mitwirkenden und Open-Source-Bibliotheken

---

<p align="center">
  Mit ❤️ für die Stream Deck Community erstellt
</p>
