const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  parseAndSavePDF: (filePath) => ipcRenderer.invoke("pdf:parseAndSave", filePath),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  }
});
//# sourceMappingURL=preload.js.map
