# App Marketplace

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) with extensions:
  - [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 
  - [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) 
  - [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Commands
- `npm install`: install dependencies
- `npm run tauri dev`: launch app in debug mode
- `npm run tauri build`: build app build mode

## Test
```sh
npm install
export APPS_PATH="$HOME/bin"
export APPS_URL="apps.json"
npm run tauri dev
```

## TODO
- FIXME:
  - [ ] Kill process when abort installation
  - [ ] Certificate validation

Enhancements:
- UI: 
  - [ ] Manage scroll
  - [ ] Manage double-click ?
  - [ ] Add keyboard shortcuts (up and down, launch app, opend docu + help menu)
  - [ ] Filter Favorites: change to icon
  - [ ] Filter Production: change to icon
- BizApp Installation:
  - [ ] Add keyboard shortcut on links
- App Installation:
  - [ ] Launch SelectedApp: if urlVersion.lock => WAIT
