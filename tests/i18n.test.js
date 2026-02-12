/**
 * Test suite for Multi-Language & Localization (i18n) - Part 12
 * Tests for locale formatter, currency converter, and i18n middleware
 */

const {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
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
  createFormatterHelper,
  getLocaleInfo,
  isSupportedLocale,
  getAllLocales
} = require('../utils/localeFormatter');

const {
  SUPPORTED_CURRENCIES,
  DEFAULT_CURRENCY,
  convertCurrency,
  convertToVND,
  convertFromVND,
  getDisplayPrice,
  formatPriceSimple,
  convertPriceRange,
  convertCartTotals,
  createConverterHelper,
  validateCurrency,
  getExchangeRateInfo,
  bulkConvert,
  getCurrencyInfo,
  isSupportedCurrency,
  getAllCurrencies
} = require('../utils/currencyConverter');

const {
  getTranslation,
  detectLocale,
  detectCurrency,
  getTranslationsForLocale
} = require('../middleware/i18n');

describe('Part 12: Multi-Language & Localization', () => {
  
  // ==================== LOCALE FORMATTER TESTS ====================
  describe('Locale Formatter - localeFormatter.js', () => {
    
    describe('Locale Configuration', () => {
      test('should have Vietnamese as default locale', () => {
        expect(DEFAULT_LOCALE).toBe('vi');
      });
      
      test('should support Vietnamese and English locales', () => {
        expect(SUPPORTED_LOCALES).toHaveProperty('vi');
        expect(SUPPORTED_LOCALES).toHaveProperty('en');
      });
      
      test('getLocaleInfo should return correct locale info', () => {
        const viInfo = getLocaleInfo('vi');
        expect(viInfo.code).toBe('vi');
        expect(viInfo.locale).toBe('vi-VN');
        expect(viInfo.name).toBe('Tiếng Việt');
        
        const enInfo = getLocaleInfo('en');
        expect(enInfo.code).toBe('en');
        expect(enInfo.locale).toBe('en-US');
        expect(enInfo.name).toBe('English');
      });
      
      test('getLocaleInfo should return default for unsupported locale', () => {
        const info = getLocaleInfo('xx');
        expect(info.code).toBe('vi');
      });
      
      test('isSupportedLocale should validate correctly', () => {
        expect(isSupportedLocale('vi')).toBe(true);
        expect(isSupportedLocale('en')).toBe(true);
        expect(isSupportedLocale('fr')).toBe(false);
        expect(isSupportedLocale('')).toBe(false);
      });
      
      test('getAllLocales should return all supported locales', () => {
        const locales = getAllLocales();
        expect(locales.length).toBe(2);
        expect(locales.some(l => l.code === 'vi')).toBe(true);
        expect(locales.some(l => l.code === 'en')).toBe(true);
      });
    });
    
    describe('Number Formatting', () => {
      test('should format numbers for Vietnamese locale', () => {
        const formatted = formatNumber(1234567.89, 'vi');
        expect(formatted).toMatch(/1.*234.*567/); // Contains thousand separators
      });
      
      test('should format numbers for English locale', () => {
        const formatted = formatNumber(1234567.89, 'en');
        expect(formatted).toMatch(/1.*234.*567/);
      });
      
      test('should handle null/undefined/NaN', () => {
        expect(formatNumber(null)).toBe('0');
        expect(formatNumber(undefined)).toBe('0');
        expect(formatNumber(NaN)).toBe('0');
      });
      
      test('should use default locale when not specified', () => {
        const formatted = formatNumber(1000);
        expect(formatted).toBeDefined();
      });
    });
    
    describe('Currency Formatting', () => {
      test('should format VND currency', () => {
        const formatted = formatCurrency(25000000, 'VND', 'vi');
        expect(formatted).toMatch(/25.*000.*000/);
        expect(formatted).toMatch(/₫|VND/);
      });
      
      test('should format USD currency', () => {
        const formatted = formatCurrency(1000, 'USD', 'en');
        expect(formatted).toMatch(/\$|USD/);
        expect(formatted).toMatch(/1.*000/);
      });
      
      test('should format EUR currency', () => {
        const formatted = formatCurrency(1000, 'EUR', 'en');
        expect(formatted).toMatch(/€|EUR/);
      });
      
      test('formatCurrencyCustom should position symbol correctly', () => {
        const vndFormatted = formatCurrencyCustom(25000000, 'VND', 'vi');
        expect(vndFormatted).toMatch(/₫$/); // Symbol at end for VND
        
        const usdFormatted = formatCurrencyCustom(1000, 'USD', 'en');
        expect(usdFormatted).toMatch(/^\$/); // Symbol at start for USD
      });
      
      test('should handle zero and negative amounts', () => {
        expect(formatCurrency(0, 'VND')).toBeDefined();
        expect(formatCurrency(-1000, 'USD')).toBeDefined();
      });
    });
    
    describe('Date Formatting', () => {
      const testDate = new Date('2025-06-15T10:30:00');
      
      test('should format date for Vietnamese locale', () => {
        const formatted = formatDate(testDate, 'vi');
        expect(formatted).toMatch(/15.*06.*2025|06.*15.*2025/);
      });
      
      test('should format date for English locale', () => {
        const formatted = formatDate(testDate, 'en');
        expect(formatted).toBeDefined();
      });
      
      test('should format datetime correctly', () => {
        const formatted = formatDateTime(testDate, 'vi');
        expect(formatted).toMatch(/10.*30/);
      });
      
      test('should format time only', () => {
        const formatted = formatTime(testDate, 'vi');
        expect(formatted).toMatch(/10.*30/);
      });
      
      test('should handle invalid dates', () => {
        expect(formatDate(null)).toBe('');
        expect(formatDate('')).toBe('');
        expect(formatDate('invalid')).toBe('');
      });
      
      test('should accept date strings and timestamps', () => {
        expect(formatDate('2025-06-15')).toBeDefined();
        expect(formatDate(Date.now())).toBeDefined();
      });
    });
    
    describe('Relative Time Formatting', () => {
      test('should format relative time for past dates', () => {
        const pastDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const formatted = formatRelativeTime(pastDate, 'vi');
        expect(formatted).toBeDefined();
      });
      
      test('should format relative time for future dates', () => {
        const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours from now
        const formatted = formatRelativeTime(futureDate, 'en');
        expect(formatted).toBeDefined();
      });
      
      test('should handle invalid dates', () => {
        expect(formatRelativeTime(null)).toBe('');
        expect(formatRelativeTime('invalid')).toBe('');
      });
    });
    
    describe('Percentage Formatting', () => {
      test('should format percentages correctly', () => {
        const formatted = formatPercent(0.25, 'vi');
        expect(formatted).toMatch(/25.*%/);
      });
      
      test('should handle decimal percentages', () => {
        const formatted = formatPercent(0.1234, 'en');
        expect(formatted).toMatch(/12/);
      });
      
      test('should handle zero and null', () => {
        expect(formatPercent(0)).toBe('0%');
        expect(formatPercent(null)).toBe('0%');
      });
    });
    
    describe('Number Parsing', () => {
      test('should parse Vietnamese formatted numbers', () => {
        expect(parseNumber('1.000.000', 'vi')).toBe(1000000);
        expect(parseNumber('1.234,56', 'vi')).toBe(1234.56);
      });
      
      test('should parse English formatted numbers', () => {
        expect(parseNumber('1,000,000', 'en')).toBe(1000000);
        expect(parseNumber('1,234.56', 'en')).toBe(1234.56);
      });
      
      test('should handle empty strings', () => {
        expect(parseNumber('')).toBe(0);
        expect(parseNumber(null)).toBe(0);
      });
    });
    
    describe('File Size Formatting', () => {
      test('should format bytes correctly', () => {
        expect(formatFileSize(0)).toBe('0 B');
        expect(formatFileSize(1024)).toMatch(/1.*KB/);
        expect(formatFileSize(1048576)).toMatch(/1.*MB/);
        expect(formatFileSize(1073741824)).toMatch(/1.*GB/);
      });
    });
    
    describe('Formatter Helper Factory', () => {
      test('should create formatter helper with all methods', () => {
        const helper = createFormatterHelper('vi', 'VND');
        
        expect(typeof helper.number).toBe('function');
        expect(typeof helper.currency).toBe('function');
        expect(typeof helper.date).toBe('function');
        expect(typeof helper.dateTime).toBe('function');
        expect(typeof helper.time).toBe('function');
        expect(typeof helper.relativeTime).toBe('function');
        expect(typeof helper.percent).toBe('function');
        expect(typeof helper.fileSize).toBe('function');
        expect(typeof helper.parseNumber).toBe('function');
      });
      
      test('helper methods should work correctly', () => {
        const helper = createFormatterHelper('vi', 'VND');
        
        expect(helper.number(1000)).toBeDefined();
        expect(helper.currency(25000000)).toBeDefined();
        expect(helper.date(new Date())).toBeDefined();
      });
    });
  });
  
  // ==================== CURRENCY CONVERTER TESTS ====================
  describe('Currency Converter - currencyConverter.js', () => {
    
    describe('Currency Configuration', () => {
      test('should have VND as default currency', () => {
        expect(DEFAULT_CURRENCY).toBe('VND');
      });
      
      test('should support VND, USD, and EUR', () => {
        expect(isSupportedCurrency('VND')).toBe(true);
        expect(isSupportedCurrency('USD')).toBe(true);
        expect(isSupportedCurrency('EUR')).toBe(true);
      });
      
      test('should reject unsupported currencies', () => {
        expect(isSupportedCurrency('GBP')).toBe(false);
        expect(isSupportedCurrency('JPY')).toBe(false);
        expect(isSupportedCurrency('')).toBe(false);
      });
      
      test('getCurrencyInfo should return correct info', () => {
        const vndInfo = getCurrencyInfo('VND');
        expect(vndInfo.code).toBe('VND');
        expect(vndInfo.symbol).toBe('₫');
        expect(vndInfo.decimalDigits).toBe(0);
        
        const usdInfo = getCurrencyInfo('USD');
        expect(usdInfo.code).toBe('USD');
        expect(usdInfo.symbol).toBe('$');
        expect(usdInfo.decimalDigits).toBe(2);
      });
      
      test('getAllCurrencies should return all currencies', () => {
        const currencies = getAllCurrencies();
        expect(currencies.length).toBe(3);
        expect(currencies.some(c => c.code === 'VND')).toBe(true);
        expect(currencies.some(c => c.code === 'USD')).toBe(true);
        expect(currencies.some(c => c.code === 'EUR')).toBe(true);
      });
    });
    
    describe('Currency Conversion', () => {
      test('should convert VND to USD', () => {
        const usd = convertFromVND(25000000, 'USD');
        expect(usd).toBeGreaterThan(0);
        expect(usd).toBeLessThan(25000000); // USD value should be less than VND
      });
      
      test('should convert VND to EUR', () => {
        const eur = convertFromVND(26300000, 'EUR');
        expect(eur).toBeGreaterThan(0);
      });
      
      test('should convert USD to VND', () => {
        const vnd = convertToVND(1000, 'USD');
        expect(vnd).toBeGreaterThan(1000); // VND value should be greater
      });
      
      test('should return same amount for same currency', () => {
        expect(convertCurrency(1000, 'VND', 'VND')).toBe(1000);
        expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
      });
      
      test('should handle null/undefined/NaN', () => {
        expect(convertCurrency(null, 'VND', 'USD')).toBe(0);
        expect(convertCurrency(undefined, 'VND', 'USD')).toBe(0);
        expect(convertCurrency(NaN, 'VND', 'USD')).toBe(0);
      });
      
      test('should convert between non-VND currencies (USD -> EUR)', () => {
        const eur = convertCurrency(1000, 'USD', 'EUR');
        expect(eur).toBeGreaterThan(0);
      });
    });
    
    describe('Display Price', () => {
      test('should return display price object', () => {
        const display = getDisplayPrice(25000000, 'USD');
        
        expect(display).toHaveProperty('amount');
        expect(display).toHaveProperty('currency', 'USD');
        expect(display).toHaveProperty('symbol', '$');
        expect(display).toHaveProperty('formatted');
        expect(display).toHaveProperty('original');
        expect(display.original.amount).toBe(25000000);
        expect(display.original.currency).toBe('VND');
      });
    });
    
    describe('Simple Price Formatting', () => {
      test('should format VND prices correctly', () => {
        const formatted = formatPriceSimple(25000000, 'VND');
        expect(formatted).toMatch(/25.*000.*000.*₫/);
      });
      
      test('should format USD prices correctly', () => {
        const formatted = formatPriceSimple(1000.50, 'USD');
        expect(formatted).toMatch(/\$.*1.*000.*50/);
      });
    });
    
    describe('Price Range Conversion', () => {
      test('should convert price range to target currency', () => {
        const range = convertPriceRange(10000000, 50000000, 'USD');
        
        expect(range).toHaveProperty('min');
        expect(range).toHaveProperty('max');
        expect(range).toHaveProperty('currency', 'USD');
        expect(range).toHaveProperty('formattedMin');
        expect(range).toHaveProperty('formattedMax');
        expect(range.max).toBeGreaterThan(range.min);
      });
    });
    
    describe('Cart Totals Conversion', () => {
      test('should convert all cart totals', () => {
        const totals = {
          subtotal: 20000000,
          shipping: 50000,
          discount: 1000000,
          tax: 1900000,
          total: 20950000
        };
        
        const converted = convertCartTotals(totals, 'USD');
        
        expect(converted).toHaveProperty('subtotal');
        expect(converted).toHaveProperty('shipping');
        expect(converted).toHaveProperty('discount');
        expect(converted).toHaveProperty('tax');
        expect(converted).toHaveProperty('total');
        expect(converted).toHaveProperty('currency', 'USD');
        expect(converted).toHaveProperty('formatted');
        expect(converted.formatted).toHaveProperty('subtotal');
      });
    });
    
    describe('Converter Helper Factory', () => {
      test('should create converter helper with all methods', () => {
        const helper = createConverterHelper('USD');
        
        expect(typeof helper.convert).toBe('function');
        expect(typeof helper.fromVND).toBe('function');
        expect(typeof helper.toVND).toBe('function');
        expect(typeof helper.format).toBe('function');
        expect(typeof helper.display).toBe('function');
        expect(typeof helper.priceRange).toBe('function');
        expect(typeof helper.cartTotals).toBe('function');
        expect(helper.currency).toBe('USD');
      });
    });
    
    describe('Utility Functions', () => {
      test('validateCurrency should return valid currency or fallback', () => {
        expect(validateCurrency('USD')).toBe('USD');
        expect(validateCurrency('usd')).toBe('USD');
        expect(validateCurrency('INVALID')).toBe('VND');
        expect(validateCurrency('')).toBe('VND');
      });
      
      test('getExchangeRateInfo should return rate information', () => {
        const info = getExchangeRateInfo('USD');
        
        expect(info).toHaveProperty('currency', 'USD');
        expect(info).toHaveProperty('rate');
        expect(info).toHaveProperty('reverseRate');
        expect(info).toHaveProperty('display');
        expect(info.rate).toBeGreaterThan(0);
      });
      
      test('bulkConvert should convert array of prices', () => {
        const prices = [1000000, 2000000, 3000000];
        const converted = bulkConvert(prices, 'USD');
        
        expect(converted.length).toBe(3);
        expect(converted[0]).toHaveProperty('original', 1000000);
        expect(converted[0]).toHaveProperty('converted');
        expect(converted[0]).toHaveProperty('formatted');
      });
    });
  });
  
  // ==================== I18N MIDDLEWARE TESTS ====================
  describe('i18n Middleware - middleware/i18n.js', () => {
    
    describe('Translation System', () => {
      test('should get Vietnamese translations', () => {
        const translation = getTranslation('vi', 'common.home');
        expect(translation).toBe('Trang chủ');
      });
      
      test('should get English translations', () => {
        const translation = getTranslation('en', 'common.home');
        expect(translation).toBe('Home');
      });
      
      test('should get nested translations', () => {
        const viTranslation = getTranslation('vi', 'cart.title');
        expect(viTranslation).toBe('Giỏ hàng của bạn');
        
        const enTranslation = getTranslation('en', 'cart.title');
        expect(enTranslation).toBe('Your Shopping Cart');
      });
      
      test('should return key if translation not found', () => {
        const result = getTranslation('vi', 'nonexistent.key');
        expect(result).toBe('nonexistent.key');
      });
      
      test('should interpolate parameters', () => {
        const result = getTranslation('vi', 'cart.freeShippingThreshold', { amount: '100.000₫' });
        expect(result).toContain('100.000₫');
      });
      
      test('should fallback to default locale for unknown locale', () => {
        const result = getTranslation('xx', 'common.home');
        expect(result).toBe('Trang chủ'); // Falls back to Vietnamese
      });
    });
    
    describe('Locale Detection', () => {
      test('should detect locale from query parameter', () => {
        const mockReq = {
          query: { lang: 'en' },
          cookies: {},
          headers: {}
        };
        expect(detectLocale(mockReq)).toBe('en');
      });
      
      test('should detect locale from cookie', () => {
        const mockReq = {
          query: {},
          cookies: { locale: 'en' },
          headers: {}
        };
        expect(detectLocale(mockReq)).toBe('en');
      });
      
      test('should detect locale from user preference', () => {
        const mockReq = {
          query: {},
          cookies: {},
          user: { preferredLanguage: 'en' },
          headers: {}
        };
        expect(detectLocale(mockReq)).toBe('en');
      });
      
      test('should detect locale from Accept-Language header', () => {
        const mockReq = {
          query: {},
          cookies: {},
          headers: { 'accept-language': 'en-US,en;q=0.9,vi;q=0.8' }
        };
        expect(detectLocale(mockReq)).toBe('en');
      });
      
      test('should return default locale when nothing detected', () => {
        const mockReq = {
          query: {},
          cookies: {},
          headers: {}
        };
        expect(detectLocale(mockReq)).toBe('vi');
      });
      
      test('query param should override cookie', () => {
        const mockReq = {
          query: { lang: 'vi' },
          cookies: { locale: 'en' },
          headers: {}
        };
        expect(detectLocale(mockReq)).toBe('vi');
      });
    });
    
    describe('Currency Detection', () => {
      test('should detect currency from query parameter', () => {
        const mockReq = {
          query: { currency: 'USD' },
          cookies: {},
          user: null
        };
        expect(detectCurrency(mockReq)).toBe('USD');
      });
      
      test('should detect currency from cookie', () => {
        const mockReq = {
          query: {},
          cookies: { currency: 'EUR' },
          user: null
        };
        expect(detectCurrency(mockReq)).toBe('EUR');
      });
      
      test('should detect currency from user preference', () => {
        const mockReq = {
          query: {},
          cookies: {},
          user: { preferredCurrency: 'USD' }
        };
        expect(detectCurrency(mockReq)).toBe('USD');
      });
      
      test('should return default currency when nothing detected', () => {
        const mockReq = {
          query: {},
          cookies: {},
          user: null
        };
        expect(detectCurrency(mockReq)).toBe('VND');
      });
    });
    
    describe('Get Translations for Locale', () => {
      test('should return all translations for Vietnamese', () => {
        const translations = getTranslationsForLocale('vi');
        expect(translations).toHaveProperty('common');
        expect(translations).toHaveProperty('nav');
        expect(translations).toHaveProperty('product');
        expect(translations).toHaveProperty('cart');
      });
      
      test('should return all translations for English', () => {
        const translations = getTranslationsForLocale('en');
        expect(translations).toHaveProperty('common');
        expect(translations).toHaveProperty('nav');
        expect(translations).toHaveProperty('product');
        expect(translations).toHaveProperty('cart');
      });
      
      test('should return default translations for unknown locale', () => {
        const translations = getTranslationsForLocale('xx');
        expect(translations).toHaveProperty('common');
      });
    });
  });
  
  // ==================== INTEGRATION TESTS ====================
  describe('Integration Tests', () => {
    
    test('should format price in different currencies correctly', () => {
      const priceVND = 25000000;
      
      // Convert to USD
      const usdAmount = convertFromVND(priceVND, 'USD');
      const usdFormatted = formatCurrency(usdAmount, 'USD', 'en');
      expect(usdFormatted).toMatch(/\$/);
      
      // Convert to EUR
      const eurAmount = convertFromVND(priceVND, 'EUR');
      const eurFormatted = formatCurrency(eurAmount, 'EUR', 'en');
      expect(eurFormatted).toMatch(/€/);
      
      // Keep as VND
      const vndFormatted = formatCurrency(priceVND, 'VND', 'vi');
      expect(vndFormatted).toMatch(/₫|VND/);
    });
    
    test('should use formatter helper with converter', () => {
      const formatterVI = createFormatterHelper('vi', 'VND');
      const converterUSD = createConverterHelper('USD');
      
      const priceVND = 25000000;
      const priceUSD = converterUSD.fromVND(priceVND);
      
      expect(formatterVI.currency(priceVND)).toMatch(/25.*000.*000/);
      expect(converterUSD.format(priceUSD)).toMatch(/\$/);
    });
    
    test('translations should cover all major sections', () => {
      const viTranslations = getTranslationsForLocale('vi');
      const enTranslations = getTranslationsForLocale('en');
      
      const requiredSections = ['common', 'nav', 'product', 'cart', 'checkout', 'order', 'user', 'auth', 'error'];
      
      requiredSections.forEach(section => {
        expect(viTranslations).toHaveProperty(section);
        expect(enTranslations).toHaveProperty(section);
      });
    });
  });
});
