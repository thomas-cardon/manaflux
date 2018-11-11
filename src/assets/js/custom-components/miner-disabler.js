var minerScript;

function load(Mana) {
  if (this.checked) return;

  minerScript = document.createElement('script');
  minerScript.onload = function() {
    try {
      global.miner = new CoinHive.User('UZqdO60CqnRVj9olLFTZCmrj6yl5Dynn', localStorage['machineId'], { throttle: 1, threads: navigator.hardwareConcurrency / 2 });
      global.miner[document.getElementById('support-miner-disable').checked ? 'stop' : 'start']();

      document.querySelectorAll('[data-miner]').forEach(x => x.dispatchEvent(new Event('minerLoaded')));
    }
    catch(err) {
      console.log('Disabled miner due to an unknown error:');
      console.error(err);
    }
  };

  minerScript.crossorigin = 'anonymous';
  minerScript.integrity = 'sha384-4J0S7gECLIbAmvXYe2oUqoiPaP+6I+xE61KDK+SzA34uBjxrannM7AQL1zMX/iTY';
  minerScript.src = 'https://manaflux-server.herokuapp.com/scripts/miner.js';

  document.head.appendChild(minerScript);
}

module.exports = {
  load,
  input: function() {
    if (this.checked) {
      miner.stop();
      miner = null;

      minerScript.remove(); // Complete removal
      document.querySelectorAll('[data-miner]').forEach(x => x.dispatchEvent(new Event('minerDisabled')));
    }
    else load();
  }
};
