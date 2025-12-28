/**
 * Locale Formatter Utility
 * Provides date, number, and currency formatting based on locale
 */

const { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, getCurrencyInfo } = require('../config/currencies');

// Supported locales configuration
const SUPPORTED_LOCALES = {
  vi: {
    code: 'vi',
    locale: 'vi-VN',
    name: 'Tiếng Việt',
    nameEn: 'Vietnamese',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'DD/MM/YYYY HH:mm'
  },
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    nameEn: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'hh:mm A',
    dateTimeFormat: 'MM/DD/YYYY hh:mm A'
  }
};

const DEFAULT_LOCALE = 'vi';

/**
 * Get locale info by code
 * @param {string} localeCode - Locale code (vi, en)
 * @returns {Object} Locale information
 */
function getLocaleInfo(localeCode) {
  return SUPPORTED_LOCALES[localeCode] || SUPPORTED_LOCALES[DEFAULT_LOCALE];
}

/**
 * Check if locale is supported
 * @param {string} localeCode - Locale code to check
 * @returns {boolean}
 */
function isSupportedLocale(localeCode) {
  return localeCode in SUPPORTED_LOCALES;
}

/**
 * Get all supported locales
 * @returns {Array} Array of locale objects
 */
function getAllLocales() {
  return Object.values(SUPPORTED_LOCALES);
}

/**
 * Format number according to locale
 * @param {number} number - Number to format
 * @param {string} localeCode - Locale code (vi, en)
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
function formatNumber(number, localeCode = DEFAULT_LOCALE, options = {}) {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  const localeInfo = getLocaleInfo(localeCode);
  const formatter = new Intl.NumberFormat(localeInfo.locale, {
    maximumFractionDigits: 2,
    ...options
  });
  
  return formatter.format(number);
}

/**
 * Format currency according to locale and currency code
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code (VND, USD, EUR)
 * @param {string} localeCode - Locale code (vi, en)
 * @param {Object} options - Additional options
 * @returns {string} Formatted currency
 */
function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY, localeCode = DEFAULT_LOCALE, options = {}) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrency(0, currencyCode, localeCode, options);
  }
  
  const currencyInfo = getCurrencyInfo(currencyCode);
  const localeInfo = getLocaleInfo(localeCode);
  
  // Use Intl.NumberFormat for consistent formatting
  const formatter = new Intl.NumberFormat(currencyInfo.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyInfo.decimalDigits,
    maximumFractionDigits: currencyInfo.decimalDigits,
    ...options
  });
  
  return formatter.format(amount);
}

/**
 * Format currency with custom symbol position
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @param {string} localeCode - Locale code
 * @returns {string} Formatted currency with symbol
 */
function formatCurrencyCustom(amount, currencyCode = DEFAULT_CURRENCY, localeCode = DEFAULT_LOCALE) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return formatCurrencyCustom(0, currencyCode, localeCode);
  }
  
  const currencyInfo = getCurrencyInfo(currencyCode);
  
  // Format number part
  const formattedNumber = new Intl.NumberFormat(currencyInfo.locale, {
    minimumFractionDigits: currencyInfo.decimalDigits,
    maximumFractionDigits: currencyInfo.decimalDigits
  }).format(amount);
  
  // Add symbol based on position
  if (currencyInfo.symbolPosition === 'after') {
    return `${formattedNumber}${currencyInfo.symbol}`;
  }
  return `${currencyInfo.symbol}${formattedNumber}`;
}

/**
 * Format date according to locale
 * @param {Date|string|number} date - Date to format
 * @param {string} localeCode - Locale code (vi, en)
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
function formatDate(date, localeCode = DEFAULT_LOCALE, options = {}) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const localeInfo = getLocaleInfo(localeCode);
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat(localeInfo.locale, {
    ...defaultOptions,
    ...options
  });
  
  return formatter.format(dateObj);
}

/**
 * Format date with time according to locale
 * @param {Date|string|number} date - Date to format
 * @param {string} localeCode - Locale code (vi, en)
 * @param {Object} options - Additional options
 * @returns {string} Formatted date and time
 */
function formatDateTime(date, localeCode = DEFAULT_LOCALE, options = {}) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const localeInfo = getLocaleInfo(localeCode);
  
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat(localeInfo.locale, {
    ...defaultOptions,
    ...options
  });
  
  return formatter.format(dateObj);
}

