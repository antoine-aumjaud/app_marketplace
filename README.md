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
export APPS_PATH="$USERPROFILE/bin"
export APPS_URL="apps.json"
npm run tauri dev
```

## TODO
- [ ] Manage Double Click, revue select
- [ ] UI: Add keyboard shortcuts
- [ ] UI: Filter Favorites change to icon
- [ ] UI: Filter Production change to icon
- [ ] UI: Filter Production change to icon
- [ ] Install: add shortcut on links
- [ ] Launch SelectedApp: if urlVersion.lock => WAIT
