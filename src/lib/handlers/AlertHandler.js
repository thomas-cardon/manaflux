const rp = require('request-promise-native');
class AlertHandler {
  constructor() {

  }

  async load() {
    return await this._check(Mana.version);
  }

  async login() {
    return await this._check(Mana.version, Mana.user.getSummonerId());
  }

  async stop() {

  }

  async _check(version = Mana.version, summonerId) {
    const alerts = Mana.getStore().get('alerts', []);

    try {
      let messages = await rp({ uri: `https://manaflux-server.herokuapp.com/api/alerts/v2?v=${Mana.version}${summonerId ? '&summoner=' + summonerId : ''}`, json: true });
      console.dir(messages);

      messages.filter(x => !alerts.includes(x._id)).forEach(x => {
        this._alert(x.message);
        alerts.push(x._id);
      });

      Mana.getStore().set('alerts', alerts);
    }
    catch(err) {
      console.error(err);
    }
  }

  _alert(message) {
    /* Prevent spamming same message */
    if (this._message === message) return;

    this._message = message;
    alertify.warning(message);
  }
}

module.exports = AlertHandler;
