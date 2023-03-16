// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn get_target_path() -> String {
    let path = match env::var_os("TARGET_PATH_APPS") {
        Some(v) => v.into_string().unwrap(),
        None => panic!("$TARGET_PATH_APPS is not set")
    };
    return path.to_string();
}

use std::env;
fn main() {
    if env::var("TARGET_PATH_APPS").is_err() {
        panic!("Missing TARGET_PATH_APPS: path to apps folder installation, use icon in Start Menu to launch this application");
    }
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_target_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
