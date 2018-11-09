if (miner) {
  miner[document.getElementById('support-miner-disable').checked ? 'stop' : 'start']();
  document.getElementById('support-miner-speed').disabled = document.getElementById('support-miner-disable').checked;
}

module.exports = {
  input: function() {
    if (!miner) return this.disabled = true;

    miner[this.checked ? 'stop' : 'start']();
    document.getElementById('support-miner-speed').disabled = this.checked;
  }
};
