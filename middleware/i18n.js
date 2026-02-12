/**
 * i18n Middleware
 * Handles language and currency detection, setting, and provides
 * locale-related helpers to views and controllers
 */

const path = require('path');
const fs = require('fs');
const { SUPPORTED_LOCALES, DEFAULT_LOCALE, getAllLocales, createFormatterHelper } = require('../utils/localeFormatter');
const { DEFAULT_CURRENCY, getAllCurrencies, isSupportedCurrency, getCurrencyInfo } = require('../config/currencies');
const { createConverterHelper } = require('../utils/currencyConverter');

// Load translation files
const translations = {};
const localesDir = path.join(__dirname, '../locales');

// Load all locale files
try {
  const files = fs.readdirSync(localesDir);
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const locale = file.replace('.json', '');
      const filePath = path.join(localesDir, file);
      translations[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  });
} catch (err) {
  console.error('Error loading locale files:', err);
}

/**
 * Get translation by key path
 * @param {string} locale - Locale code
 * @param {string} key - Translation key (e.g., 'common.home', 'cart.title')
 * @param {Object} params - Parameters for interpolation
 * @returns {string} Translated string or key if not found
 */
function getTranslation(locale, key, params = {}) {
  const localeData = translations[locale] || translations[DEFAULT_LOCALE];
  
  if (!localeData) {
    return key;
  }
  
  // Navigate through nested keys
  const keys = key.split('.');
  let value = localeData;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Key not found, return original key
    }
  }
  
  // Handle string interpolation
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramName) => {
      return params[paramName] !== undefined ? params[paramName] : match;
    });
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Detect user's preferred locale
 * Priority: Query param > Cookie > User preference > Accept-Language header > Default
 * @param {Object} req - Express request object
 * @returns {string} Detected locale code
 */
function detectLocale(req) {
  // 1. Check query parameter
  if (req.query.lang && SUPPORTED_LOCALES[req.query.lang]) {
    return req.query.lang;
  }
  
  // 2. Check cookie
  if (req.cookies && req.cookies.locale && SUPPORTED_LOCALES[req.cookies.locale]) {
    return req.cookies.locale;
  }
  
  // 3. Check user preference (if logged in)
  if (req.user && req.user.preferredLanguage && SUPPORTED_LOCALES[req.user.preferredLanguage]) {
    return req.user.preferredLanguage;
  }
  
  // 4. Check Accept-Language header
  if (req.headers['accept-language']) {
    const acceptedLanguages = req.headers['accept-language']
      .split(',')
      .map(lang => {
        const [code, quality = 'q=1'] = lang.trim().split(';');
        return {
          code: code.split('-')[0].toLowerCase(),
          quality: parseFloat(quality.replace('q=', ''))
        };
      })
      .sort((a, b) => b.quality - a.quality);
    
    for (const lang of acceptedLanguages) {
      if (SUPPORTED_LOCALES[lang.code]) {
        return lang.code;
      }
    }
  }
  
  // 5. Return default
  return DEFAULT_LOCALE;
}

/**
 * Detect user's preferred currency
 * Priority: Query param > Cookie > User preference > Default
 * @param {Object} req - Express request object
 * @returns {string} Detected currency code
 */
function detectCurrency(req) {
  // 1. Check query parameter
  if (req.query.currency && isSupportedCurrency(req.query.currency)) {
    return req.query.currency.toUpperCase();
  }
  
  // 2. Check cookie
  if (req.cookies && req.cookies.currency && isSupportedCurrency(req.cookies.currency)) {
    return req.cookies.currency.toUpperCase();
  }
  
  // 3. Check user preference (if logged in)
  if (req.user && req.user.preferredCurrency && isSupportedCurrency(req.user.preferredCurrency)) {
    return req.user.preferredCurrency;
  }
  
  // 4. Return default
  return DEFAULT_CURRENCY;
}

/**
 * i18n middleware - sets up locale and currency for each request
 */
