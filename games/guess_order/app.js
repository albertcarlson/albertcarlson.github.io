'use strict';
const $ = id => document.getElementById(id);
let numbers = [], slots = [], turn = 0, finished = true, original = '', mode = 'keep', generation = 0;
function drawSlots() {
  $('slots').style.setProperty('--count', slots.length);
  $('slots').replaceChildren(...slots.map((value, index) => {
    const button = document.createElement('button');
    button.className = 'slot' + (value === null ? '' : ' filled');
    button.disabled = finished || value !== null;
    button.textContent = value === null ? '+' : value;
    button.setAttribute('aria-label', `Slot ${index + 1}${value === null ? ', empty' : `, number ${value}`}`);
    const label = document.createElement('span');
    label.className = 'slot-index';
    label.textContent = String(index + 1).padStart(2, '0');
    button.append(label);
    button.addEventListener('click', () => place(index));
    return button;
  }));
}
function displayNumber() {
  $('step').textContent = `NUMBER ${turn + 1} OF ${numbers.length}`;
  $('current').textContent = numbers[turn];
  $('current').classList.remove('pop');
  void $('current').offsetWidth;
  $('current').classList.add('pop');
}
function end(won, reason) {
  finished = true;
  $('arrival').hidden = true;
  $('result').hidden = false;
  $('result').classList.toggle('won', won);
  $('result-icon').textContent = won ? '✦' : '↺';
  $('result-title').textContent = won ? 'Congratulations!' : 'Nice try.';
  $('result-copy').textContent = won ? 'All numbers in order.' : `Nice try, but the numbers were ${numbers.join(', ')}.\n${reason}`;
  $('answer').textContent = numbers.slice().sort((a, b) => a - b).join(' < ');
  $('original').textContent = original;
  $('reveal').hidden = false;
  drawSlots();
  $('again').focus({ preventScroll: true });
}
function place(index) {
  if (finished || slots[index] !== null) return;
  const value = numbers[turn];
  const fits = GuessOrder.canPlace(slots, index, value);
  slots[index] = value;
  if (!fits) { end(false, 'That placement breaks the order.'); return; }
  if (mode === 'early' && numbers.slice().sort((a, b) => a - b)[index] !== value) {
    end(false, 'That was not its final position.'); return;
  }
  turn++;
  if (turn === numbers.length) { end(true); return; }
  if (!slots.some((_, i) => GuessOrder.canPlace(slots, i, numbers[turn]))) {
    end(false, `${numbers[turn]} had nowhere to go.`); return;
  }
  drawSlots();
  displayNumber();
  $('slots').querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}
async function start() {
  const version = ++generation;
  finished = true;
  turn = 0;
  mode = document.querySelector('input[name="mode"]:checked').value;
  $('mode-help').textContent = mode === 'keep' ? 'Play until the next number has nowhere to go.' : 'A wrong final position ends the game immediately.';
  $('result').hidden = true;
  $('reveal').hidden = true;
  $('original').textContent = '';
  $('arrival').hidden = false;
  $('current').textContent = '—';
  $('step').textContent = 'PREPARING YOUR NUMBERS';
  $('prompt').textContent = 'Choose an empty slot below';
  $('hash').textContent = 'Calculating…';
  $('copy').textContent = 'Copy original string';
  slots = Array(Number($('size').value)).fill(null);
  drawSlots();
  try {
    if (!globalThis.crypto?.subtle) throw new Error('Secure context required');
    numbers = GuessOrder.main(slots.length);
    original = `${numbers.join(', ')}, ${GuessOrder.salt()}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(original));
    if (version !== generation) return;
    $('hash').textContent = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    finished = false;
    drawSlots();
    displayNumber();
  } catch (error) {
    if (version !== generation) return;
    $('step').textContent = 'COULD NOT START';
    $('prompt').textContent = 'Open this game over HTTPS or localhost to enable secure hashing.';
    $('hash').textContent = 'Commitment unavailable';
  }
}
$('again').addEventListener('click', start);
$('size').addEventListener('change', start);
document.querySelectorAll('input[name="mode"]').forEach(input => input.addEventListener('change', start));
$('copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(original); $('copy').textContent = 'Copied'; }
  catch { $('copy').textContent = 'Select the text above to copy'; }
});
start();
