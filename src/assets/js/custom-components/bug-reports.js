const { BrowserWindow } = require('electron').remote;
const rp = require('request-promise-native');

ipcRenderer.on('bug-report', async (event, data) => {
  console.log('[Bug Report] Sending one..');

  try {
    const d = await rp({
      method: 'POST',
      uri: 'https://manaflux-server.herokuapp.com/bugreports',
      body: console.dir(3, {...data, summonerId: Mana.user.getSummonerId(), summonerName: Mana.user.getDisplayName() }),
      json: true
    });

    if (d.message && d.error) UI.error(d.message);
    else if (d.error) throw UI.error(Error(d.error));
    else if (d.statusCode === 200) UI.success(i18n.__('bug-report-sent'));
  }
  catch(err) {
    UI.error(err);
  }
});

module.exports = {
  click: function() {
    let wiz = new BrowserWindow({ parent: require('electron').remote.getCurrentWindow(), width: 350, height: 550, frame: false, icon: __dirname + '/build/icon.' + (process.platform === 'win32' ? 'ico' : 'png'), backgroundColor: '#000A13', maximizable: false, resizable: false, modal: true, show: false });

    wiz.loadURL(`file://${__dirname}/../../../bugreports.html`);
    wiz.setMenu(null);

    wiz.once('ready-to-show', () => wiz.show());

    if (dev) wiz.webContents.openDevTools({ mode: 'detach' });
  }
};
