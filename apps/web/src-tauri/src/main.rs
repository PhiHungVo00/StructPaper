#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
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

/// Resolves the absolute path to the Tectonic compiler binary across all environments:
/// 1. Installed production app (next to structpaper executable)
/// 2. Tauri dev mode (target/debug, src-tauri/bin, or apps/web/bin)
/// 3. Project root (bin/tectonic.exe)
/// 4. System PATH (via 'where' or 'which')
fn resolve_tectonic_binary() -> Result<PathBuf, String> {
    let mut candidates: Vec<PathBuf> = Vec::new();
    let exe_name = if cfg!(windows) { "tectonic.exe" } else { "tectonic" };

    // 1. Next to the running executable (Production bundle / NSIS installation)
    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            candidates.push(exe_dir.join(exe_name));
            candidates.push(exe_dir.join("bin").join(exe_name));

            // In dev mode (target/debug or target/release)
            if let Some(target_dir) = exe_dir.parent() {
                if let Some(src_tauri_dir) = target_dir.parent() {
                    candidates.push(src_tauri_dir.join("bin").join(exe_name));
                    #[cfg(windows)]
                    candidates.push(src_tauri_dir.join("bin").join("tectonic-x86_64-pc-windows-msvc.exe"));
                    #[cfg(target_os = "macos")]
                    candidates.push(src_tauri_dir.join("bin").join("tectonic-aarch64-apple-darwin"));

                    if let Some(apps_web) = src_tauri_dir.parent() {
                        candidates.push(apps_web.join("bin").join(exe_name));
                        if let Some(root) = apps_web.parent().and_then(|p| p.parent()) {
                            candidates.push(root.join("bin").join(exe_name));
                        }
                    }
                }
            }
        }
    }

    // 2. Relative to Current Working Directory (Dev mode in apps/web or repository root)
    if let Ok(cwd) = std::env::current_dir() {
        candidates.push(cwd.join(exe_name));
        candidates.push(cwd.join("bin").join(exe_name));
        candidates.push(cwd.join("src-tauri").join("bin").join(exe_name));
        #[cfg(windows)]
        candidates.push(cwd.join("src-tauri").join("bin").join("tectonic-x86_64-pc-windows-msvc.exe"));
        #[cfg(target_os = "macos")]
        candidates.push(cwd.join("src-tauri").join("bin").join("tectonic-aarch64-apple-darwin"));

        // If running from apps/web, check repo root
        if let Some(parent) = cwd.parent() {
            candidates.push(parent.join("bin").join(exe_name));
            if let Some(root) = parent.parent() {
                candidates.push(root.join("bin").join(exe_name));
            }
        }
    }

    // Check all candidate paths
    for path in &candidates {
        if path.is_file() {
            if let Ok(canon) = fs::canonicalize(path) {
                return Ok(canon);
            }
            return Ok(path.clone());
        }
    }

    // 3. Fallback: Search system PATH
    let check_cmd = if cfg!(windows) { "where" } else { "which" };
    if let Ok(output) = std::process::Command::new(check_cmd).arg("tectonic").output() {
        if output.status.success() {
            let path_str = String::from_utf8_lossy(&output.stdout)
                .trim()
                .lines()
                .next()
                .unwrap_or("")
                .trim()
                .to_string();
            if !path_str.is_empty() {
                let p = PathBuf::from(path_str);
                if p.is_file() {
                    return Ok(p);
                }
            }
        }
    }

    Err(format!(
        "Tectonic binary not found! Looked in:\n{}",
        candidates
            .iter()
            .map(|c| format!(" - {}", c.display()))
            .collect::<Vec<_>>()
            .join("\n")
    ))
}

#[tauri::command]
async fn compile_latex_desktop(
    _app: AppHandle,
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

    // 1. Resolve Tectonic compiler binary
    let tectonic_bin = match resolve_tectonic_binary() {
        Ok(bin) => bin,
        Err(e) => {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(e);
        }
    };

    // 2. Execute Tectonic command asynchronously
    let mut cmd = tokio::process::Command::new(&tectonic_bin);
    cmd.current_dir(&temp_dir)
        .arg("article.tex")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped());

    #[cfg(windows)]
    {
        // CREATE_NO_WINDOW prevents command prompt window from popping up
        cmd.creation_flags(0x08000000);
    }

    let output = match cmd.output().await {
        Ok(out) => out,
        Err(e) => {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(format!(
                "Failed to execute Tectonic (at {}): {}",
                tectonic_bin.display(),
                e
            ));
        }
    };

    let duration_ms = start.elapsed().as_millis() as u64;
    let pdf_path = temp_dir.join("article.pdf");

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
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
            "Tectonic exited with code {:?}, article.pdf not generated",
            output.status.code()
        )),
    })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![compile_latex_desktop])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_always_on_top(true);
                let _ = window.set_focus();
                let _ = window.set_always_on_top(false);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running StructPaper application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resolve_tectonic_binary() {
        let bin = resolve_tectonic_binary().expect("Tectonic binary should be resolved");
        println!("Resolved tectonic at: {}", bin.display());
        assert!(bin.is_file(), "Resolved path must be a file");
    }

    #[tokio::test]
    async fn test_tectonic_execution() {
        let bin = resolve_tectonic_binary().expect("Tectonic binary should be resolved");
        let temp_dir = std::env::temp_dir().join(format!("sp-test-{}", uuid::Uuid::new_v4()));
        fs::create_dir_all(&temp_dir).unwrap();

        let tex_content = r#"\documentclass{article}
\begin{document}
Hello StructPaper!
\end{document}"#;
        fs::write(temp_dir.join("article.tex"), tex_content).unwrap();

        let mut cmd = tokio::process::Command::new(&bin);
        cmd.current_dir(&temp_dir).arg("article.tex");
        #[cfg(windows)]
        cmd.creation_flags(0x08000000);

        let output = cmd.output().await.expect("Failed to execute tectonic");
        println!("Tectonic status: {:?}", output.status);
        println!("Stdout: {}", String::from_utf8_lossy(&output.stdout));
        println!("Stderr: {}", String::from_utf8_lossy(&output.stderr));

        let pdf = temp_dir.join("article.pdf");
        assert!(pdf.exists(), "article.pdf should be generated");
        let _ = fs::remove_dir_all(&temp_dir);
    }
}


