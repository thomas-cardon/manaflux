module.exports = function() {
  if (miner) return;
  
  this.style.display = 'unset';
  document.querySelectorAll('.support-option').forEach(x => x.style.display = 'none');
}
