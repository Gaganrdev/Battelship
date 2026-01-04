# 🎮 Battleship LAN Multiplayer Setup Guide

## Prerequisites
- Both players must be on the **same WiFi network**
- One device will act as the **Host** (runs the WebSocket server)
- Other device(s) will be **Clients** (join the host's game)

## Step-by-Step Setup

### 1. Start the WebSocket Server (Host's Computer)

On the computer that will host the game:

```bash
cd /Users/gaganr/code/Battelship
npm run ws-server
```

The server will display your **Local IP Address** (e.g., `192.168.1.100`). **Write this down!**

```
=================================
🎮 Battleship Game Server Running
=================================
Local IP: 192.168.1.100
Port: 8080

Host should use this IP in the app
Players on the same WiFi should enter: 192.168.1.100
=================================
```

**Important:** Keep this terminal running during the game!

### 2. Configure Your Firewall (If Needed)

#### macOS:
```bash
# Allow port 8080
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add $(which node)
```

#### Windows:
- Go to: Control Panel → Windows Defender Firewall → Advanced Settings
- Add Inbound Rule for Port 8080 (TCP)

#### Linux:
```bash
sudo ufw allow 8080/tcp
```

### 3. Install the APK on Both Android Phones

Transfer the APK file to both phones and install it.

### 4. Connect Both Players

#### Player 1 (Host):
1. Open the Battleship app
2. Tap **"Host Game"**
3. Wait for "Connected" indicator (green dot)

#### Player 2 (Joining):
1. Open the Battleship app
2. Enter the Host's IP address (e.g., `192.168.1.100`)
3. Tap **"Join Game"**
4. Wait for "Connected" indicator (green dot)

### 5. Play the Game

1. Both players place their 5 ships by tapping cells
   - Tap a ship to toggle orientation (horizontal/vertical)
   - Drag and drop ships to reposition them
2. After placing all ships, you'll see "You: Ready"
3. When both show "Ready", the host goes first
4. Tap opponent's board to attack
5. If you hit, you get another turn!

## Troubleshooting

### "Disconnected" - Can't Connect

**Check:**
1. Both phones on same WiFi? (Go to WiFi settings)
2. Server running? (Check terminal shows "Server Running")
3. Correct IP entered? (Must match server's IP exactly)
4. Firewall blocking? (Try disabling temporarily)

**Test Server:**
```bash
# On host computer, test if server is reachable
lsof -i :8080
# Should show "node" listening
```

### Ships Disappearing After Dragging

This is now fixed! Make sure you're using the latest build. If issue persists:
- Try tapping to place ships instead of dragging
- Restart the app

### "Opponent: Not Ready" Even After Friend Places Ships

This was a connection issue. With the new build:
- Green dot = Connected (ready messages will sync)
- Red dot = Disconnected (no communication)

If red dot:
1. Both quit to home screen
2. Host restarts server
3. Both reconnect

### Finding Your IP Address

#### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### Windows:
```bash
ipconfig | findstr IPv4
```

Look for address like `192.168.x.x` or `10.0.x.x`

## Network Requirements

- **Same WiFi**: Both devices must be on the same network
- **Port 8080**: Must be open and not blocked
- **No VPN**: VPNs can interfere with local network connections
- **No Mobile Data**: WiFi only for LAN play

## Tips

- Host's computer must stay on with server running
- Use a stable WiFi connection (not public WiFi with isolation)
- If playing at home, use your home WiFi network
- Keep the server terminal visible to monitor connections

## Advanced: Using a Different Computer for Server

You can run the server on any computer on the network:

1. Copy the `server/ws-server.js` file
2. Install Node.js on that computer
3. Install ws package: `npm install ws`
4. Run: `node ws-server.js`
5. Both players enter that computer's IP address

---

**Enjoy your LAN Battleship game! 🚢⚓️**
