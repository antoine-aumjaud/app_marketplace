// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

use std::collections::HashMap;
use std::path::Path;
use std::fs;
use std::env;
use std::process::Command;
use std::process::Stdio;

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
    /* let mut root_store = rustls::RootCertStore::empty();
    root_store.add_server_trust_anchors(webpki_roots::TLS_SERVER_ROOTS.0.iter()
            .map(|ta| { rustls::OwnedTrustAnchor::from_subject_spki_name_constraints(ta.subject, ta.spki, ta.name_constraints) }) );*/
    let tls_config = rustls::ClientConfig::builder()
        .with_safe_defaults()
        //.with_root_certificates(root_store)
        .with_custom_certificate_verifier(SkipServerVerification::new())
        .with_no_client_auth();
    let agent = ureq::builder().tls_config(std::sync::Arc::new(tls_config)).build();
    return match agent.get(&url)
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
fn launch_process(path: String, command: String, args: Vec<String>, vars: HashMap<String, String>, output_file: String) -> String {
    let file_out = fs::File::create(output_file).unwrap();
    let file_err = file_out.try_clone().unwrap();

    return match Command::new(command)
        .args(args)
        .current_dir(path)
        .envs(vars)
        .stdout(Stdio::from(file_out))
        .stderr(Stdio::from(file_err))
        .spawn() { //do not wait for status and outputs
            Ok(child) =>  child.id().to_string(),
            Err(error) => format!("error: {}", error.to_string()) 
        };
}

#[tauri::command]
fn kill_process(_pid: String) -> bool {
    //rustix::process::kill_process(pid).is_ok() //FIXME
    true
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
            launch_process, kill_process
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


// structs
struct SkipServerVerification;
impl SkipServerVerification {
    fn new() -> std::sync::Arc::<Self> {
        std::sync::Arc::new(Self)
    }
}
impl rustls::client::ServerCertVerifier for SkipServerVerification {
    fn verify_server_cert(
        &self,
        _end_entity: &rustls::Certificate,
        _intermediates: &[rustls::Certificate],
        _server_name: &rustls::ServerName,
        _scts: &mut dyn Iterator<Item = &[u8]>,
        _ocsp_response: &[u8],
        _now: std::time::SystemTime,
    ) -> Result<rustls::client::ServerCertVerified, rustls::Error> {
        Ok(rustls::client::ServerCertVerified::assertion())
    }
}