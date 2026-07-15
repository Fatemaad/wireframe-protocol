const fs=require("fs");const h=fs.readFileSync(__dirname+"/index.html","utf8");
const BODY={
 chill:t=>`Honored ... powered by ${t.U}. #Axie sponsors ${t.S} people ${t.P} ${t.L}`,
 hyped:t=>`IT'S ON ... powered by ${t.U} ... #Axie sponsors ${t.S} made real by ${t.P} ${t.L}`,
 unhinged:t=>`Wired in ... powered by ${t.U} ... #Axie sponsors ${t.S} crew ${t.P} ${t.L}`
};
const PLAT={li:{U:"@unicorn-mafia",S:"@anthropicresearch @modal-labs @linkup-platform @elevenlabs @bambulab",P:"@fatemaalkhalifa @povilasdumcius @lamis-mukta",L:"axiometa.io"},x:{U:"@unicorn_mafia",S:"@AnthropicAI @modal @BambulabGlobal linkup",P:"@fatemallk @dumciusP",L:"https://t.co/PkQtAArwF1"}};
const c={
 "no feral line": !h.includes("feral"),
 "platform toggle present": h.includes('data-plat="li"')&&h.includes('data-plat="x"'),
 "LI sponsors in msg": h.includes("@anthropicresearch @modal-labs @linkup-platform @elevenlabs @bambulab"),
 "LI people incl lamis": h.includes("@fatemaalkhalifa @povilasdumcius @lamis-mukta"),
 "X sponsors in msg": h.includes("@AnthropicAI @modal @BambulabGlobal linkup"),
 "unicorn LI+X": h.includes("@unicorn-mafia")&&h.includes("@unicorn_mafia"),
 "link both platforms": h.includes("axiometa.io")&&h.includes("https://t.co/PkQtAArwF1"),
 "scoped active only": !h.includes("document.querySelectorAll('.hype-btn').forEach(x=>x.classList.remove"),
 "buildMsg + setPlat defined": h.includes("function buildMsg()")&&h.includes("function setPlat("),
 "script balanced":(h.match(/<script>/g)||[]).length===(h.match(/<\/script>/g)||[]).length
};
let ok=true;for(const[k,v]of Object.entries(c)){console.log((v?"PASS":"FAIL")+"  "+k);if(!v)ok=false;}
console.log(ok?"ALL GOOD":"CHECK");
