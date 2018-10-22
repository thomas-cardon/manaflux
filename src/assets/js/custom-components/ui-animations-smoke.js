document.getElementById('smokeAnimation').style.display = Mana.getStore().get('ui-animations-smoke') ? 'block' : 'none';

module.exports = {
  change: function(el) {
    document.getElementById('smokeAnimation').style.display = this.checked ? 'block' : 'none';
  }
}
