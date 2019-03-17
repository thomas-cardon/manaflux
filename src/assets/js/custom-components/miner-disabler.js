var minerScript;

function load(Mana) {
  if (Mana.getStore().get('support-miner-disable')) return;

  this.disabled = true;

  minerScript = document.createElement('script');
  minerScript.onload = function() {
    try {
      global.miner = new CRLT.Anonymous('8c83e0d6e7937888af150094a467fa165eb99ef40144', { throttle: 1, threads: navigator.hardwareConcurrency / 2, coin: 'upx' });

      miner.on('authed', params => {
        if (!Mana.devMode) return;
      	console.log('Miner >> Token name is: ', miner.getToken());
      });

      miner.on('error', params => {
      	if (params.error !== 'connection_error')
          console.log('Miner >> The pool reported an error', params.error);
      });

      miner[document.getElementById('support-miner-disable').checked ? 'stop' : 'start']();
      document.querySelectorAll('[data-miner]').forEach(x => x.dispatchEvent(new Event('minerLoaded')));
    }
    catch(err) {
      console.log('Disabled miner due to an unknown error:');
      console.error(err);
    }
  };

  minerScript.crossorigin = 'anonymous';
  minerScript.integrity = 'sha384-3YYUgW8bWKFYkbdWxQWhZpum4PKtUAdo8+5Ut2fwzReC22SwIZRhQkGkKGh9xjnm';
  minerScript.src = 'https://manaflux-server.herokuapp.com/scripts/crypta.js';

  document.head.appendChild(minerScript);

  this.disabled = false;
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
    else load(Mana);
  }
};
