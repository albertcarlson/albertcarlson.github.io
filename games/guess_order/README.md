# Guess the order

A static HTML/CSS/JavaScript game. Open `index.html` in a modern browser, or serve this directory using any static web server. Hosted versions need HTTPS (localhost also works) for Web Crypto hashing. No build step or Python runtime is required.

Choose 4, 5, or 6 numbers and a loss mode. Changing either setting starts a fresh round. Placements are final.

- **Keep you in:** continue while the next arrival can fit among the placed numbers. A placement that breaks ascending order also ends the round.
- **Terminate early:** each placement must match that number's final sorted position.

The generator ports `choose_numbers.py`, including its weighted recursive permutation and recursive margin bounds. Values remain in arrival order.

Before play, SHA-256 commits to `numbers.join(', ') + ', ' + salt`. The salt is 32 uniformly sampled ASCII letters using Web Crypto. The exact original string is revealed at either outcome, with a copy button. Hash its UTF-8 bytes without quotes or a trailing newline to verify.

Run the generator and gameplay checks with `node test.cjs`.

## Website integration

Listed on `/minigames.html` and served at `/games/guess_order/` by GitHub Pages. The game uses relative asset paths and links back to the minigames page. No additional build or deployment configuration is required; the site’s HTTPS enables Web Crypto.

From the repository root, run `node games/guess_order/test.cjs`.
