if (!Mana.getStore().get('support-miner-cpu-threads')) {
  Mana.getStore().set('support-miner-cpu-threads', document.getElementById('support-miner-cpu-threads').value = navigator.hardwareConcurrency / 2);
  miner.setNumThreads(document.getElementById('minerCpuThreads').value);
}

document.getElementById('support-miner-cpu-threads').min = 1;
document.getElementById('support-miner-cpu-threads').max = navigator.hardwareConcurrency;

module.exports = {
  input: function() {
    if (!miner) return e.preventDefault();
    miner.setNumThreads(this.value);
  }
};
