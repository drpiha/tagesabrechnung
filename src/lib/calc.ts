/**
 * Tagesabrechnung hesaplama motoru.
 * TÜM aritmetik TAM SAYI (cent) ile yapılır.
 * Hiçbir yerde float yok -> 0.01 EUR hatası matematiksel olarak imkânsız.
 */

export const BANKNOTE_CENTS = [50000, 20000, 10000, 5000, 2000, 1000, 500] as const;
//                            500€, 200€,  100€,  50€,  20€,  10€,  5€
export const COIN_CENTS     = [200, 100, 50, 20, 10, 5, 2, 1] as const;
//                            2€,  1€,  0.50,0.20,0.10,0.05,0.02,0.01

// Promt kuralı: 500 ve 200 her zaman 0 adet
const ALLOWED_BANKNOTE_CENTS = [10000, 5000, 2000, 1000, 500] as const;

export type Counts = Record<number, number>;

export interface CalcInput {
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  muenzenZielwertCent: number;
  ausgabenCent?: number;
}

export interface CalcResult {
  totalCent: number;
  banknotes: Counts;
  coins: Counts;
  gesamtICent: number;
  gesamtIICent: number;
  kassenbestandCent: number;
}

export function eurToCent(value: string | number): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Geçersiz sayı");
    return Math.round(value * 100);
  }
  const s = String(value).trim();
  if (!s) return 0;
  let normalized: string;
  if (s.includes(",")) {
    normalized = s.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s.replace(/\s/g, "");
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) throw new Error("Geçersiz tutar: " + value);
  return Math.round(n * 100);
}

export function centToEurDe(cent: number): string {
  const sign = cent < 0 ? "-" : "";
  const abs = Math.abs(cent);
  const e = Math.floor(abs / 100);
  const c = abs % 100;
  const eStr = e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return sign + eStr + "," + c.toString().padStart(2, "0");
}

export function centToEurEn(cent: number): string {
  const sign = cent < 0 ? "-" : "";
  const abs = Math.abs(cent);
  const e = Math.floor(abs / 100);
  const c = abs % 100;
  const eStr = e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + eStr + "." + c.toString().padStart(2, "0");
}

/**
 * Banknot dağıtımı — rastgele ama gerçekçi.
 *
 * Her denomination (100, 50, 20, 10, 5) için kalan bütçeye sığabilenin
 * rastgele bir oranı (%55–%100) kadar adet alınır; küçük denomination'lar
 * artan miktarı toplar. En küçük (5 €) kalanın tamamını alır.
 *
 * — Toplam == bütçe (kalan cent madeni paraya aktarılır)
 * — Bütçe yeterliyse ≥2 farklı denomination > 0 garanti edilir
 */
function distributeBanknotes(budgetCent: number): { counts: Counts; remainderCent: number } {
  const counts: Counts = { 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0 };
  let remaining = budgetCent;
  if (remaining < 500) return { counts, remainderCent: remaining };

  const denoms = ALLOWED_BANKNOTE_CENTS; // [10000, 5000, 2000, 1000, 500]
  const rand = (min: number, max: number) => min + Math.random() * (max - min);

  for (let i = 0; i < denoms.length; i++) {
    const d = denoms[i]!;
    if (remaining < d) continue;
    const maxFit = Math.floor(remaining / d);
    let count: number;
    if (i === denoms.length - 1) {
      // 5 € — kalanın hepsini al
      count = maxFit;
    } else {
      const ratio = rand(0.55, 1.0);
      count = Math.floor(maxFit * ratio);
      // Tek denomination'a düşme riskini azalt: en büyük denomination
      // her zaman maxFit'in altında kalsın (en az 1 birim küçüklere bırakılsın)
      if (i === 0 && count === maxFit && maxFit > 1) count = maxFit - 1;
    }
    counts[d] = count;
    remaining -= count * d;
  }

  enforceMinTwoBanknotes(counts, budgetCent);
  return { counts, remainderCent: remaining };
}

/**
 * Tek banknot denomination'ına düşme durumunda 1 birim alıp daha küçük
 * denomination karışımına çevirir. Toplam korunur.
 */
