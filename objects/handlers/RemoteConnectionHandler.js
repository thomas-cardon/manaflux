const polka = require('polka'), rp = require('request-promise-native');
const os = require('os');

class RemoteConnectionHandler {
  constructor() {
    this.address = this._queryAddress();
  }

  log(req, res, next) {
    console.log(`[RemoteConnectionHandler] > ${req.url}`);
    next();
  }

  async start() {
    this._server = polka()
      .use(this.log)
      .get('/api/v1/heartbeat', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, inChampionSelect: Mana.championSelectHandler._inChampionSelect }));
      })
      .get('/api/v1/summoner', (req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });

        if (Mana.user)
          res.end(JSON.stringify({ success: true, summonerName: Mana.user.getDisplayName(), summonerLevel: Mana.user.getSummonerLevel() }));
        else res.end(JSON.stringify({ success: false, errorCode: 'SUMMONER_NOT_CONNECTED', error: 'Summoner is not connected' }));
      })
      .post('/api/v1/actions/rune-pages/:id', (req, res) => {
        if (!Mana.championSelectHandler._inChampionSelect) res.end({ success: false, errorCode: 'NOT_IN_CHAMPION_SELECT', error: 'Not in Champion Select' });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      })
      .post('/api/v1/actions/summoner-spells/:id', (req, res) => {
        if (!Mana.championSelectHandler._inChampionSelect) res.end({ success: false, errorCode: 'NOT_IN_CHAMPION_SELECT', error: 'Not in Champion Select' });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      })
      .listen(4500, err => {
        if (err) throw err;
        console.log(`[RemoteConnectionHandler] > Running on localhost:4500`);
      });
  }

  async stop() {

  }

  _queryAddress() {
    const interfaces = os.networkInterfaces();

    var all = Object.keys(interfaces).map(function (nic) {
      if (nic.includes('VirtualBox')) return undefined;

      var addresses = interfaces[nic].filter(function (details) {
        details.family = details.family.toLowerCase();
        if (details.family !== 'ipv4' && details.internal === false) return false;
        else return true;
      });

      return addresses.length ? addresses[0].address : undefined;
    }).filter(Boolean);

    return all[0];
  }
}

module.exports = RemoteConnectionHandler;
