if (!window.ipcRenderer) {
  window.ipcRenderer = {
    send: () => {},
    on: () => {},
  }
}
window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args)
})
