// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn get_app_file_version(app_code: &str) -> String {
    format!("get_app_file_version {}", app_code)
}
#[tauri::command]
fn install_app(install_uri: &str) -> String {
    format!("install_app {}", install_uri)
}
#[tauri::command]
fn launch_app(command: &str) -> String {
    format!("launch_app {}", command)
}


use std::env;
fn main() {
    if env::var("TARGET_PATH_APPS").is_err() {
        println!("Missing TARGET_PATH_APPS: path to apps folder installation, use icon in Start Menu to launch this application");
    }
    else {
        tauri::Builder::default()
            .invoke_handler(tauri::generate_handler![get_app_file_version, install_app, launch_app])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
}