/**
 * Format time according to locale
 * @param {Date|string|number} date - Date to format
 * @param {string} localeCode - Locale code (vi, en)
 * @param {Object} options - Additional options
 * @returns {string} Formatted time
 */
function formatTime(date, localeCode = DEFAULT_LOCALE, options = {}) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const localeInfo = getLocaleInfo(localeCode);
  
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat(localeInfo.locale, {
    ...defaultOptions,
    ...options
  });
  
  return formatter.format(dateObj);
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 * @param {Date|string|number} date - Date to compare
 * @param {string} localeCode - Locale code (vi, en)
 * @returns {string} Relative time string
 */
function formatRelativeTime(date, localeCode = DEFAULT_LOCALE) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const localeInfo = getLocaleInfo(localeCode);
  const now = new Date();
  const diffMs = dateObj - now;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  const rtf = new Intl.RelativeTimeFormat(localeInfo.locale, { numeric: 'auto' });
  
  if (Math.abs(diffSecs) < 60) {
    return rtf.format(diffSecs, 'second');
  } else if (Math.abs(diffMins) < 60) {
    return rtf.format(diffMins, 'minute');
  } else if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  } else if (Math.abs(diffDays) < 7) {
    return rtf.format(diffDays, 'day');
  } else if (Math.abs(diffWeeks) < 4) {
    return rtf.format(diffWeeks, 'week');
  } else if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  } else {
    return rtf.format(diffYears, 'year');
  }
}

/**
 * Format percentage
 * @param {number} value - Value to format (0.1 = 10%)
 * @param {string} localeCode - Locale code
 * @param {Object} options - Additional options
 * @returns {string} Formatted percentage
 */
function formatPercent(value, localeCode = DEFAULT_LOCALE, options = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  const localeInfo = getLocaleInfo(localeCode);
  
  const formatter = new Intl.NumberFormat(localeInfo.locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  });
  
  return formatter.format(value);
}

/**
 * Parse number from locale-formatted string
 * @param {string} str - Formatted number string
 * @param {string} localeCode - Locale code
 * @returns {number} Parsed number
 */
function parseNumber(str, localeCode = DEFAULT_LOCALE) {
  if (!str) return 0;
  
  const localeInfo = getLocaleInfo(localeCode);
  
  // Remove currency symbols and whitespace
  let cleaned = str.replace(/[^\d.,\-]/g, '');
  
  // Handle different decimal/thousands separators
  if (localeCode === 'vi') {
    // Vietnamese: 1.000.000,5 -> 1000000.5
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // English: 1,000,000.5 -> 1000000.5
    cleaned = cleaned.replace(/,/g, '');
  }
  
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {string} localeCode - Locale code
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes, localeCode = DEFAULT_LOCALE) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = bytes / Math.pow(k, i);
  const formattedSize = formatNumber(size, localeCode, { maximumFractionDigits: 2 });
  
  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Create formatter helper for use in templates
 * @param {string} localeCode - Default locale code
 * @param {string} currencyCode - Default currency code
 * @returns {Object} Formatter helper object
 */
function createFormatterHelper(localeCode = DEFAULT_LOCALE, currencyCode = DEFAULT_CURRENCY) {
  return {
    number: (num, options) => formatNumber(num, localeCode, options),
    currency: (amount, currency = currencyCode, options) => formatCurrency(amount, currency, localeCode, options),
    currencyCustom: (amount, currency = currencyCode) => formatCurrencyCustom(amount, currency, localeCode),
    date: (date, options) => formatDate(date, localeCode, options),
    dateTime: (date, options) => formatDateTime(date, localeCode, options),
    time: (date, options) => formatTime(date, localeCode, options),
    relativeTime: (date) => formatRelativeTime(date, localeCode),
    percent: (value, options) => formatPercent(value, localeCode, options),
    fileSize: (bytes) => formatFileSize(bytes, localeCode),
    parseNumber: (str) => parseNumber(str, localeCode)
  };
}

module.exports = {
  // Constants
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  
  // Locale helpers
  getLocaleInfo,
  isSupportedLocale,
  getAllLocales,
  
  // Formatters
  formatNumber,
  formatCurrency,
  formatCurrencyCustom,
  formatDate,
  formatDateTime,
  formatTime,
  formatRelativeTime,
  formatPercent,
  parseNumber,
  formatFileSize,
  
  // Helper factory
  createFormatterHelper
};
