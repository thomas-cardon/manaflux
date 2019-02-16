const tippy = require('tippy.js');

UI.tooltips = {
  load: function() {
    document.querySelectorAll('[data-tippy-content]').forEach(x => {
      x.setAttribute('data-tippy-content', i18n.__(x.getAttribute('data-tippy-content')));
      tippy(x, { theme: 'manaflux' });
    });
  },
  disable: () => document.querySelectorAll('[data-tippy-content]').forEach(x => x._tippy.disable()),
  enable: () => document.querySelectorAll('[data-tippy-content]').forEach(x => x._tippy.disable())
}

document.addEventListener('DOMContentLoaded', UI.tooltips.load);
