# Aeroclub

A small airline idle game made with plain JavaScript, HTML, and CSS. No build step or dependencies.

## Play

On the website, open `/games/idle_game/` from the Minigames page. The game is a static directory: include its HTML, CSS, JavaScript, and `world-map.svg` when publishing the repository through GitHub Pages. No build step or backend is required.

For a local preview of the whole site, run `python3 -m http.server 8000` from the repository root, then open `http://localhost:8000/minigames.html`. This also makes the game's “Back to minigames” link work locally.

Open `index.html` in a browser. Alternatively, run `python3 -m http.server 8000` in this directory and visit `http://localhost:8000`. Use the same browser and URL to retain your save. External Google Fonts are optional; system fonts work offline.

Saves belong to the browser origin. Progress from a local file or localhost does not automatically transfer to the GitHub Pages website.

Click your plane or **Click to depart**. Eight passengers at $3 each earns $24 when the first flight lands. Select a new destination while a plane is at the gate. Airport purchases unlock from Paris through Rabat, then Santiago (Chile), Nairobi, Fortaleza, and Jakarta. Managers choose a random unlocked destination on every automatic departure, excluding the current airport. The destination selector controls manual departures.

With more than four planes, the fleet switches to compact cards. All route, revenue, progress, and departure controls remain available. Adjust this threshold with `ui.compactFleetAbove` in `config.js`.

## Tune the game

Edit `config.js`: one configuration object controls initial cash, upgrade base prices and exponential growth, fares, seats, speed, passive income, manager delays, offline cap, and city coordinates/demand. It is a JavaScript object rather than fetched JSON so opening the game directly from disk works.

Airport demand is deliberately fictional gameplay balancing. Each departure draws origin demand ±25%, then caps at available seats. A flight locks its fare, passenger count, and travel time at departure. Speed and capacity upgrades apply fleet-wide to subsequent departures. Ticket revenue is passengers × fare, credited only on arrival.

Manager levels wait 10 / 9 / ... / 3 / 2 / 1 seconds at the gate. Passive services pay every second independently of planes. Time away is simulated for up to eight hours, including in-progress flights and manager departures. Without a manager, landed aircraft stay parked.

Progress saves in browser localStorage every three seconds, after purchases/departures, and when leaving the page. A save failure is shown in the header. Use one tab at a time for the same airline; browser storage is not cloud sync. **New airline** asks before resetting progress.

## Files and tests

- `engine.js`: economy, flight simulation, and save validation, independent of the UI.
- `app.js`: browser interactions, map, rendering, local save.
- `style.css`: responsive desktop/mobile presentation.
- `tests/engine.test.js`: run with `node --test tests/engine.test.js` (Node 18+).

The route map uses public-domain Natural Earth 1:110m land geometry, projected with the same coordinates as the airport markers. See `MAP-LICENSE.md`.
