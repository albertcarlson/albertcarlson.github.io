(function (root) {
  'use strict';
  const CDFS = {
    2: [1 / 2, 1], 3: [2 / 5, 3 / 5, 1],
    4: [5 / 14, 7 / 14, 9 / 14, 1],
    5: [14 / 42, 19 / 42, 23 / 42, 28 / 42, 1],
    6: [42 / 132, 56 / 132, 66 / 132, 76 / 132, 90 / 132, 1]
  };
  function randomInt(min, max) {
    const range = max - min + 1;
    const limit = Math.floor(4294967296 / range) * range;
    const word = new Uint32Array(1);
    do { root.crypto.getRandomValues(word); } while (word[0] >= limit);
    return min + word[0] % range;
  }
  function order(n, random = Math.random) {
    if (!Number.isInteger(n) || n < 0 || n > 6) throw new RangeError('Choose 0–6 numbers.');
    const result = Array(n);
    let next = 0;
    function fill(size, shift) {
      if (!size) return;
      if (size === 1) { result[shift] = next++; return; }
      const p = random();
      const offset = CDFS[size].findIndex(value => value > p);
      result[shift + offset] = next++;
      fill(offset, shift);
      fill(size - offset - 1, shift + offset + 1);
    }
    fill(n, 0);
    return result;
  }
  function numbersForShuffle(permutation, low = 1, high = 99, integer = randomInt) {
    const n = permutation.length;
    if (permutation.slice().sort((a, b) => a - b).some((v, i) => v !== i)) throw new Error('Invalid permutation.');
    if (high - low + 1 < 2 ** n - 1) throw new RangeError('Not enough room.');
    const numbers = Array(n);
    function fill(start, stop, lower, upper) {
      const size = stop - start;
      if (!size) return;
      let idx = start;
      for (let i = start + 1; i < stop; i++) if (permutation[i] < permutation[idx]) idx = i;
      const margin = 2 ** (size - 1) - 1;
      const value = integer(lower + margin, upper - margin);
      numbers[permutation[idx]] = value;
      fill(start, idx, lower, value - 1);
      fill(idx + 1, stop, value + 1, upper);
    }
    fill(0, n, low, high);
    return numbers;
  }
  function main(n) { return numbersForShuffle(order(n)); }
  function canPlace(slots, index, value) {
    return slots[index] === null && slots.every((other, i) => other === null || (i < index ? other < value : other > value));
  }
  function salt() {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    return Array.from({ length: 32 }, () => alphabet[randomInt(0, 51)]).join('');
  }
  const api = { order, numbersForShuffle, main, canPlace, salt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GuessOrder = api;
})(globalThis);
