// All economy and destination balancing lives here. No server is required.
const GAME_CONFIG = {
  saveKey: 'aeroclub-save-v1',
  startingCash: 0,
  ticket: { base: 3, step: 2, cost: 45, growth: 1.75 },
  capacity: { base: 8, step: 6, cost: 70, growth: 1.8 },
  speed: { base: 1, step: 0.25, cost: 90, growth: 1.9 },
  plane: { cost: 120, growth: 1.95 },
  manager: { delays: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], cost: 200, growth: 2.5 },
  passive: { incomePerLevel: 2, cost: 100, growth: 1.7 },
  destinations: { cost: 180, growth: 2.2 },
  ui: { compactFleetAbove: 4 },
  flights: { baseSeconds: 5, secondsPer1000Km: 2, minimumSeconds: 2, demandVariation: 0.25 },
  offlineLimitHours: 0.0833,
  cities: [
    { id: 'BER', name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.405, demand: 12 },
    { id: 'FCO', name: 'Rome', country: 'Italy', lat: 41.90, lon: 12.50, demand: 10 },
    { id: 'CDG', name: 'Paris', country: 'France', lat: 48.86, lon: 2.35, demand: 22 },
    { id: 'LHR', name: 'London', country: 'United Kingdom', lat: 51.51, lon: -0.13, demand: 30 },
    { id: 'SVO', name: 'Moscow', country: 'Russia', lat: 55.76, lon: 37.62, demand: 36 },
    { id: 'CAI', name: 'Cairo', country: 'Egypt', lat: 30.04, lon: 31.24, demand: 42 },
    { id: 'JFK', name: 'NYC', country: 'United States', lat: 40.71, lon: -74.01, demand: 60 },
    { id: 'LAX', name: 'LA', country: 'United States', lat: 34.05, lon: -118.24, demand: 68 },
    { id: 'PEK', name: 'Beijing', country: 'China', lat: 39.90, lon: 116.41, demand: 85 },
    { id: 'DEL', name: 'Delhi', country: 'India', lat: 28.61, lon: 77.21, demand: 100 },
    { id: 'HND', name: 'Tokyo', country: 'Japan', lat: 35.68, lon: 139.69, demand: 120 },
    { id: 'SYD', name: 'Sydney', country: 'Australia', lat: -33.87, lon: 151.21, demand: 132 },
    { id: 'CPT', name: 'Cape Town', country: 'South Africa', lat: -33.92, lon: 18.42, demand: 145 },
    { id: 'RBA', name: 'Rabat', country: 'Morocco', lat: 34.02, lon: -6.84, demand: 160 },
    { id: 'SCL', name: 'Santiago', country: 'Chile', lat: -33.45, lon: -70.67, demand: 175 },
    { id: 'NBO', name: 'Nairobi', country: 'Kenya', lat: -1.29, lon: 36.82, demand: 190 },
    { id: 'FOR', name: 'Fortaleza', country: 'Brazil', lat: -3.73, lon: -38.52, demand: 205 },
    { id: 'CGK', name: 'Jakarta', country: 'Indonesia', lat: -6.21, lon: 106.85, demand: 225 }
  ]
};
if (typeof module !== 'undefined') module.exports = GAME_CONFIG;
