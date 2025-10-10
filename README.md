# planen

**A lightweight, open-source Gantt chart creator that works everywhere.**

Plan projects with visual timelines, customizable tasks, and automatic scheduling. No cloud required - your data stays on your device. Available as a web app or native desktop application for Linux, Mac, and Windows.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)

---

## Features

- 📊 Create Gantt charts with tasks and subtasks
- 🎨 Customizable colors with automatic text contrast
- 📅 Multiple view modes (Quarter Day, Half Day, Day, Week, Month)
- 💾 Auto-save to local storage (survives browser restarts)
- 📤 Export to PNG, PDF, SVG, and JSON
- 📥 Import JSON files to continue editing
- 🔒 Lock/unlock editing to prevent accidental changes
- 🖥️ Desktop apps for Linux, Mac, and Windows (~3-5MB)
- 🌐 Works offline - no internet required
- 🔄 Automatic update notifications for web and desktop apps

## Web App

Try it online: **[planen.app](#)** *(add your deployment URL here)*

## Installation

### Prerequisites

For desktop builds, you need:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Rust](https://rustup.rs/) (for Tauri desktop apps)

### Linux

```bash
# Install dependencies
npm install

# Run development version
npm run tauri:dev

# Build production version (creates .deb and .AppImage in src-tauri/target/release/bundle/)
npm run tauri:build
```

**Debian/Ubuntu:** Install the `.deb` package:
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/planen_*.deb
```

**AppImage:** Make executable and run:
```bash
chmod +x planen_*.AppImage
./planen_*.AppImage
```

### macOS

```bash
# Install dependencies
npm install

# Run development version
npm run tauri:dev

# Build production version (creates .dmg and .app in src-tauri/target/release/bundle/)
npm run tauri:build
```

Open the `.dmg` file and drag Planen to your Applications folder.

### Windows

```bash
# Install dependencies
npm install

# Run development version
npm run tauri:dev

# Build production version (creates .msi and .exe in src-tauri\target\release\bundle\)
npm run tauri:build
```

Run the `.msi` installer or use the `.exe` portable version.

## Usage

### Getting Started

1. **Unlock the chart** - Click the 🔒 lock button to enable editing
2. **Add tasks** - Click "Add Task" to create a new task
3. **Edit tasks** - Click any task bar to edit name, dates, color, and add subtasks
4. **Add subtasks** - In the task editor, add subtasks with their own dates and colors
5. **Change view** - Use the "View" dropdown to adjust the time scale
6. **Export** - Click "Import/Export" to save as PNG, PDF, SVG, or JSON

### Tips

- **Sequential tasks**: New tasks automatically start the day after the previous task ends
- **Sequential subtasks**: First subtask starts at task start date; subsequent ones start after the previous ends
- **Edit subtasks**: Click on subtask colors, names, dates, or descriptions to edit them inline
- **Auto-save**: All changes are automatically saved to your browser's local storage
- **Import/Export**: Use JSON export for backups and sharing; import to resume work

### Keyboard Shortcuts

- **Enter** - Save when editing project title
- **Escape** - Cancel when editing project title

## Data Storage

- **Backup**: Export to JSON regularly for backups


## Auto-Updates

Planen includes automatic update checking:

- **Web App**: Checks for updates hourly and shows a notification when a new version is available
- **Desktop App**: Checks for updates on startup and can auto-install with one click

For setup instructions, see [AUTO_UPDATE_SETUP.md](AUTO_UPDATE_SETUP.md)

## Development

### Web Development

```bash
npm install
npm run dev
```

Visit http://localhost:1420

### Tech Stack

- **Frontend**: React + Vite
- **Gantt Rendering**: Frappe Gantt
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **Desktop**: Tauri 2.0 (Rust-based)
- **Exports**: html2canvas + jsPDF

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### What this means:

- ✅ You can use this software for any purpose
- ✅ You can modify and distribute modified versions
- ✅ You can distribute copies
- ⚠️ You must include the license and copyright notice
- ⚠️ You must disclose the source code of modified versions
- ⚠️ Modified versions must also be licensed under GPL-3.0

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Support

- 📖 Click the **?** button in the app for help


## Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tauri](https://tauri.app/)
- [Frappe Gantt](https://github.com/frappe/gantt)
- [Dexie.js](https://dexie.org/)
