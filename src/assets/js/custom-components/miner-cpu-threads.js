module.exports = {
  minerLoaded: function() {
    if (!Mana.getStore().get('support-miner-cpu-threads')) {
      Mana.getStore().set('support-miner-cpu-threads', document.getElementById('support-miner-cpu-threads').value = navigator.hardwareConcurrency / 2);
      miner.setNumThreads(document.getElementById('minerCpuThreads').value);
    }

    this.min = 1;
    this.max = navigator.hardwareConcurrency;
  },
  input: function() {
    if (!miner) return e.preventDefault();
    miner.setNumThreads(this.value);
  }
};
