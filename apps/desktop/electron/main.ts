import { app, BrowserWindow, Menu, shell, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import http from "node:http";
import { installAdBlocker } from "./ad-blocker";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "..");

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let authServer: http.Server | null = null;

function startAuthLoopbackServer() {
  if (authServer) return;
  authServer = http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url || "", "http://127.0.0.1:45678");
      if (parsedUrl.pathname === "/callback") {
        const token = parsedUrl.searchParams.get("token");
        const refreshToken = parsedUrl.searchParams.get("refreshToken");
        if (token && win) {
          if (win.isMinimized()) win.restore();
          win.show();
          win.focus();
          win.webContents.send("auth-tokens", { token, refreshToken });
        }
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          "<!DOCTYPE html><html><body style='background:#0e1013;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:90vh;'><div style='text-align:center;'><h2>Authentication Successful</h2><p style='color:#a1a1aa;'>You can now close this tab and return to the Kino+ app.</p></div></body></html>"
        );
        return;
      }
    } catch {}
    res.writeHead(404);
    res.end();
  });

  authServer.listen(45678, "127.0.0.1", () => {});
  authServer.on("error", () => {
    // Port in use or blocked; OS deep-link handles it
  });
}

function createWindow() {
  Menu.setApplicationMenu(null);
  startAuthLoopbackServer();

  const isMac = process.platform === "darwin";

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Kino Plus",
    backgroundColor: "#0e1013",
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    ...(isMac
      ? {
          trafficLightPosition: { x: 14, y: 12 },
        }
      : {
          titleBarOverlay: {
            color: "#0e1013",
            symbolColor: "#ffffff",
            height: 40,
          },
        }),
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  win.removeMenu();

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Register custom protocol client for deep linking: kinoplus://
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("kinoplus", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("kinoplus");
}

// Request single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
      const deepLinkUrl = commandLine.find((arg) =>
        arg.startsWith("kinoplus://"),
      );
      if (deepLinkUrl) {
        win.webContents.send("deep-link", deepLinkUrl);
      }
    }
  });
}

// macOS open-url
app.on("open-url", (_event, url) => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    win.webContents.send("deep-link", url);
  }
});

// IPC Handler to open external URLs in system default browser
ipcMain.handle("open-external", async (_event, url: string) => {
  if (
    typeof url === "string" &&
    (url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("kinoplus://"))
  ) {
    await shell.openExternal(url);
    return true;
  }
  return false;
});

// IPC Handler to bring the desktop window to front
ipcMain.handle("focus-window", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
  return true;
});

app.on("before-quit", () => {
  authServer?.close();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    authServer?.close();
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  installAdBlocker();
  createWindow();
});
