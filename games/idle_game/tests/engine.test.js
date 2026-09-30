const { test } = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine');
test('starts at zero with Berlin and Rome; pays only on landing', () => {
  const s=E.fresh(),p=s.planes[0]; assert.equal(s.cash,0); assert.equal(s.unlocked,2); assert.equal(p.location,'BER');
  assert.equal(E.buy(s,'ticket'),false); E.depart(s,p,()=>0.5); assert.equal(p.flight.passengers,8);
  assert.equal(E.depart(s,p),false); const duration=p.flight.duration;
  E.tick(s,duration-0.01); assert.equal(s.cash,0); E.tick(s,0.01); assert.equal(s.cash,24); assert.equal(p.location,'FCO'); assert.equal(p.destination,'BER');
  E.tick(s,100); assert.equal(s.flights,1); assert.equal(p.flight,null);
});
test('demand, randomness, capacity and fare snapshots',()=>{
  const s=E.fresh(); s.levels.capacity=10; E.depart(s,s.planes[0],()=>0); assert.equal(s.planes[0].flight.passengers,9);
  s.levels.ticket=3; E.tick(s,20); assert.equal(s.cash,27);
  E.depart(s,s.planes[0],()=>1); assert.equal(s.planes[0].flight.passengers,13); assert.equal(s.planes[0].flight.fare,9);
});
test('every manager level dispatches at its exact delay',()=>{
  E.config.manager.delays.forEach((delay,i)=>{const s=E.fresh();s.levels.manager=i+1;E.tick(s,delay-0.01);assert.equal(s.planes[0].flight,null);E.tick(s,0.01);assert.ok(s.planes[0].flight);});
});
test('auto-dispatch can choose every unlocked destination but never its origin',()=>{
  for (let origin = 0; origin < 5; origin++) {
    const choices = E.config.cities.slice(0,5).filter((_,i)=>i!==origin);
    choices.forEach((expected,index)=>{
      const s=E.fresh(); s.unlocked=5; s.levels.manager=1;
      const p=s.planes[0]; p.location=E.config.cities[origin].id;
      p.destination=choices[0].id;
      E.tick(s,10,()=>(index+0.5)/choices.length);
      assert.equal(p.flight.to,expected.id);
      assert.notEqual(p.flight.to,p.location);
      assert.ok(E.valid(s));
    });
  }
});
test('auto-dispatch chooses anew after landing; manual departures keep selected route',()=>{
  const s=E.fresh();s.unlocked=4;s.levels.manager=E.config.manager.delays.length;
  const p=s.planes[0];p.destination='CDG';
  E.depart(s,p,()=>0.99);assert.equal(p.flight.to,'CDG');
  E.tick(s,p.flight.remaining,()=>0.5);assert.equal(p.location,'CDG');
  E.tick(s,1,()=>0.99);assert.equal(p.flight.to,'LHR');
  E.tick(s,p.flight.remaining,()=>0.5);
  E.tick(s,1,()=>0);assert.equal(p.flight.to,'BER');
});
test('offline simulation matches continuous simulation',()=>{
  const a=E.fresh();a.levels.manager=E.config.manager.delays.length;a.levels.passive=2; const b=structuredClone(a);
  E.tick(a,3600,()=>0.5);for(let i=0;i<36000;i++)E.tick(b,.1,()=>0.5);
  assert.equal(a.flights,b.flights);assert.ok(Math.abs(a.cash-b.cash)<0.001);assert.equal(a.passengers,b.passengers);
});
test('passive income needs no flying and price growth is exponential',()=>{
  const s=E.fresh();s.cash=100;assert.equal(E.buy(s,'passive'),true);assert.equal(s.cash,0);E.tick(s,20);assert.equal(s.cash,40);assert.equal(s.flights,0);assert.equal(E.cost(s,'passive'),Math.ceil(E.config.passive.cost * E.config.passive.growth));
});
test('airport order, new planes, speed upgrades and manager cap',()=>{
  const s=E.fresh();s.cash=1e12;const before=E.cost(s,'destinations');E.buy(s,'destinations');assert.equal(E.config.cities[s.unlocked-1].name,'Paris');assert.ok(E.cost(s,'destinations')>before);
  E.buy(s,'plane');assert.equal(s.planes[1].location,'BER');E.depart(s,s.planes[0]);const old=s.planes[0].flight.duration;E.buy(s,'speed');E.depart(s,s.planes[1]);assert.ok(s.planes[1].flight.duration<old);
  for(let i=0;i<E.config.manager.delays.length;i++)assert.equal(E.buy(s,'manager'),true);assert.equal(E.buy(s,'manager'),false);
  while(s.unlocked<E.config.cities.length)assert.equal(E.buy(s,'destinations'),true);assert.equal(E.buy(s,'destinations'),false);assert.ok(E.valid(s));
});
test('invalid saves and locked routes are rejected',()=>{
  const s=E.fresh();assert.ok(E.valid(s));s.planes[0].destination='JFK';assert.equal(E.depart(s,s.planes[0]),false);assert.equal(E.valid(s),false);
  assert.equal(E.valid(null),false);s.planes[0].destination='FCO';s.cash=NaN;assert.equal(E.valid(s),false);
});
