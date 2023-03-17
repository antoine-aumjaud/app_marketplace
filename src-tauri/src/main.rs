// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::path::Path;
use std::fs;
use std::env;
use std::process::Command;

#[tauri::command]
fn get_target_path() -> String {
    let path = match env::var_os("APPS_PATH") {
        Some(v) => v.into_string().unwrap(),
        None => panic!("$APPS_PATH is not set")
    };
    return path.to_string();
}
#[tauri::command]
fn get_apps_url() -> String {
    let path = match env::var_os("APPS_URL") {
        Some(v) => v.into_string().unwrap(),
        None => panic!("$APPS_URL is not set")
    };
    return path.to_string();
}

#[tauri::command]
fn get_url_content(url: String) -> String {
    return match ureq::get(&url)
        .call() {
            Ok(response) => { 
                response.into_string().unwrap() 
            },
            Err(ureq::Error::Status(code, response)) => {
                format!("{}-|-{}", code, response.into_string().unwrap())
            }
            Err(_) => { 
                "500-|-network issue".to_string()
            }
        };
}


#[tauri::command]
fn is_path_exist(path: String) -> bool {
    return Path::new(&path).exists();
}
#[tauri::command]
fn delete_file(path: String) -> bool {
    return fs::remove_file(&path).is_ok();
}
#[tauri::command]
fn delete_dir(path: String) -> bool {
    return fs::remove_dir_all(&path).is_ok();
}
#[tauri::command]
fn launch(path: String, command: String, args: Vec<String>) -> String {
    let output = Command::new(command)
        .args(args)
        .current_dir(path)
        .output();

    match output {
            Ok(content) => { 
                return format!("{}-|-{}-|-{}", 
                    content.status.success(), 
                    String::from_utf8_lossy(&content.stdout), 
                    String::from_utf8_lossy(&content.stderr));
            },
            Err(error) => { 
                return format!("false-|- -|-{}", error.to_string()); 
            }
    };
}

fn main() {
    if env::var("APPS_PATH").is_err() {
        panic!("Missing APPS_PATH: path to apps folder installation, use icon in Start Menu to launch this application");
    }
    if env::var("APPS_URL").is_err() {
        panic!("Missing APPS_URL: URL to apps list, use icon in Start Menu to launch this application");
    }

    println!("Works with {} in {}",
        env::var("APPS_URL").unwrap(),
        env::var("APPS_PATH").unwrap()
    );

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_target_path, get_apps_url, 
            get_url_content,
            is_path_exist, 
            delete_file, delete_dir, 
            launch])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
