const QRCode = require('qrcode');

module.exports = {
  clientLoaded: function() {
    let canvas = document.getElementById('qr-template');

    QRCode.toCanvas(canvas, 'http://' + Mana.remoteConnectionHandler.address, error => {
      if (error) return console.error(error);
      console.log('[UI] Successfuly generated qr-code');
    });
  }
}
