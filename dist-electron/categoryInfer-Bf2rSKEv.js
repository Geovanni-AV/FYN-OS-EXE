const CATEGORY_RULES = [
  [/OXXO|7.?ELEVEN|WALMART|SORIANA|CHEDRAUI|COSTCO/i, "supermercado"],
  [/UBER\s*EATS|RAPPI|DIDI\s*FOOD|DOMINOS|MCDONALDS/i, "restaurantes"],
  [/NETFLIX|SPOTIFY|DISNEY|HBO|AMAZON\s*PRIME/i, "entretenimiento"],
  [/CFE|TELMEX|TOTALPLAY|IZZI|TELCEL|AT&T/i, "servicios"],
  [/FARMA|FARMACIA|SIMILARES|BENAVIDES/i, "salud"],
  [/GASOLINA|PEMEX|SHELL|BP/i, "transporte"],
  [/UBER(?!\s*EATS)|DIDI(?!\s*FOOD)|CABIFY/i, "transporte"],
  [/LIVERPOOL|ZARA|H&M|PALACIO/i, "ropa"],
  [/donacion|DONAT/i, "otros"],
  [/SPEI recib|nómina|NOMINA|sueldo/i, "nomina"],
  [/SPEI envi|transferencia/i, "otros"]
];
function inferCategory(description, type) {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(description)) return category;
  }
  return type === "ingreso" ? "otros" : "otros";
}
function generateTxHash(date, amount, description) {
  const cleanDesc = description.replace(/\s/g, "").toLowerCase();
  const str = `${date}|${amount}|${cleanDesc}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
export {
  generateTxHash,
  inferCategory
};
//# sourceMappingURL=categoryInfer-Bf2rSKEv.js.map
