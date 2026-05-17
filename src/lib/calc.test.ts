import { calculate, eurToCent, centToEurDe } from "./calc";

function check(label: string, ok: boolean, info?: string) {
  if (ok) console.log("OK   ", label);
  else { console.error("FAIL ", label, info || ""); process.exit(1); }
}

// --- Test 1: Prompt örneği ---
const r1 = calculate({
  tagesumsatzCent: eurToCent("628,50"),
  anfangsbestandCent: eurToCent("100,00"),
  muenzenZielwertCent: eurToCent("50,00"),
});

console.log("\n=== Test 1: 628.50 + 100.00, Münzen-Ziel 50.00 ===");
console.log("Total :", centToEurDe(r1.totalCent), "EUR");
console.log("Gesamt I  (Banknoten):", centToEurDe(r1.gesamtICent));
console.log("Gesamt II (Münzen)   :", centToEurDe(r1.gesamtIICent));
console.log("Kassenbestand        :", centToEurDe(r1.kassenbestandCent));
console.log("Banknoten:");
for (const k of [50000, 20000, 10000, 5000, 2000, 1000, 500]) {
  console.log("  ", (k/100).toFixed(2).padStart(7), "EUR ×", r1.banknotes[k]);
}
console.log("Münzen:");
for (const k of [200, 100, 50, 20, 10, 5, 1]) {
  console.log("  ", (k/100).toFixed(2).padStart(7), "EUR ×", r1.coins[k]);
}

check("Total = 728.50",       r1.totalCent === 72850);
check("Kassenbestand = Total", r1.kassenbestandCent === r1.totalCent);
check("500€ = 0 adet",         r1.banknotes[50000] === 0);
check("200€ = 0 adet",         r1.banknotes[20000] === 0);
check("Gesamt I + II = Total", r1.gesamtICent + r1.gesamtIICent === r1.totalCent);
check("Münzen ≥ hedef 50€",    r1.gesamtIICent >= 5000);

// --- Test 2: Tam yuvarlak rakamlar ---
const r2 = calculate({
  tagesumsatzCent: eurToCent("1000,00"),
  anfangsbestandCent: eurToCent("0,00"),
  muenzenZielwertCent: eurToCent("0,00"),
});
check("1000€ test toplam doğru", r2.kassenbestandCent === 100000);

// --- Test 3: Küçük tutar ---
const r3 = calculate({
  tagesumsatzCent: eurToCent("12,37"),
  anfangsbestandCent: eurToCent("5,00"),
  muenzenZielwertCent: eurToCent("3,00"),
});
check("12.37+5.00 test toplam doğru", r3.kassenbestandCent === 1737);

// --- Test 4: Rastgele 100 girdi - tüm hepsi tam denk olmalı ---
function rand(maxCent: number) { return Math.floor(Math.random() * maxCent); }
let allOk = true;
for (let i = 0; i < 100; i++) {
  const u = rand(1000_00);
  const a = rand(500_00);
  const mz = Math.min(rand(100_00), u + a);
  const r = calculate({
    tagesumsatzCent: u, anfangsbestandCent: a, muenzenZielwertCent: mz
  });
  if (r.kassenbestandCent !== u + a) { allOk = false; console.error("DENK DEĞİL:", u, a, mz, "->", r.kassenbestandCent); }
  if (r.gesamtIICent < mz) { allOk = false; console.error("HEDEF ALTI:", u, a, mz, "Gesamt II:", r.gesamtIICent); }
  if (r.banknotes[50000] !== 0 || r.banknotes[20000] !== 0) { allOk = false; console.error("500/200 != 0"); }
}
check("100 rastgele girdi - hepsi mutabık", allOk);

console.log("\n✅ Tüm testler geçti");
