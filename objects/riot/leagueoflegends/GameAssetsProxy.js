const http = require('http'), https = require('https');

/*
* GameAssetsProxy
* This class allows ManaFlux to load League's assets such as champion images directly from the client
* without using DataDragon (and making network requests). It's made this way to bypass Chrome's credentialed subresource requests blocking
*/
class GameAssetsProxy {
  onRequest(req, res) {
    if (req.url === '/favicon.ico') return;
    console.log(3, `[GameAssetsProxy] ${Mana.base}${req.url.slice(1)}`);

    require('https').get({
      host: '127.0.0.1',
      port: Mana.riot.port,
      path: req.url,
      headers: { 'Authorization': Mana.riot.authToken },
      rejectUnauthorized: false,
    }, r => r.pipe(res)).on('error', err => {
      res.end(err);
      captureException(err);
    });
  }

  load() {
    this._server = http.createServer(this.onRequest);
    this.port = parseInt(Math.random() * (3699 - 3600) + 3600);

    this._server.listen(this.port, 'localhost', (err) => {
      if (err) UI.error(err);

      console.log(2, `[GameAssetsProxy] Listening on port ${this.port}`);
    });
  }

  stop() {
    this._server.close();
  }
}

module.exports = GameAssetsProxy;
