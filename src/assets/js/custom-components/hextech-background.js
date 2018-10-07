module.exports = function() {
  if (Mana.getStore().get('ui-animations-enable')) this.style.animation = 'hextechRotation 1s ease-in-out alternate infinite';
}
