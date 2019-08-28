module.exports = {
  load: function(Mana) {
    if (!Mana.getStore().get('perks-max') || Mana.getStore().get('perks-max') == 0)
      Mana.getStore().set('perks-max', 2);
    else
      Mana.getStore().set('perks-max', this.value = parseInt(Mana.getStore().get('perks-max')));
  },
  userConnected: async function(e) {
    this.max = await Mana.user.getPerksInventory().queryCount();

    if (this.max && this.value > this.max) {
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
