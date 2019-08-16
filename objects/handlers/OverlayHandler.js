class OverlayHandler {

  isAvailable() {
    return process.platform === "win32";
  }
}

module.exports = OverlayHandler;
