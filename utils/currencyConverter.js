/**
 * Currency Converter Utility
 * Provides currency conversion between supported currencies
 */

const {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  EXCHANGE_RATES,
  REVERSE_RATES,
  getCurrencyInfo,
  isSupportedCurrency,
  getExchangeRate,
  getReverseRate,
  getAllCurrencies
} = require('../config/currencies');

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} options - Conversion options
 * @returns {number} Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency, options = {}) {
  // Validate inputs
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 0;
  }
  
  if (!isSupportedCurrency(fromCurrency)) {
    console.warn(`Unsupported source currency: ${fromCurrency}, using ${DEFAULT_CURRENCY}`);
    fromCurrency = DEFAULT_CURRENCY;
  }
  
  if (!isSupportedCurrency(toCurrency)) {
    console.warn(`Unsupported target currency: ${toCurrency}, using ${DEFAULT_CURRENCY}`);
    toCurrency = DEFAULT_CURRENCY;
  }
  
  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  let result;
  
  // Convert through VND as base currency
  if (fromCurrency === DEFAULT_CURRENCY) {
    // VND to target currency: use EXCHANGE_RATES (e.g., 1 VND = 0.00004 USD)
    const rate = getExchangeRate(toCurrency);
    result = amount * rate;
  } else if (toCurrency === DEFAULT_CURRENCY) {
    // Source currency to VND: use REVERSE_RATES (e.g., 1 USD = 25000 VND)
    const rate = getReverseRate(fromCurrency);
    result = amount * rate;
  } else {
    // Convert source -> VND -> target
    // First convert source to VND using reverse rate, then VND to target using exchange rate
    const sourceToVndRate = getReverseRate(fromCurrency);
    const vndToTargetRate = getExchangeRate(toCurrency);
    result = amount * sourceToVndRate * vndToTargetRate;
  }
  
  // Round to appropriate decimal places
  const targetCurrency = getCurrencyInfo(toCurrency);
  const decimalPlaces = options.decimalPlaces !== undefined 
    ? options.decimalPlaces 
    : targetCurrency.decimalDigits;
  
  return roundToDecimal(result, decimalPlaces);
}

/**
 * Convert amount to VND (base currency)
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @returns {number} Amount in VND
 */
function convertToVND(amount, fromCurrency) {
  return convertCurrency(amount, fromCurrency, 'VND');
}

/**
 * Convert amount from VND to target currency
 * @param {number} amount - Amount in VND
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
function convertFromVND(amount, toCurrency) {
  return convertCurrency(amount, 'VND', toCurrency);
}

/**
 * Round number to specified decimal places
 * @param {number} num - Number to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} Rounded number
 */
function roundToDecimal(num, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(num * multiplier) / multiplier;
}

/**
 * Get display price in user's preferred currency
 * @param {number} priceInVND - Price in VND
 * @param {string} targetCurrency - User's preferred currency
 * @param {Object} options - Display options
 * @returns {Object} Price object with amount and formatted string
 */
function getDisplayPrice(priceInVND, targetCurrency = DEFAULT_CURRENCY, options = {}) {
  const convertedAmount = convertFromVND(priceInVND, targetCurrency);
  const currencyInfo = getCurrencyInfo(targetCurrency);
  
  return {
    amount: convertedAmount,
    currency: targetCurrency,
    symbol: currencyInfo.symbol,
    formatted: formatPriceSimple(convertedAmount, targetCurrency),
    original: {
      amount: priceInVND,
      currency: 'VND'
    }
  };
}

/**
 * Simple price formatter (without locale dependency)
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted price string
 */
function formatPriceSimple(amount, currencyCode) {
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  // Format number with appropriate separators
  const parts = amount.toFixed(currencyInfo.decimalDigits).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, currencyInfo.thousandsSeparator);
  const formattedNumber = parts[1] && currencyInfo.decimalDigits > 0
    ? `${integerPart}${currencyInfo.decimalSeparator}${parts[1]}`
    : integerPart;
  
  // Add currency symbol
  if (currencyInfo.symbolPosition === 'after') {
    return `${formattedNumber}${currencyInfo.symbol}`;
  }
  return `${currencyInfo.symbol}${formattedNumber}`;
}

/**
 * Calculate price range in target currency
 * @param {number} minPriceVND - Minimum price in VND
 * @param {number} maxPriceVND - Maximum price in VND
 * @param {string} targetCurrency - Target currency code
 * @returns {Object} Price range object
 */
function convertPriceRange(minPriceVND, maxPriceVND, targetCurrency) {
  const minConverted = convertFromVND(minPriceVND, targetCurrency);
  const maxConverted = convertFromVND(maxPriceVND, targetCurrency);
  
  return {
    min: minConverted,
    max: maxConverted,
    currency: targetCurrency,
    formattedMin: formatPriceSimple(minConverted, targetCurrency),
    formattedMax: formatPriceSimple(maxConverted, targetCurrency)
  };
}

