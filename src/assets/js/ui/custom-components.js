UI.loadCustomComponents = function(Mana) {
  for (const el of document.querySelectorAll('[data-custom-component]')) {
    console.log(2, `[UI] [Custom Components] Loading ${el.dataset.customComponent}`);

    const d = require(__dirname + '\\..\\src\\assets\\js\\custom-components\\' + el.dataset.customComponent + '.js');

    if (typeof d === 'object') {
      for (const [ev, f] of Object.entries(d))
        if (ev === 'load') f.call(el, Mana);
        else if (ev !== 'metadata') d.metadata && d.metadata.includes('jQueryOnly') ? $(el).on(ev, f) : el.addEventListener(ev, f);
    }
    else d.call(el, Mana);
  }
}

for (const el of document.querySelectorAll('[data-custom-component]')) {
  UI.loadCustomComponent(el);
}
