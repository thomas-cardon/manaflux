module.exports = {
  minerLoaded: function() {
    miner.setThrottle(1 - (parseInt(document.getElementById('support-miner-speed').value) / 100));
    document.getElementById('support-miner-limit-in-game').innerHTML = i18n.__('support-miner-limit-in-game', document.getElementById('support-miner-speed').value / 10 + '%');
  },
  input: function() {
    miner.setThrottle(1 - (parseInt(this.value) / 100));
    document.getElementById('support-miner-limit-in-game').innerHTML = i18n.__('support-miner-limit-in-game', this.value / 10 + '%');
  }
};
