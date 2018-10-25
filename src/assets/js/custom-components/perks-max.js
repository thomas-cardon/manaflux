module.exports = {
  userConnected: async function(e) {
    this.max = await Mana.user.getPerksInventory().getCount() || 2;

    if (this.value > this.max) {
      Mana.getStore().set('perks-max', this.max)
      this.value = this.max;
    }

    this.disabled = false;
  },
  userDisconnected: function(e) {
    this.disabled = true;
  },
  change: function(e) {
    if (this.value > this.max) {
      Mana.getStore().set('perks-max', this.max)
      this.value = this.max;
    }
  }
};
