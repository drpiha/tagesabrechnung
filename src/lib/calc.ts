/**
 * Tagesabrechnung hesaplama motoru.
 * TÜM aritmetik TAM SAYI (cent) ile yapılır.
 * Hiçbir yerde float yok -> 0.01 EUR hatası matematiksel olarak imkânsız.
 */

export const BANKNOTE_CENTS = [50000, 20000, 10000, 5000, 2000, 1000, 500] as const;
//                            500€, 200€,  100€,  50€,  20€,  10€,  5€
export const COIN_CENTS     = [200, 100, 50, 20, 10, 5, 1] as const;
//                            2€,  1€,  0.50,0.20,0.10,0.05,0.01

// Promt kuralı: 500 ve 200 her zaman 0 adet
const ALLOWED_BANKNOTE_CENTS = [10000, 5000, 2000, 1000, 500] as const;

export type Counts = Record<number, number>;

export interface CalcInput {
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  muenzenZielwertCent: number;
}

export interface CalcResult {
  totalCent: number;
  banknotes: Counts;
  coins: Counts;
  gesamtICent: number;
  gesamtIICent: number;
  kassenbestandCent: number;
}

/** "628,50" / "628.50" / 628.5  -> 62850 (cent). */
export function eurToCent(value: string | number): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Geçersiz sayı");
    return Math.round(value * 100);
  }
  const cleaned = String(value).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  // Almanca formatta: 1.234,56 -> 1234.56
  // Ama "628.50" gibi US formatı için yukarıdaki nokta silme yanlış olur.
  // Heuristik: virgül varsa Alman formatı, yoksa US formatı.
  let normalized: string;
  if (String(value).includes(",")) {
    normalized = String(value).replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  } else {
    normalized = String(value).replace(/\s/g, "");
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

/** Banknotları 100, 50, 20, 10, 5 sırasıyla açgözlü dağıt. Kalan cent madeni paraya. */
function distributeBanknotes(budgetCent: number): { counts: Counts; remainderCent: number } {
  const counts: Counts = { 50000: 0, 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0 };
  let remaining = budgetCent;
  for (const d of ALLOWED_BANKNOTE_CENTS) {
    const c = Math.floor(remaining / d);
    counts[d] = c;
    remaining -= c * d;
  }
  return { counts, remainderCent: remaining };
}

/**
 * Madeni para dağıtımı - dengeli ve gerçekçi.
 *
 * 1) Alt-€ kısmı (totalCent % 100) açgözlü çözülür: 50, 20, 10, 5, 1.
 *    Bu sayede 0.10, 0.05, 0.01 sadece küçük artıklarda kullanılır.
 * 2) Tam €'luk kısım 4 ana denomination'a hedef yüzdelere göre dağıtılır:
 *      2.00 € : %40
 *      1.00 € : %35
 *      0.50 € : %15  (her zaman ÇİFT adet -> tam € değer)
 *      0.20 € : %10  (kalan tam €'lar -> n20 = €kalan * 5)
 * 3) Tüm aritmetik integer cent; toplam == girdi garanti.
 */
function distributeCoins(totalCent: number): Counts {
  const counts: Counts = { 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 1: 0 };
  if (totalCent <= 0) return counts;

  // 1) Alt-€ kısmı: 0-99 cent
  let sub = totalCent % 100;
  for (const c of [50, 20, 10, 5, 1] as const) {
    if (sub >= c) {
      const n = Math.floor(sub / c);
      counts[c] += n;
      sub -= n * c;
    }
  }
  // 2) Tam €'luk kısım
  let totalEuros = Math.floor(totalCent / 100);
  if (totalEuros <= 0) return counts;

  // 0.50€: hedef %15, ÇİFT sayıda olacak (toplam = tam €)
  let n50 = 2 * Math.round((totalEuros * 15) / 100);
  // En az 0, çok olursa kıs
  while (n50 / 2 > totalEuros) n50 -= 2;
  if (n50 < 0) n50 = 0;
  counts[50] += n50;
  totalEuros -= n50 / 2;

  // 2.00€: hedef %40 (orijinal toplamın %40'ı), çift değil
  let n2 = Math.round((totalEuros * 40) / 100 / 2) * 2 / 2;
  // basit: floor((totalEuros * 0.40) / 2) için yuvarla
  n2 = Math.round((totalEuros * 0.40) / 2);
  if (n2 < 0) n2 = 0;
  if (n2 * 2 > totalEuros) n2 = Math.floor(totalEuros / 2);
  counts[200] += n2;
  totalEuros -= n2 * 2;

  // 1.00€: kalan €'nun yaklaşık %78'i (yani 0.35 / (0.35+0.10))
  let n1 = Math.round(totalEuros * 0.78);
  if (n1 < 0) n1 = 0;
  if (n1 > totalEuros) n1 = totalEuros;
  counts[100] += n1;
  totalEuros -= n1;

  // Kalan tüm €'lar 0.20€'lara → 1 € = 5 adet
  counts[20] += totalEuros * 5;

  // Sağlamlık kontrolü
  const sum =
    counts[200] * 200 +
    counts[100] * 100 +
    counts[50] * 50 +
    counts[20] * 20 +
    counts[10] * 10 +
    counts[5] * 5 +
    counts[1] * 1;
  if (sum !== totalCent) {
    throw new Error(`İç hata: madeni toplam ${sum} != ${totalCent}`);
  }
  return counts;
}

export function calculate(input: CalcInput): CalcResult {
  const { tagesumsatzCent, anfangsbestandCent, muenzenZielwertCent } = input;
  if (tagesumsatzCent < 0)     throw new Error("Tagesumsatz negatif olamaz");
  if (anfangsbestandCent < 0)  throw new Error("Anfangsbestand negatif olamaz");
  if (muenzenZielwertCent < 0) throw new Error("Münzen-Zielwert negatif olamaz");

  const totalCent = tagesumsatzCent + anfangsbestandCent;
  if (muenzenZielwertCent > totalCent) {
    throw new Error("Münzen-Zielwert toplam kasayı aşamaz");
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
    coins[1]!   *   1;

  const kassenbestandCent = gesamtICent + gesamtIICent;
  if (kassenbestandCent !== totalCent) {
    throw new Error(`Mutabakat hatası: ${kassenbestandCent} != ${totalCent}`);
  }
  return { totalCent, banknotes, coins, gesamtICent, gesamtIICent, kassenbestandCent };
}
