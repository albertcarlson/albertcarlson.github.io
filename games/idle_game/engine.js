(function (root) {
  'use strict';
  const config = typeof module !== 'undefined' ? require('./config.js') : GAME_CONFIG;
  const city = id => config.cities.find(c => c.id === id);
  const fresh = () => ({ version: 1, cash: config.startingCash, earned: 0, passengers: 0, flights: 0,
    unlocked: 2, levels: { ticket: 0, capacity: 0, speed: 0, manager: 0, passive: 0 },
    planes: [{ id: 1, location: 'BER', destination: 'FCO', flight: null, wait: 0 }] });
  function stats(s) {
    return { ticket: config.ticket.base + s.levels.ticket * config.ticket.step,
      capacity: config.capacity.base + s.levels.capacity * config.capacity.step,
      speed: config.speed.base + s.levels.speed * config.speed.step,
      passive: s.levels.passive * config.passive.incomePerLevel,
      delay: config.manager.delays[s.levels.manager - 1] ?? null };
  }
  function cost(s, type) {
    if (type === 'manager' && s.levels.manager >= config.manager.delays.length) return Infinity;
    if (type === 'destinations' && s.unlocked >= config.cities.length) return Infinity;
    const level = type === 'plane' ? s.planes.length - 1 : type === 'destinations' ? s.unlocked - 2 : s.levels[type];
    return Math.ceil(config[type].cost * config[type].growth ** level);
  }
  function buy(s, type) {
    if (!['ticket', 'capacity', 'speed', 'plane', 'manager', 'passive', 'destinations'].includes(type)) return false;
    const price = cost(s, type);
    if (!Number.isFinite(price) || s.cash < price) return false;
    s.cash -= price;
    if (type === 'plane') s.planes.push({ id: s.planes.length + 1, location: 'BER', destination: 'FCO', flight: null, wait: 0 });
    else if (type === 'destinations') s.unlocked++;
    else s.levels[type]++;
    return true;
  }
  function distance(a, b) {
    const rad = n => n * Math.PI / 180;
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lon - a.lon) / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  function depart(s, p, random = Math.random) {
    if (p.flight || p.location === p.destination || !config.cities.slice(0, s.unlocked).some(c => c.id === p.destination)) return false;
    const st = stats(s), from = city(p.location), to = city(p.destination);
    // Demand comes from the origin; big airports matter on the return trip too.
    const demand = Math.round(from.demand * (1 + (random() * 2 - 1) * config.flights.demandVariation));
    const passengers = Math.max(1, Math.min(st.capacity, demand));
    const duration = Math.max(config.flights.minimumSeconds, (config.flights.baseSeconds + distance(from, to) / 1000 * config.flights.secondsPer1000Km) / st.speed);
    p.flight = { from: from.id, to: to.id, passengers, fare: st.ticket, duration, remaining: duration };
    p.wait = 0;
    return true;
  }
  function credit(s, amount) { s.cash += amount; s.earned += amount; }
  function tick(s, seconds, random = Math.random) {
    if (!Number.isFinite(seconds) || seconds <= 0) return [];
    const events = [], st = stats(s);
    credit(s, st.passive * seconds);
    for (const p of s.planes) {
      let left = seconds;
      while (left > 0.000001) {
        if (p.flight) {
          const used = Math.min(left, p.flight.remaining);
          p.flight.remaining -= used; left -= used;
          if (p.flight.remaining <= 0.000001) {
            const f = p.flight, revenue = f.passengers * f.fare;
            credit(s, revenue); s.flights++; s.passengers += f.passengers;
            p.location = f.to; p.destination = f.from; p.flight = null; p.wait = 0;
            events.push({ plane: p.id, city: city(f.to).name, revenue, passengers: f.passengers });
          }
        } else if (st.delay !== null) {
          const used = Math.min(left, Math.max(0, st.delay - p.wait));
          p.wait += used; left -= used;
          if (p.wait >= st.delay) {
            const destinations = config.cities.slice(0, s.unlocked).filter(c => c.id !== p.location);
            if (!destinations.length) break;
            // Choose uniformly on each automatic departure; manual routing is unchanged.
            p.destination = destinations[Math.min(destinations.length - 1, Math.floor(random() * destinations.length))].id;
            if (!depart(s, p, random)) break;
          }
        } else break;
      }
    }
    return events;
  }
  function valid(s) {
    const nonneg = x => Number.isFinite(x) && x >= 0;
    if (!s || s.version !== 1 || !['cash','earned','passengers','flights'].every(k => nonneg(s[k])) || !Number.isInteger(s.unlocked) || s.unlocked < 2 || s.unlocked > config.cities.length) return false;
    if (!s.levels || !['ticket','capacity','speed','manager','passive'].every(k => Number.isInteger(s.levels[k]) && s.levels[k] >= 0 && s.levels[k] <= 10000) || s.levels.manager > 10) return false;
    const ids = config.cities.slice(0, s.unlocked).map(c => c.id);
    return Array.isArray(s.planes) && s.planes.length > 0 && s.planes.length <= 10000 && s.planes.every((p, i) => p.id === i + 1 && ids.includes(p.location) && ids.includes(p.destination) && p.location !== p.destination && nonneg(p.wait) && (!p.flight || (ids.includes(p.flight.from) && ids.includes(p.flight.to) && p.flight.from === p.location && p.flight.to === p.destination && nonneg(p.flight.fare) && Number.isInteger(p.flight.passengers) && p.flight.passengers > 0 && p.flight.duration > 0 && Number.isFinite(p.flight.duration) && nonneg(p.flight.remaining) && p.flight.remaining <= p.flight.duration)));
  }
  const api = { config, city, fresh, stats, cost, buy, depart, tick, valid, distance };
  if (typeof module !== 'undefined') module.exports = api; else root.Airline = api;
})(typeof window !== 'undefined' ? window : globalThis);
