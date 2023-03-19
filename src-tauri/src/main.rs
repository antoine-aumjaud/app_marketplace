// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::collections::HashMap;
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
                format!("{}-|-{}", response.status(), response.into_string().unwrap()) 
            },
            Err(ureq::Error::Status(code, response)) => {
                format!("{}-|-{}", code, response.into_string().unwrap())
            }
            Err(error) => { 
                format!("500-|-{}", error.to_string())
            }
        };
}

#[tauri::command]
fn get_local_file_content(path: String) -> String {
    return match fs::read_to_string(path) {
        Ok(content) => { 
            content.to_string()
        },
        Err(error) => {
            format!("error: {}", error.to_string())
        }
    };
}

#[tauri::command]
fn save_local_file_content(path: String, content: String) -> String {
    return match fs::write(path, content) {
        Ok(_) => "true".to_string(),
        Err(error) => {
            format!("error: {}", error.to_string())
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
fn create_dir(path: String) -> bool {
    return fs::create_dir(&path).is_ok();
}

#[tauri::command]
fn launch_install(path: String, command: String, args: Vec<String>, vars: HashMap<String, String>) -> String {
    return match Command::new(command)
        .args(args)
        .current_dir(path)
        .envs(vars)
        .output() {
            Ok(content) => { 
                format!("{}-|-{}-|-{}", 
                    content.status.success(), 
                    String::from_utf8_lossy(&content.stdout), 
                    String::from_utf8_lossy(&content.stderr))
            },
            Err(error) => { 
                format!("false-|- -|-{}", error.to_string()) 
            }
        };
}

#[tauri::command]
fn launch_open(path: String, command: String, args: Vec<String>, vars: HashMap<String, String>) -> String {
    return match Command::new(command)
        .args(args)
        .current_dir(path)
        .envs(vars)
        .spawn() { //do not wait for status and outputs
            Ok(_) => "true-|- -|- ".to_string(),
            Err(error) => format!("false-|- -|-{}", error.to_string()) 
        };
}
fn main() {
    if env::var("APPS_PATH").is_err() {
        panic!("Missing APPS_PATH: path to apps folder installation, use icon in Start Menu to launch this application");
    }
    if env::var("APPS_URL").is_err() {
        panic!("Missing APPS_URL: URL to apps list, use icon in Start Menu to launch this application");
    }
    if !is_path_exist(env::var("APPS_PATH").unwrap()) {
        panic!("Apps Path (APPS_PATH) doesn't exist, use icon in Start Menu to launch this application");
    }

    println!("Works with {}\n in {}",
        env::var("APPS_URL").unwrap(),
        env::var("APPS_PATH").unwrap()
    );

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_target_path, get_apps_url, 
            get_url_content, get_local_file_content, save_local_file_content,
            is_path_exist, 
            delete_file, delete_dir, create_dir,
            launch_install, launch_open
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
