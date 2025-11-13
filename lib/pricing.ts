// Constantes de precios para suscripciones
export const PRICING = {
  PRO_MONTHLY_PRICE: 14.99,
  PRO_CURRENCY: 'EUR',
  PRO_CURRENCY_SYMBOL: '€'
} as const

// Formatear precio para mostrar
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)}${PRICING.PRO_CURRENCY_SYMBOL}`
}

// Obtener precio formateado del plan Pro
export const getProPrice = (): string => {
  return formatPrice(PRICING.PRO_MONTHLY_PRICE)
}

