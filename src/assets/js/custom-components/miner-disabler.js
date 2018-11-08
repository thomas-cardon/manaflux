miner[document.getElementById('support-miner-disable').checked ? 'stop' : 'start']();
document.getElementById('support-miner-speed').disabled = document.getElementById('support-miner-disable').checked;

module.exports = {
  input: function() {
    miner[this.checked ? 'stop' : 'start']();
    document.getElementById('support-miner-speed').disabled = this.checked;
  }
};
