const tippy = require('tippy.js');

UI.tooltips = {
  load: function() {
    document.querySelectorAll('[data-tippy-content]').forEach(x => {
      x.setAttribute('data-tippy-content', i18n.__(x.getAttribute('data-tippy-content')));
      tippy(x);
    });
  }
}

document.addEventListener('DOMContentLoaded', UI.tooltips.load);
