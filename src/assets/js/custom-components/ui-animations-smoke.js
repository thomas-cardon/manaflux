if (Mana.getStore().get('ui-animations-smoke')) {
  document.getElementById('smokeAnimation').play();
  document.getElementById('smokeAnimation').style.display = 'block';
}
else document.getElementById('smokeAnimation').style.display = 'none';

module.exports = {
  change: function(el) {
    document.getElementById('smokeAnimation').style.display = this.checked ? 'block' : 'none';

    if (this.checked) document.getElementById('smokeAnimation').play();
    else document.getElementById('smokeAnimation').pause();
  }
}
