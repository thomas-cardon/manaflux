class StatisticsHandler {

  display(champion, data) {
    data = {
      position: 'support',
      stats: {
        winrate: { avg: '42.68%', rolePlacement: '49/49', patchChange: '-2' },
        playrate: { avg: '0.22%', rolePlacement: '48/49', patchChange: '-1' },
        banrate: { avg: '0.08%', rolePlacement: '37/49', patchChange: '+5' },
        k: { avg: '6.20', rolePlacement: '49/49', patchChange: '-2' },
        d: { avg: '6.94', rolePlacement: '49/49', patchChange: '-2' },
        a: { avg: '8.29', rolePlacement: '49/49', patchChange: '-2' },
        overall: { rolePlacement: '7/49', patchChange: '+5' }
      },
      matchups: {
        counters: {
          1: { games: 1989, wr: 17, position: 'MIDDLE' },
          2: { games: 1320, wr: 39, position: 'MIDDLE' },
          3: { games: 1874, wr: 41.90, position: 'MIDDLE' },
          4: { games: 1989, wr: 44.90, position: 'MIDDLE' },
          5: { games: 1320, wr: 44.55, position: 'MIDDLE' },
          6: { games: 1874, wr: 44.95, position: 'MIDDLE' },
          7: { games: 1989, wr: 45.95, position: 'MIDDLE' },
          8: { games: 1320, wr: 46.95, position: 'MIDDLE' },
          9: { games: 1874, wr: 47.95, position: 'MIDDLE' },
          10: { games: 1989, wr: 48.95, position: 'MIDDLE' },
          11: { games: 1320, wr: 49.95, position: 'MIDDLE' },
          12: { games: 1874, wr: 50.95, position: 'SUPPORT', link: 'https://champion.gg/champion/Alistar/Support' }
        },
        synergies: {
          1: { games: 1989, wr: 17, position: 'MIDDLE' },
          2: { games: 1320, wr: 39, position: 'MIDDLE' },
          3: { games: 1874, wr: 41.90, position: 'MIDDLE' },
          4: { games: 1989, wr: 44.90, position: 'MIDDLE' },
          5: { games: 1320, wr: 44.55, position: 'MIDDLE' },
          6: { games: 1874, wr: 44.95, position: 'MIDDLE' },
          7: { games: 1989, wr: 45.95, position: 'MIDDLE' },
          8: { games: 1320, wr: 46.95, position: 'MIDDLE' },
          9: { games: 1874, wr: 47.95, position: 'MIDDLE' },
          10: { games: 1989, wr: 48.95, position: 'MIDDLE' },
          11: { games: 1320, wr: 49.95, position: 'MIDDLE' },
          12: { games: 1874, wr: 50.95, position: 'SUPPORT', link: 'https://champion.gg/champion/Alistar/Support' }
        }
      }
    };

    this.displayStatistics(champion, data);
    this.displayMatchups(champion, data);
  }

  displayStatistics(champion, data) {
    let content = document.getElementById('statistics'), html = `
    <div class="statistics-portrait">
      <img id="champion" src="${champion.img}">
      <img id="hextechAnimationBackground" data-custom-component="hextech-background" onload="UI.loadCustomComponent(this)" src="assets/img/vfx-white.png">
      <p id="statistics-champion-name">${champion.name}<br>${UI.stylizeRole(data.position)}</p>
    </div>
    <p style="text-align: left;">
      <span style="color: #ffff;">${i18n.__('statistics-stats-generic-name')}</span>
      <span style="position: absolute; left: 150px; color: #e58e26;">${i18n.__('statistics-stats-generic-avg')}</span>
      <span style="position: absolute; left: 250px; color: #38ada9;">${i18n.__('statistics-stats-generic-role-placement')}</span>
      <span style="position: absolute; left: 400px; color: #78e08f;">(${i18n.__('statistics-stats-generic-patch-change')})</span>
    </p>`;

    for (const [key, value] of Object.entries(data.stats)) {
      if (key === 'overall') continue;

      html += `<p style="text-align: left;">
        <span style="color: #ffff;">${i18n.__('statistics-stats-' + key)}</span>
        <span style="position: absolute; left: 150px; color: #e58e26;">${value.avg}</span>
        <span style="position: absolute; left: 250px; color: #38ada9;">${value.rolePlacement}</span>
        <span style="position: absolute; left: 400px; color: #78e08f;">(${value.patchChange})</span>
      </p>`;
    }

    content.innerHTML = html;
  }

  displayMatchups(champion, data) {
    let content = document.getElementById('matchup'), html = `<div class="matchup-list" id="counters"><p style="color: #ffb142;font-size: 21px;margin: -3% 0 3%;">${i18n.__('statistics-counter-you')}</p>`;

    let length = Object.keys(data.matchups.counters).length;
    let sorted = Object.entries(data.matchups.counters).sort((a, b) => b[1].wr - a[1].wr);
    let vsPlus = sorted.slice(0, length / 2), vsMinus = sorted.slice(length / 2).sort((a, b) => a[1].wr - b[1].wr);

    for (const [key, value] of vsPlus) {
      html += `<div class="matchup matchup-left">
        <img src="${Mana.champions[key].img}" />
        <div class="champion-data">
          <span style="color: #dcdde1;">${i18n.__('statistics-games', value.games)}</span>
          <progress class="matchup-progress matchup-progress-counter" id="progress-vs-${key}" max="100" value="${value.wr}" data-label="${value.wr}%">
          </progress>
        </div>
      </div>`;
    }
    html += `</div><div class="matchup-list" id="synergies"><p style="color: #b33939;font-size: 21px;margin: -3% 0 3%;">${i18n.__('statistics-counter-them')}</p>`;
    for (const [key, value] of vsMinus) {
      html += `<div class="matchup matchup-right">
        <div class="champion-data">
          <span style="color: #dcdde1;">${i18n.__('statistics-games', value.games)}</span>
          <progress class="matchup-progress matchup-progress-synergy" id="progress-vs-${key}" max="100" value="${value.wr}" data-label="${value.wr}%"></progress>
        </div>
        <img src="${Mana.champions[key].img}" />
      </div>`;
    }

    content.innerHTML = html + '</div>';
  }
}

module.exports = StatisticsHandler;
