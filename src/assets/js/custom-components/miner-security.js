module.exports = {
  minerDisabled: function() {
    this.style.display = 'block';

    document.querySelector('[data-i18n="support-paypal-button"]').parentElement.style.width = '100%'; // Prevent height problems
    document.querySelectorAll('.support-option').forEach(x => x.style.display = 'none');
  },
  minerLoaded: function() {
    this.style.display = 'none';

    document.querySelector('[data-i18n="support-paypal-button"]').parentElement.style.width = null;
    document.querySelectorAll('.support-option').forEach(x => x.style.display = 'block');
  }
};
