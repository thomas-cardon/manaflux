const QRCode = require('qrcode');
const os = require('os');

module.exports = {
  load: function(Mana) {
    let canvas = document.getElementById('qrcode');

    QRCode.toCanvas(canvas, os.hostname() + ":" + Mana.remoteConnectionHandler.address, { width: 256 }, error => {
      if (error) return console.error(error);
      console.log('[UI] Successfuly generated QR code');
    });

    document.getElementById('remote-ip-address').innerHTML = os.hostname() + ":" + Mana.remoteConnectionHandler.address;

    if (!Mana.getStore().get('mobile-app-disabled'))
      Mana.remoteConnectionHandler.start();
  },
  input: function() {
    console.log(`[RemoteConnectionHandler] Turning ${this.checked ? 'off' : 'on'}`);

    if (!this.checked) {
      Mana.remoteConnectionHandler.start();

      this.disabled = true;
      setTimeout(() => this.disabled = false, 500);
    }
    else Mana.remoteConnectionHandler.stop();
  }
};