function enforceMinTwoBanknotes(counts: Counts, budget: number) {
  const nonzero = [10000, 5000, 2000, 1000, 500].filter((d) => (counts[d] ?? 0) > 0);
  if (nonzero.length >= 2) return;
  if (budget < 1000) return;
  const d = nonzero[0]!;
  if (d === 10000 && counts[10000]! >= 1) {
    // 100 € → 1×50 + 2×20 + 1×10 = 100
    counts[10000]!--;
    counts[5000] = (counts[5000] || 0) + 1;
    counts[2000] = (counts[2000] || 0) + 2;
    counts[1000] = (counts[1000] || 0) + 1;
  } else if (d === 5000 && counts[5000]! >= 1) {
    // 50 € → 2×20 + 1×10 = 50
    counts[5000]!--;
    counts[2000] = (counts[2000] || 0) + 2;
    counts[1000] = (counts[1000] || 0) + 1;
  } else if (d === 2000 && counts[2000]! >= 1) {
    // 20 € → 1×10 + 2×5 = 20
    counts[2000]!--;
    counts[1000] = (counts[1000] || 0) + 1;
    counts[500]  = (counts[500]  || 0) + 2;
  }
  // 10 € ve 5 € tek denomination olarak kabul — sığabilecek başka banknot yok
}

/**
 * Madeni para dağıtımı — gerçekçi, dengeli, hafif rastgele.
 *
 * 1) Alt-€ kısmı (0–99 cent) açgözlü dağıtılır: 50, 20, 10, 5, 1.
 * 2) Tam € kısmı 4 ana denomination arasında rastgele ağırlıklarla dağıtılır:
 *      2.00 € : %25–%45
 *      1.00 € : %25–%40
 *      0.50 € : %10–%20  (ÇİFT adet — tam €)
 *      0.20 € : %5–%15   (BEŞER — tam €)
 *    Yuvarlama sonrası kalan tam € en uygun denomination'a eklenir.
 * 3) En az 2 farklı denomination > 0 garanti edilir (mümkün olduğunda).
 * 4) Toplam == girdi (integer cent) — sağlamlık kontrolü.
 */
function distributeCoins(totalCent: number): Counts {
  const counts: Counts = { 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 };
  if (totalCent <= 0) return counts;

  // 1) Alt-€: 0-99 cent → açgözlü 50, 20, 10, 5, 2, 1
  let sub = totalCent % 100;
  for (const c of [50, 20, 10, 5, 2, 1] as const) {
    if (sub >= c) {
      const n = Math.floor(sub / c);
      counts[c] += n;
      sub -= n * c;
    }
  }

  let euros = Math.floor(totalCent / 100);
  if (euros <= 0) {
    enforceMinTwoDenominations(counts, totalCent);
    return counts;
  }

  // 2) Tam € kısmı için rastgele ağırlıklar
  // Her ağırlık [min, max] aralığında uniform rastgele; sonra ölçeklenir.
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  let w200 = rand(0.25, 0.45);
  let w100 = rand(0.25, 0.40);
  let w50  = rand(0.10, 0.20);
  let w20  = rand(0.05, 0.15);
  const sumW = w200 + w100 + w50 + w20;
  w200 /= sumW; w100 /= sumW; w50 /= sumW; w20 /= sumW;

  // 0.50 € ÇİFT adet: en yakın çift adede yuvarla (her çift = 1 €)
  let pairs50 = Math.round(euros * w50);          // pair count = €
  if (pairs50 < 0) pairs50 = 0;
  if (pairs50 > euros) pairs50 = euros;

  // 0.20 € BEŞER adet: her quintet = 1 €
  let quints20 = Math.round(euros * w20);
  if (quints20 < 0) quints20 = 0;
  if (pairs50 + quints20 > euros) quints20 = Math.max(0, euros - pairs50);

  // 2.00 € (her piyes 2 €) — kalan €'ları geçmeyecek şekilde
  const remainingEurosAfter50_20 = euros - pairs50 - quints20;
  let n200 = Math.floor((remainingEurosAfter50_20 * (w200 / (w200 + w100))) / 2);
  if (n200 < 0) n200 = 0;
  if (n200 * 2 > remainingEurosAfter50_20) n200 = Math.floor(remainingEurosAfter50_20 / 2);

  // 1.00 € — kalan tam €
  const n100 = remainingEurosAfter50_20 - n200 * 2;

  counts[200] += n200;
  counts[100] += n100;
  counts[50]  += pairs50 * 2;
  counts[20]  += quints20 * 5;

  // 3) Sağlamlık kontrolü
  const sum =
    counts[200]! * 200 +
    counts[100]! * 100 +
    counts[50]!  *  50 +
    counts[20]!  *  20 +
    counts[10]!  *  10 +
    counts[5]!   *   5 +
    counts[2]!   *   2 +
    counts[1]!   *   1;
  if (sum !== totalCent) {
    throw new Error(`İç hata: madeni toplam ${sum} != ${totalCent}`);
  }

  // 4) En az 2 farklı denomination > 0 olsun
  enforceMinTwoDenominations(counts, totalCent);
  return counts;
}

