module.exports = function(Mana) {
  if (!Mana.getStore().has('providers-order'))
    Mana.getStore().set('providers-order', Object.keys(Mana.providerHandler.providers).sort((a, b) => ['flux', 'championgg'].includes(b)));

  let enabled = Mana.getStore().get('providers-order').filter(x => Mana.providerHandler.providers[x]);
  let disabled = Object.keys(Mana.providerHandler.providers).filter(x => Mana.providerHandler.providers[x] && !Mana.getStore().get('providers-order').includes(x));

  function toggle() {
    if (this.style.opacity === '0.35') {
      this.style.opacity = 1;

      Mana.getStore().set('providers-order', [...Mana.getStore().get('providers-order'), this.id]);
      console.log(2, `[Providers order] Enabled: ${this.id}`);
    }
    else {
      this.style.opacity = '.35';

      Mana.getStore().set('providers-order', Mana.getStore().get('providers-order').filter(x => x !== this.id));
      console.log(2, `[Providers order] Disabled: ${this.id}`);
    }
  }

  let list = '';

  for (let i = 0; i < enabled.length; i++)
    list += `<li class="ui-state-default sortable-button" id="${enabled[i]}" style="opacity: 1">${Mana.providerHandler.providers[enabled[i]].name}</li>`;

  for (let i = 0; i < disabled.length; i++)
    list += `<li class="ui-state-default sortable-button" id="${disabled[i]}" style="opacity: .35">${Mana.providerHandler.providers[disabled[i]].name}</li>`;

  this.innerHTML = list;
  Array.from(this.children).forEach(x => x.addEventListener('click', toggle));

  $(this).css('list-style', 'disc inside').sortable({
    update: function(event, ui) {
      if (ui.item.css('opacity') === '0.35') return $('#providersOrder').sortable('cancel');

      let array = Array.from(document.querySelector('#providersOrder').children).filter(x => x.style.opacity == 1).map(x => x.id);

      Mana.getStore().set('providers-order', array);
      console.log(2, '[Providers Order] Changed value to:', array);

      Sounds.play('checkboxClick');
    }
  });
};
