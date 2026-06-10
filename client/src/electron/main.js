import { app, BrowserWindow } from "electron";
import path from "path";
import { isDev } from "./utils.js";
import { spawn } from "child_process";
import fs from "fs";
app.disableHardwareAcceleration();
let mainWindow;
let backend;

function log(msg) {
    const timestamp = new Date().toISOString();
    const fullMsg = `[${timestamp}] ${msg}`;
    console.error(fullMsg); // Use stderr so it appears in terminal
}

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load app
    if (isDev()) {
        mainWindow.loadURL("http://localhost:5173");
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
    }

    // Handle window closed
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
};

// App lifecycle
app.whenReady().then(() => {
    // Start backend server FIRST
    let backendPath, serverDir;

    if (isDev()) {
        // Development: use actual Server directory
        backendPath = path.resolve(
            app.getAppPath(),
            "../Server/dist/main"
        );
        serverDir = path.resolve(
            app.getAppPath(),
            "../Server"
        );
    } else {
        // Production: Server is in app resources
        backendPath = path.join(app.getAppPath(), "Server/dist/main");
        serverDir = path.join(app.getAppPath(), "Server");
    }

    log(`Starting backend from: ${backendPath}`);
    log(`Working directory: ${serverDir}`);
    log(`Is Dev: ${isDev()}`);

    // Check if executable exists
    if (!fs.existsSync(backendPath)) {
        log(`ERROR: Backend executable not found at ${backendPath}`);
        console.error("Available files in app path:", fs.readdirSync(app.getAppPath()));
    } else {
        log(`Backend executable found`);
        // Make sure it's executable
        try {
            fs.chmodSync(backendPath, "755");
            log(`Set executable permissions on backend`);
        } catch (err) {
            log(`Warning: Could not set permissions: ${err.message}`);
        }
    }

    backend = spawn(backendPath, [], {
        cwd: serverDir,
        env: { ...process.env },
        detached: false
    });

    log(`Backend process PID: ${backend.pid}`);

    backend.stdout.on("data", (data) => {
        log(`[Backend stdout] ${data.toString().trim()}`);
    });

    backend.stderr.on("data", (data) => {
        log(`[Backend stderr] ${data.toString().trim()}`);
    });

    backend.on("error", (err) => {
        log(`[Backend error] Failed to start: ${err.message}`);
    });

    backend.on("exit", (code) => {
        log(`[Backend exit] Process exited with code ${code}`);
        if (backend) {
            backend.kill();
        }

        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    // Wait 3 seconds for server to start, then create window
    setTimeout(() => {
        createWindow();
    }, 3000);

});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});







