module.exports = function(Mana) {
  if (Mana.getStore().get('ui-animations-enable')) this.style.animation = 'hextechRotation 1s ease-in-out alternate infinite';
}
