module.exports = {
  change: function(el) {
    log.log(2, `[UI] Changed theme to ${this.value}`);
    $('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + this.value + "')");
  },
  settingsLoaded: function(el) {
    log.log(2, `[UI] Loading theme: ${this.value}`);
    $('body').css('background', "linear-gradient(to bottom, rgba(125, 185, 232, 0) -1%, rgba(50, 96, 122, 0) 65%, rgba(10, 49, 64, 0.8) 100%), url('./assets/img/" + this.value + "')");
  }
};
