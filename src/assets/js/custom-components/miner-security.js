module.exports = {
  minerDisabled: function() {
    this.style.display = 'unset';
    document.querySelectorAll('.support-option').forEach(x => x.style.display = 'none');
  },
  minerLoaded: function() {
    this.style.display = 'none';
    document.querySelectorAll('.support-option').forEach(x => x.style.display = 'unset');
  }
};
