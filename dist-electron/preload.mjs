"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  on: (...args) => electron.ipcRenderer.on(...args),
  off: (...args) => electron.ipcRenderer.off(...args),
  send: (...args) => electron.ipcRenderer.send(...args),
  invoke: (...args) => electron.ipcRenderer.invoke(...args)
  // Specific DB calls can be added here as shortcuts or we can use generic invoke
  // For Phase 1, we will keep it generic to avoid tight coupling during development
});
