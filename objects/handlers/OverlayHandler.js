const { BrowserWindow, screen } = require('electron').remote;

class OverlayHandler {

  start() {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

    let win = new BrowserWindow({
      width: 800,
      height: 600,
      transparent: true,
      frame: false,
      show: false
    });

    win.loadURL('http://github.com');

    win.webContents.on('paint', (event, dirty, image) => {
      if (this.markQuit) return;

      this.overlay.sendFrameBuffer(win.id, image.getBitmap(), image.getSize().width, image.getSize().height);
    });

    win.on("ready-to-show", () => {
      win.focusOnWebView();
    })

    win.on("closed", () => {
      this.overlay.closeWindow(win.id);
    });

    this.interface = require('electron-overlay');
    this.interface.start();

    this.interface.setHotkeys([
      { name: "overlay.toggle", keyCode: 113, modifiers: { ctrl: true } },
      { name: "app.doit", keyCode: 114, modifiers: { ctrl: true } }
    ]);

    this.interface.setEventCallback((event, payload) => {
      if (event === "game.input") {
        const window = BrowserWindow.fromId(payload.windowId);

        if (window) {
          const inputEvent = this.interface.translateInputEvent(payload)

          if (inputEvent) {
            window.webContents.sendInputEvent(inputEvent)
          }
        }
      } else if (event === "graphics.fps") {
      } else if (event === "game.hotkey.down") {
        if (payload.name === "app.doit") {
          this.doit()
        }
      } else if (event === "game.window.focused") {
        console.log("focusWindowId", payload.focusWindowId)

        BrowserWindow.getAllWindows().forEach((window) => window.blurWebView());

        const focusWin = BrowserWindow.fromId(payload.focusWindowId);
        if (focusWin) focusWin.focusOnWebView();
      }
    });

    this.interface.addWindow(win.id, {
      name: 'test',
      transparent: true,
      resizable: win.isResizable(),
      maxWidth: win.isResizable
        ? display.bounds.width
        : win.getBounds().width,
      maxHeight: win.isResizable
        ? display.bounds.height
        : win.getBounds().height,
      minWidth: window.isResizable ? 100 : win.getBounds().width,
      minHeight: window.isResizable ? 100 : win.getBounds().height,
      nativeHandle: win.getNativeWindowHandle().readUInt32LE(0),
      rect: {
        ...win.getBounds()
      }
    });

    this.inject(win);
  }

  inject(win) {
    const OvHook = require('node-ovhook');

    for (const window of OvHook.getTopWindows()) {
      console.dir(window);
      if (window.title.indexOf('League of Legends (TM) Client') !== -1) {
        console.log(3, 'OverlayHandler >> Injecting into League');
        OvHook.injectProcess(window);

        win.show();
        win.focus();
      }
    }
  }

  isAvailable() {
    return process.platform === "win32";
  }
}

module.exports = OverlayHandler;
