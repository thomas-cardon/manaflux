if (miner) {
  miner.setThrottle(1 - (parseInt(document.getElementById('support-miner-speed').value) / 100));
  document.getElementById('support-miner-limit-in-game').innerHTML = i18n.__('support-miner-limit-in-game', document.getElementById('support-miner-speed').value / 10 + '%');
}

module.exports = {
  input: function() {
    if (!miner) return this.disabled = true;

    miner.setThrottle(1 - (parseInt(this.value) / 100));
    document.getElementById('support-miner-limit-in-game').innerHTML = i18n.__('support-miner-limit-in-game', this.value / 10 + '%');
  }
};
