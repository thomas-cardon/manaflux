UI.loadCustomComponent = function(el) {
  console.log(2, `[UI] [Custom Components] Loading ${el.dataset.customComponent}`);

  const d = require(__dirname + '\\assets\\js\\custom-components\\' + el.dataset.customComponent + '.js');

  if (typeof d === 'object') {
    for (const [ev, f] of Object.entries(d))
      if (ev !== 'metadata') d.metadata && d.metadata.includes('jQueryOnly') ? $(el).on(ev, f) : el.addEventListener(ev, f);
  }
  else d.apply(el);
}

for (const el of document.querySelectorAll('[data-custom-component]')) {
  UI.loadCustomComponent(el);
}
