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
```
$ npm install
$ export TARGET_PATH_APPS=$USERPROFILE/bin
$ npm run tauri dev
```

## TODO
- [] Manage Double Click, revue select
- [] UI: Focus on search, if one entry, launch it
- [] UI: Add keyboard shortcuts
- [] UI: Filter Favorites change to icon
- [] UI: Filter Production change to icon
- [] UI: Filter Production change to icon
- [] Install: add shortcut on lnk
- [] Install: add shortcut in Start Menu
- [] Launch PM: if not started by .bat => EXIT
- [] Launch SelectedApp: if urlVersion.lock => WAIT
- [] Launch SelectedApp: if urlVersion not accessible, alert + launch local version if any
