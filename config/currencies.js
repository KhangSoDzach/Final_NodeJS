/**
 * Currency Configuration
 * Cấu hình tiền tệ và tỷ giá cho hệ thống đa tiền tệ
 */

// Tiền tệ mặc định
const DEFAULT_CURRENCY = 'VND';

// Danh sách tiền tệ được hỗ trợ
const SUPPORTED_CURRENCIES = {
  VND: {
    code: 'VND',
    name: 'Việt Nam Đồng',
    nameEn: 'Vietnamese Dong',
    symbol: '₫',
    symbolPosition: 'after', // Vị trí ký hiệu: 'before' hoặc 'after'
    decimalDigits: 0, // VND không có số thập phân
    thousandsSeparator: '.',
    decimalSeparator: ',',
    locale: 'vi-VN'
  },
  USD: {
    code: 'USD',
    name: 'Đô la Mỹ',
    nameEn: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalDigits: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-US'
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    nameEn: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalDigits: 2,
    thousandsSeparator: '.',
    decimalSeparator: ',',
    locale: 'de-DE'
  }
};

// Tỷ giá quy đổi (base: VND)
// Cập nhật: December 2025
// Có thể tích hợp API tỷ giá sau này
const EXCHANGE_RATES = {
  VND: 1,
  USD: 0.000040, // 1 VND = 0.00004 USD (1 USD ≈ 25,000 VND)
  EUR: 0.000038  // 1 VND = 0.000038 EUR (1 EUR ≈ 26,300 VND)
};

// Tỷ giá ngược (để convert từ ngoại tệ sang VND)
const REVERSE_RATES = {
  VND: 1,
  USD: 25000, // 1 USD = 25,000 VND
  EUR: 26300  // 1 EUR = 26,300 VND
};

/**
 * Lấy thông tin tiền tệ theo code
 * @param {string} currencyCode - Mã tiền tệ (VND, USD, EUR)
 * @returns {object|null} Thông tin tiền tệ
 */
const getCurrencyInfo = (currencyCode) => {
  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase();
  return SUPPORTED_CURRENCIES[code] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
};

/**
 * Kiểm tra tiền tệ có được hỗ trợ không
 * @param {string} currencyCode - Mã tiền tệ
 * @returns {boolean}
 */
const isSupportedCurrency = (currencyCode) => {
  return Object.keys(SUPPORTED_CURRENCIES).includes((currencyCode || '').toUpperCase());
};

/**
 * Lấy tỷ giá từ VND sang tiền tệ khác
 * @param {string} toCurrency - Mã tiền tệ đích
 * @returns {number} Tỷ giá
 */
const getExchangeRate = (toCurrency) => {
  const code = (toCurrency || DEFAULT_CURRENCY).toUpperCase();
  return EXCHANGE_RATES[code] || 1;
};

/**
 * Lấy tỷ giá ngược từ tiền tệ khác sang VND
 * @param {string} fromCurrency - Mã tiền tệ nguồn
 * @returns {number} Tỷ giá ngược
 */
const getReverseRate = (fromCurrency) => {
  const code = (fromCurrency || DEFAULT_CURRENCY).toUpperCase();
  return REVERSE_RATES[code] || 1;
};

/**
 * Lấy danh sách tất cả tiền tệ được hỗ trợ
 * @returns {Array} Danh sách tiền tệ
 */
const getAllCurrencies = () => {
  return Object.values(SUPPORTED_CURRENCIES);
};

/**
 * Lấy danh sách mã tiền tệ
 * @returns {Array} Danh sách mã
 */
const getCurrencyCodes = () => {
  return Object.keys(SUPPORTED_CURRENCIES);
};

module.exports = {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  EXCHANGE_RATES,
  REVERSE_RATES,
  getCurrencyInfo,
  isSupportedCurrency,
  getExchangeRate,
  getReverseRate,
  getAllCurrencies,
  getCurrencyCodes
};
