const http = require('http'), request = require('request');
const { captureException } = require('@sentry/electron');

/*
* GameAssetsProxy
* This class allows ManaFlux to load League's assets such as champion images directly from the client
* without using DataDragon. It's made this way to bypass Chrome's credentialed subresource requests blocking
*/
class GameAssetsProxy {
  onRequest(req, res) {
    if (req.url === '/favicon.ico') return;
    log.log(3, `[GameAssetsProxy] ${Mana.base}${req.url.slice(1)}`);

    try {
      request.get(Mana.base + req.url.slice(1)).pipe(res);
    }
    catch(err) {
      res.end(err);
      captureException(err);
    }
  }

  load() {
    this._server = http.createServer(this.onRequest);

    this._server.listen(3681, 'localhost', (err) => {
      if (err) return captureException(err);

      log.log(2, `[GameAssetsProxy] Listening on port 3681`);
    });
  }

  stop() {
    this._server.close();
  }
}

module.exports = GameAssetsProxy;