/**
 * Eğer sadece tek bir denomination > 0 ise, 1 birimini iki farklı küçük
 * denomination'a böler. Toplam korunur. (totalCent çok küçükse zorlamaz.)
 */
function enforceMinTwoDenominations(counts: Counts, totalCent: number) {
  const nonzero = Object.keys(counts)
    .map((k) => parseInt(k, 10))
    .filter((k) => counts[k]! > 0);
  if (nonzero.length >= 2) return;
  if (totalCent < 60) return;

  const d = nonzero[0]!;
  if (d === 200 && counts[200]! >= 1) {
    // 2€ → 3×0,50 + 5×0,10 = 150 + 50 = 200
    counts[200]!--;
    counts[50] = (counts[50] || 0) + 3;
    counts[10] = (counts[10] || 0) + 5;
  } else if (d === 100 && counts[100]! >= 1) {
    // 1€ → 1×0,50 + 5×0,10 = 50 + 50 = 100
    counts[100]!--;
    counts[50] = (counts[50] || 0) + 1;
    counts[10] = (counts[10] || 0) + 5;
  } else if (d === 50 && counts[50]! >= 2) {
    // 2×0,50 → 1×0,50 + 5×0,10 = 50 + 50
    counts[50]!--;
    counts[10] = (counts[10] || 0) + 5;
  } else if (d === 20 && counts[20]! >= 5) {
    // 5×0,20 → 1×0,50 + 5×0,10 = 50 + 50 = 100
    counts[20]! -= 5;
    counts[50] = (counts[50] || 0) + 1;
    counts[10] = (counts[10] || 0) + 5;
  } else if (d === 10 && counts[10]! >= 6) {
    // 6×0,10 → 4×0,10 + 4×0,05 = 40 + 20 = 60
    counts[10]! -= 2;
    counts[5] = (counts[5] || 0) + 4;
  }
}

export function calculate(input: CalcInput): CalcResult {
  const { tagesumsatzCent, anfangsbestandCent, muenzenZielwertCent } = input;
  if (tagesumsatzCent < 0)     throw new Error("Tagesumsatz negatif olamaz");
  if (anfangsbestandCent < 0)  throw new Error("Anfangsbestand negatif olamaz");
  if (muenzenZielwertCent < 0) throw new Error("Münzen-Zielwert negatif olamaz");

  // Kasa fiziksel toplamı: Ausgaben kasadan düşülmez (kağıt şablonu uyumu).
  // Ausgaben/Einlage gibi hareketler sadece özet bölümünde gösterilir,
  // Zwischensumme türetiminde kullanılır.
  const totalCent = tagesumsatzCent + anfangsbestandCent;
  if (muenzenZielwertCent > totalCent) {
    throw new Error("Hedef bozuk para toplam kasayı aşamaz");
  }

  const banknoteBudget = totalCent - muenzenZielwertCent;
  const { counts: banknotes, remainderCent } = distributeBanknotes(banknoteBudget);

  const coinTotalCent = muenzenZielwertCent + remainderCent;
  const coins = distributeCoins(coinTotalCent);

  const gesamtICent =
    banknotes[50000]! * 50000 +
    banknotes[20000]! * 20000 +
    banknotes[10000]! * 10000 +
    banknotes[5000]!  *  5000 +
    banknotes[2000]!  *  2000 +
    banknotes[1000]!  *  1000 +
    banknotes[500]!   *   500;

  const gesamtIICent =
    coins[200]! * 200 +
    coins[100]! * 100 +
    coins[50]!  *  50 +
    coins[20]!  *  20 +
    coins[10]!  *  10 +
    coins[5]!   *   5 +
    coins[2]!   *   2 +
    coins[1]!   *   1;

  const kassenbestandCent = gesamtICent + gesamtIICent;
  if (kassenbestandCent !== totalCent) {
    throw new Error(`Mutabakat hatası: ${kassenbestandCent} != ${totalCent}`);
  }
  return { totalCent, banknotes, coins, gesamtICent, gesamtIICent, kassenbestandCent };
}
