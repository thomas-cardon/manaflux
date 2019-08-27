/* Tab Handler */
const Dots = {
	isEnabled: document.getElementById('dots') !== null,
	onClickEvent: function(dot, tabId, i) {
		document.querySelectorAll('app-tab').forEach(x => x.style.display = 'none');
		document.querySelector(`app-tab[data-tabid="${tabId}"][data-tabn="${i}"]`).style.display = 'block';

		if (!Dots.isEnabled || !dot) return;

		if (Dots.lastSelected)
			Dots.lastSelected.classList.remove('selected');

		dot.classList.add('selected');
		Dots.lastSelected = dot;

		Sounds.play('buttonClick');
	}
};

class Tab extends HTMLElement {
	constructor() {
		super();

		this.style.display = 'none';

		if (this.getPage() == 0)
			document.querySelector('button[data-tabid="' + this.getId() + '"]')
			.addEventListener('click', this.open);
	}

	getId() {
		return this.getAttribute('data-tabid');
	}

	getPage() {
		return this.getAttribute('data-tabn');
	}

	open(event) {
		Sounds.play('buttonClick');

		let active = document.querySelector('.tab.active');
		if (active) active.classList.remove('active');

		event.target.classList.add('active');

		const dotsNumber = document.querySelectorAll(`app-tab[data-tabid="${event.target.getAttribute('data-tabid')}"]`).length;

		if (dotsNumber === 0) Dots.onClickEvent(null, event.target.getAttribute('data-tabid'), 0);
		else if (Dots.isEnabled) {
			let dots = document.getElementById('dots');
			while (dots.firstChild) dots.removeChild(dots.firstChild);

			if (dotsNumber > 1)
				for (let i = 0; i < dotsNumber; i++) {
					const dot = document.createElement('div');

					dot.className = 'dot';
					dot.onclick = () => Dots.onClickEvent(dot, event.target.getAttribute('data-tabid'), i);
					dots.appendChild(dot);
				}

			Dots.onClickEvent(dots.firstChild, event.target.getAttribute('data-tabid'), 0);
		}

		document.getElementById('selected').style.left = event.target.offsetLeft + (event.target.offsetWidth / 2) - (document.getElementById('selected').offsetWidth / 2);

		if (Dots.isEnabled)
			document.getElementById('dots').style.left = event.target.offsetLeft + (event.target.offsetWidth / 2) - (document.getElementById('dots').offsetWidth / 2);
	}
}

window.customElements.define('app-tab', Tab);

document.addEventListener("DOMContentLoaded", function() {
	setTimeout(() => {
		if (document.querySelector('.btn.tab'))
			document.querySelector('.btn.tab').click();

		document.getElementById('system-loading').remove();
	}, 100);
});
