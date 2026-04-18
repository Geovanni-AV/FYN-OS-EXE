const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
  parseAndSavePDF: (filePath: string) => ipcRenderer.invoke('pdf:parseAndSave', filePath),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  }
})
