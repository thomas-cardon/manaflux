const QRCode = require('qrcode');
const os = require('os');

module.exports = {
  clientLoaded: function() {
    let canvas = document.getElementById('qrcode');

    QRCode.toCanvas(canvas, os.hostname() + ":" + Mana.remoteConnectionHandler.address, { width: 256 }, error => {
      if (error) return console.error(error);
      console.log('[UI] Successfuly generated QR code');
    });
  }
}
