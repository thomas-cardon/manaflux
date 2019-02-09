const { BrowserWindow } = require('electron').remote;
module.exports = {
  click: function() {
    this.disabled = true;
    console.log('[Support] Paypal donation called!');

    let win = new BrowserWindow({ title: i18n.__('support-paypal-button'), parent: require('electron').remote.getCurrentWindow(), webPreferences: { nodeIntegration: false }, width: 730, height: 730, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), maximizable: false, resizable: true, modal: true, show: false });

    win.loadURL('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PHVX8CV7YU9QU&lc=' + i18n._locale);
    win.setMenu(null);

    win.once('ready-to-show', () => win.show());
    win.once('show', () => {
      win.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith('http://localhost/paypal')) win.close();

        if (url === 'http://localhost/paypal/cancel') {
          console.log('[Support] Paypal donation cancelled!');
          alertify.error(i18n.__('support-paypal-cancelled'));
        }
        else if (url === 'http://localhost/paypal/done') {
          console.log('[Support] Paypal donation done!');
          alertify.success(i18n.__('support-paypal-done'));
        }
      })
    });

    win.once('close', () => {
      this.disabled = false;
    });

    if (Mana.devMode) win.webContents.openDevTools({ mode: 'detach' });
  }
};
