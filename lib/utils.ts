/**
 * Formate un montant en entier (sans décimales) avec séparateurs de milliers
 * @param amount - Le montant à formater (peut être number, string ou decimal)
 * @returns Le montant formaté en entier avec séparateurs
 */
export function formatPrice(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return '0';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  // Arrondir à l'entier le plus proche
  const roundedAmount = Math.round(numAmount);
  
  // Formater avec séparateurs de milliers
  return roundedAmount.toLocaleString('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

