# Manaflux

A dead simple runes (and now summoner spells + itemsets !) downloader for League of Legends.

![ManaFlux Main Page](screenshots/1.png "Main page")

> Support for English and French has been added ! It's automatic: ManaFlux will use your system to know what language it's supposed to load.

## Key Features
- Automatic Runes, Item Sets, and Summoner Spells downloading
- Ability to change positions (roles, e.g MIDDLE, TOP) using the User Interface or the shortcuts
<kbd>Alt+Left Arrow</kbd> or <kbd>Alt+Right Arrow</kbd>
- You can hide it automatically in taskbar when you're not in champion select
- Instead of controlling your mouse to setup your runes, ManaFlux injects them directly in the client, so you don't have to do anything but pick your champion.

## Getting Started

#### Windows
 > Download the last .exe file in the releases tab, and execute it. That's all !
 The software will be installed on your computer then launched.

#### Mac OS X and Linux
 > You'll need to clone and build it by yourself: `npm install && electron .` Support is unofficial, but if you find an issue feel free to open a ticket.


## Will I get banned if I use this ?
> Nope. As stated by a Rioter named RiotSargonas [here](https://www.reddit.com/r/leagueoflegends/comments/80d4r0/runebook_the_ultimate_rune_pages_manager_that_you/duv2r22), things that interact with the desktop client (not the game) will never get you banned.

### Built with
- [Electron](https://electronjs.org/)
- [NodeJS](https://nodejs.org)
- Web Technologies: HTML5, CSS3 and JavaScript for rendering
- Theme inspired from League of Legends
- [LeaguePlug](https://github.com/Ryzzzen/leagueplug), Simplifies the connection to League of Legends client
