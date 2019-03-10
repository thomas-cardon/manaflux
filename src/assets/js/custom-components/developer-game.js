module.exports = {
  userConnected: function(e) {
    this.disabled = false;
  },
  userDisconnected: function(e) {
    this.disabled = true;
  },
  click: function(e) {
    this.disabled = true;
    setTimeout(() => this.disabled = false, 3000);
    
    _devChampionSelect();
  }
};