/**
 * Convert cart totals to target currency
 * @param {Object} cartTotals - Cart totals object with subtotal, shipping, discount, tax, total
 * @param {string} targetCurrency - Target currency code
 * @returns {Object} Converted cart totals
 */
function convertCartTotals(cartTotals, targetCurrency) {
  const {
    subtotal = 0,
    shipping = 0,
    discount = 0,
    tax = 0,
    total = 0
  } = cartTotals;
  
  return {
    subtotal: convertFromVND(subtotal, targetCurrency),
    shipping: convertFromVND(shipping, targetCurrency),
    discount: convertFromVND(discount, targetCurrency),
    tax: convertFromVND(tax, targetCurrency),
    total: convertFromVND(total, targetCurrency),
    currency: targetCurrency,
    formatted: {
      subtotal: formatPriceSimple(convertFromVND(subtotal, targetCurrency), targetCurrency),
      shipping: formatPriceSimple(convertFromVND(shipping, targetCurrency), targetCurrency),
      discount: formatPriceSimple(convertFromVND(discount, targetCurrency), targetCurrency),
      tax: formatPriceSimple(convertFromVND(tax, targetCurrency), targetCurrency),
      total: formatPriceSimple(convertFromVND(total, targetCurrency), targetCurrency)
    }
  };
}

/**
 * Create price converter helper for templates
 * @param {string} targetCurrency - Target currency for conversions
 * @returns {Object} Converter helper object
 */
function createConverterHelper(targetCurrency = DEFAULT_CURRENCY) {
  return {
    convert: (amount, fromCurrency = 'VND') => convertCurrency(amount, fromCurrency, targetCurrency),
    fromVND: (amount) => convertFromVND(amount, targetCurrency),
    toVND: (amount, fromCurrency) => convertToVND(amount, fromCurrency),
    format: (amount) => formatPriceSimple(amount, targetCurrency),
    display: (priceInVND) => getDisplayPrice(priceInVND, targetCurrency),
    priceRange: (min, max) => convertPriceRange(min, max, targetCurrency),
    cartTotals: (totals) => convertCartTotals(totals, targetCurrency),
    getCurrencyInfo: () => getCurrencyInfo(targetCurrency),
    currency: targetCurrency
  };
}

/**
 * Validate and sanitize currency code
 * @param {string} currencyCode - Currency code to validate
 * @param {string} fallback - Fallback currency if invalid
 * @returns {string} Valid currency code
 */
function validateCurrency(currencyCode, fallback = DEFAULT_CURRENCY) {
  if (!currencyCode || !isSupportedCurrency(currencyCode)) {
    return fallback;
  }
  return currencyCode.toUpperCase();
}

/**
 * Get exchange rate info for display
 * @param {string} currencyCode - Currency code
 * @returns {Object} Exchange rate info
 */
function getExchangeRateInfo(currencyCode) {
  if (currencyCode === DEFAULT_CURRENCY) {
    return {
      currency: currencyCode,
      rate: 1,
      display: '1 VND = 1 VND'
    };
  }
  
  const rate = getExchangeRate(currencyCode);
  const reverseRate = getReverseRate(currencyCode);
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  return {
    currency: currencyCode,
    rate: rate,
    reverseRate: reverseRate,
    display: `1 ${currencyCode} = ${formatPriceSimple(rate, 'VND')}`,
    reverseDisplay: `1 VND = ${reverseRate.toFixed(6)} ${currencyCode}`
  };
}

/**
 * Bulk convert prices array
 * @param {Array} prices - Array of prices in VND
 * @param {string} targetCurrency - Target currency
 * @returns {Array} Array of converted prices
 */
function bulkConvert(prices, targetCurrency) {
  return prices.map(price => ({
    original: price,
    converted: convertFromVND(price, targetCurrency),
    formatted: formatPriceSimple(convertFromVND(price, targetCurrency), targetCurrency)
  }));
}

module.exports = {
  // Core conversion functions
  convertCurrency,
  convertToVND,
  convertFromVND,
  
  // Display helpers
  getDisplayPrice,
  formatPriceSimple,
  convertPriceRange,
  convertCartTotals,
  
  // Utility functions
  roundToDecimal,
  validateCurrency,
  getExchangeRateInfo,
  bulkConvert,
  
  // Helper factory
  createConverterHelper,
  
  // Re-export from currencies config
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  EXCHANGE_RATES,
  getCurrencyInfo,
  isSupportedCurrency,
  getAllCurrencies
};