function i18nMiddleware(req, res, next) {
  // Detect locale and currency
  const locale = detectLocale(req);
  const currency = detectCurrency(req);
  
  // Set on request object
  req.locale = locale;
  req.currency = currency;
  
  // Translation function
  req.__ = req.t = function(key, params = {}) {
    return getTranslation(locale, key, params);
  };
  
  // Create formatter and converter helpers
  req.formatter = createFormatterHelper(locale, currency);
  req.converter = createConverterHelper(currency);
  
  // Set response cookies if changed via query params
  if (req.query.lang && SUPPORTED_LOCALES[req.query.lang]) {
    res.cookie('locale', req.query.lang, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
  if (req.query.currency && isSupportedCurrency(req.query.currency)) {
    res.cookie('currency', req.query.currency.toUpperCase(), {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      sameSite: 'lax'
    });
  }
  
  // Make available to views
  res.locals.locale = locale;
  res.locals.currency = currency;
  res.locals.__ = req.__ || function(key) { return key; };
  res.locals.t = req.t || function(key) { return key; };
  res.locals.formatter = req.formatter;
  res.locals.converter = req.converter;
  
  // Provide list of available locales and currencies for switcher
  res.locals.availableLocales = getAllLocales();
  res.locals.availableCurrencies = getAllCurrencies();
  res.locals.currentLocale = SUPPORTED_LOCALES[locale] || SUPPORTED_LOCALES[DEFAULT_LOCALE] || { code: 'vi', name: 'Tiếng Việt', locale: 'vi-VN' };
  res.locals.currentCurrency = getCurrencyInfo(currency) || getCurrencyInfo(DEFAULT_CURRENCY) || { code: 'VND', symbol: '₫' };
  
  // Helper to generate URL with locale/currency param
  res.locals.localeUrl = function(newLocale, preserveQuery = true) {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    url.searchParams.set('lang', newLocale);
    if (preserveQuery) {
      return url.pathname + url.search;
    }
    return `${url.pathname}?lang=${newLocale}`;
  };
  
  res.locals.currencyUrl = function(newCurrency, preserveQuery = true) {
    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    url.searchParams.set('currency', newCurrency);
    if (preserveQuery) {
      return url.pathname + url.search;
    }
    return `${url.pathname}?currency=${newCurrency}`;
  };
  
  next();
}

/**
 * Middleware to set locale/currency from user preferences after auth
 * Should be used after authentication middleware
 */
function syncUserPreferences(req, res, next) {
  if (req.user) {
    // Update cookies to match user preferences if not set via query
    if (!req.query.lang && req.user.preferredLanguage && 
        req.cookies.locale !== req.user.preferredLanguage) {
      res.cookie('locale', req.user.preferredLanguage, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
    if (!req.query.currency && req.user.preferredCurrency && 
        req.cookies.currency !== req.user.preferredCurrency) {
      res.cookie('currency', req.user.preferredCurrency, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
    }
  }
  
  next();
}

/**
 * API endpoint handler to update user's locale preference
 */
async function updateLocalePreference(req, res) {
  try {
    const { locale, currency } = req.body;
    const updates = {};
    
    if (locale && SUPPORTED_LOCALES[locale]) {
      updates.preferredLanguage = locale;
      res.cookie('locale', locale, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
    if (currency && isSupportedCurrency(currency)) {
      updates.preferredCurrency = currency.toUpperCase();
      res.cookie('currency', currency.toUpperCase(), {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax'
      });
    }
    
    // Update user if logged in
    if (req.user && Object.keys(updates).length > 0) {
      const User = require('../models/user');
      await User.findByIdAndUpdate(req.user._id, updates);
    }
    
    res.json({
      success: true,
      locale: updates.preferredLanguage || req.locale,
      currency: updates.preferredCurrency || req.currency
    });
  } catch (error) {
    console.error('Error updating locale preference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
}

/**
 * Get all translations for a locale (for client-side use)
 */
function getTranslationsForLocale(locale) {
  return translations[locale] || translations[DEFAULT_LOCALE] || {};
}

/**
 * Reload translations from files (useful for development)
 */
function reloadTranslations() {
  try {
    const files = fs.readdirSync(localesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const locale = file.replace('.json', '');
        const filePath = path.join(localesDir, file);
        // Clear cache
        delete require.cache[require.resolve(filePath)];
        translations[locale] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    });
    console.log('Translations reloaded');
  } catch (err) {
    console.error('Error reloading translations:', err);
  }
}

module.exports = {
  i18nMiddleware,
  syncUserPreferences,
  updateLocalePreference,
  getTranslation,
  getTranslationsForLocale,
  detectLocale,
  detectCurrency,
  reloadTranslations,
  translations
};
