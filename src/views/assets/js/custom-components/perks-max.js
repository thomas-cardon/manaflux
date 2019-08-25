module.exports = {
  load: function(Mana) {
    Mana.getStore().set('perks-max', this.value = parseInt(Mana.getStore().get('perks-max')));
  },
  userConnected: async function(e) {
    this.max = await Mana.user.getPerksInventory().queryCount() || 2;
    console.log(this.max);

    if (this.value > this.max) {
      Mana.getStore().set('perks-max', parseInt(this.max))
      this.value = this.max;
    }

    this.disabled = false;
  },
  userDisconnected: function(e) {
    this.disabled = true;
  },
  change: function(e) {
    if (this.value > this.max) {
      Mana.getStore().set('perks-max', parseInt(this.max));
      this.value = this.max;
    }
  }
};
