#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CompileDesktopRequest {
    pub tex: String,
    pub images: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CompileDesktopResponse {
    pub status: String,
    pub pdf_base64: Option<String>,
    pub logs: Vec<String>,
    pub duration_ms: u64,
    pub error: Option<String>,
}

#[tauri::command]
async fn compile_latex_desktop(
    app: AppHandle,
    payload: CompileDesktopRequest,
) -> Result<CompileDesktopResponse, String> {
    let start = std::time::Instant::now();
    let job_id = format!("sp-job-{}", uuid::Uuid::new_v4());
    let temp_dir = std::env::temp_dir().join(&job_id);

    if let Err(e) = fs::create_dir_all(&temp_dir) {
        return Err(format!("Failed to create job directory: {}", e));
    }

    let tex_path = temp_dir.join("article.tex");
    if let Err(e) = fs::write(&tex_path, &payload.tex) {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!("Failed to write article.tex: {}", e));
    }

    // Write images if provided
    if let Some(images) = payload.images {
        for (filename, base64_data) in images {
            use base64::Engine;
            if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(base64_data) {
                let img_path = temp_dir.join(&filename);
                let _ = fs::write(img_path, bytes);
            }
        }
    }

    // Execute Tectonic sidecar
    let sidecar_command = match app.shell().sidecar("bin/tectonic") {
        Ok(cmd) => cmd,
        Err(e) => {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(format!("Failed to resolve Tectonic sidecar: {}", e));
        }
    };

    let output = sidecar_command
        .current_dir(&temp_dir)
        .args(["article.tex"])
        .output()
        .await;

    let duration_ms = start.elapsed().as_millis() as u64;
    let pdf_path = temp_dir.join("article.pdf");

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            let combined_logs: Vec<String> = stdout
                .lines()
                .chain(stderr.lines())
                .map(|s| s.to_string())
                .collect();

            if pdf_path.exists() {
                if let Ok(pdf_bytes) = fs::read(&pdf_path) {
                    use base64::Engine;
                    let b64 = base64::engine::general_purpose::STANDARD.encode(&pdf_bytes);
                    let _ = fs::remove_dir_all(&temp_dir);
                    return Ok(CompileDesktopResponse {
                        status: "success".to_string(),
                        pdf_base64: Some(b64),
                        logs: combined_logs,
                        duration_ms,
                        error: None,
                    });
                }
            }

            let _ = fs::remove_dir_all(&temp_dir);
            Ok(CompileDesktopResponse {
                status: "error".to_string(),
                pdf_base64: None,
                logs: combined_logs,
                duration_ms,
                error: Some(format!(
                    "Tectonic exited with status: {:?}, article.pdf not generated",
                    out.status.code()
                )),
            })
        }
        Err(e) => {
            let _ = fs::remove_dir_all(&temp_dir);
            Err(format!("Error executing Tectonic sidecar: {}", e))
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![compile_latex_desktop])
        .run(tauri::generate_context!())
        .expect("error while running StructPaper application");
}
