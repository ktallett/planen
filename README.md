# Planen - Gantt Chart Creator

A lightweight, open-source Gantt chart creator for planning projects with tasks and subtasks. Works as a web app or desktop application on Linux, Mac, and Windows.

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)

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

- **Local-first**: All data is stored in your browser's IndexedDB
- **Persistent**: Data survives browser restarts and computer reboots
- **Private**: Data never leaves your computer (unless you enable optional Supabase sync)
- **Backup**: Export to JSON regularly for backups

## Optional Cloud Sync (Advanced)

To enable cloud sync with Supabase:

1. Create a free Supabase project at https://supabase.com
2. Copy `.env.example` to `.env`
3. Add your Supabase URL and anon key
4. Set up database schema (see `src/lib/supabase.js` for table structure)

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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📖 Click the **?** button in the app for help
- 🐛 [Report bugs](https://github.com/yourusername/planen/issues)
- 💡 [Request features](https://github.com/yourusername/planen/issues)

## Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tauri](https://tauri.app/)
- [Frappe Gantt](https://github.com/frappe/gantt)
- [Dexie.js](https://dexie.org/)
