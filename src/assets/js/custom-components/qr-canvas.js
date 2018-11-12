const QRCode = require('qrcode');

module.exports = {
  clientLoaded: function() {
    let canvas = document.getElementById('qrcode');

    QRCode.toCanvas(canvas, Mana.remoteConnectionHandler.address, { width: 256 }, error => {
      if (error) return console.error(error);
      console.log('[UI] Successfuly generated QR code');
    });
  }
}
