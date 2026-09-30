const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {webcrypto, createHash} = require('node:crypto');
const game = require('./game.js');
assert.deepEqual(game.order(4,()=>0),[0,1,2,3]);
assert.deepEqual(game.order(4,()=>.999),[3,2,1,0]);
const draws=[27,13,20,70,50];
assert.deepEqual(game.numbersForShuffle([1,2,0,4,3],1,99,(lo,hi)=>{const v=draws.shift();assert(v>=lo&&v<=hi);return v;}),[27,13,20,70,50]);
for (const n of [4,5,6]) for(let i=0;i<10000;i++){
 const p=game.order(n), a=game.numbersForShuffle(p);
 assert.equal(new Set(a).size,n); assert(a.every(v=>Number.isInteger(v)&&v>=1&&v<=99));
 assert.deepEqual(p.map(i=>a[i]),a.slice().sort((a,b)=>a-b));
}
assert.match(game.salt(),/^[A-Za-z]{32}$/);
function element(){return {style:{setProperty(){}},classList:{remove(){},add(){},toggle(){}},children:[],hidden:false,textContent:'',value:'4',setAttribute(){},append(){},addEventListener(){},focus(){},replaceChildren(...children){this.children=children;},querySelector(){return {focus(){}};}};}
async function round(sequence, mode, moves, expected){
 const els=new Map(); const get=id=>{if(!els.has(id))els.set(id,element());return els.get(id);};
 const context=vm.createContext({document:{getElementById:get,createElement:element,querySelector:()=>({value:mode}),querySelectorAll:()=>[]},GuessOrder:{...game,main:()=>sequence,salt:()=> 'Ab'.repeat(16)},crypto:webcrypto,TextEncoder,navigator:{}});
 vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, 'app.js'),'utf8'),context);
 await new Promise(r=>setTimeout(r,20));
 const hash=get('hash').textContent;assert.match(hash,/^[a-f0-9]{64}$/);
 for(const i of moves)vm.runInContext(`place(${i})`,context);
 assert.equal(get('result-title').textContent,expected);
 if(expected){assert.equal(createHash('sha256').update(get('original').textContent).digest('hex'),hash);assert.equal(get('reveal').hidden,false);}
 return {context,get};
}
(async()=>{
 await round([50,75,67,70],'keep',[0,3,1,2],'Congratulations!');
 await round([50,75,67,70],'early',[0,3,1,2],'Congratulations!');
 await round([50,75,67,70],'early',[1],'Nice try.');
 await round([50,75,67,70],'keep',[1],'');
 await round([50,75,67,70],'keep',[0,1],'Nice try.');
 await round([50,75,67,70],'keep',[2,0],'Nice try.');
 console.log('PASS: reference fixture, 30,000 generated rounds, both loss modes, wins, and commitment verification.');
})().catch(e=>{console.error(e);process.exitCode=1;});
