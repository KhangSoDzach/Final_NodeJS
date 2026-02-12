/**
 * VAT Calculator Utility
 * Tính toán thuế VAT cho đơn hàng
 */

// VAT rate tại Việt Nam (10%)
const VAT_RATE = 0.10;

/**
 * Cấu hình VAT
 */
const vatConfig = {
  rate: VAT_RATE,
  name: 'VAT',
  country: 'Việt Nam',
  // Giá sản phẩm đã bao gồm VAT (typical for B2C in Vietnam)
  priceIncludesVat: true
};

/**
 * Tính VAT từ giá đã bao gồm VAT
 * @param {number} priceWithVat - Giá đã bao gồm VAT
 * @returns {object} { priceBeforeVat, vatAmount, priceWithVat }
 */
const calculateVatFromInclusivePrice = (priceWithVat) => {
  const priceBeforeVat = Math.round(priceWithVat / (1 + VAT_RATE));
  const vatAmount = priceWithVat - priceBeforeVat;
  
  return {
    priceBeforeVat,
    vatAmount,
    priceWithVat,
    vatRate: VAT_RATE,
    vatPercentage: `${VAT_RATE * 100}%`
  };
};

/**
 * Tính VAT từ giá chưa bao gồm VAT
 * @param {number} priceBeforeVat - Giá chưa bao gồm VAT
 * @returns {object} { priceBeforeVat, vatAmount, priceWithVat }
 */
const calculateVatFromExclusivePrice = (priceBeforeVat) => {
  const vatAmount = Math.round(priceBeforeVat * VAT_RATE);
  const priceWithVat = priceBeforeVat + vatAmount;
  
  return {
    priceBeforeVat,
    vatAmount,
    priceWithVat,
    vatRate: VAT_RATE,
    vatPercentage: `${VAT_RATE * 100}%`
  };
};

/**
 * Tính VAT cho đơn hàng
 * @param {object} order - Đơn hàng với items và shipping
 * @returns {object} Chi tiết VAT cho đơn hàng
 */
const calculateOrderVat = (order) => {
  const items = order.items || [];
  
  // Tính subtotal
  const subtotal = items.reduce((sum, item) => {
    const price = item.price || item.product?.price || 0;
    return sum + (price * item.quantity);
  }, 0);

  // Tính shipping
  const shippingCost = order.shippingCost || 0;
  
  // Tổng trước giảm giá
  const totalBeforeDiscount = subtotal + shippingCost;
  
  // Discount
  const discount = order.discount || 0;
  const loyaltyPointsDiscount = order.loyaltyPointsDiscount || 0;
  const totalDiscount = discount + loyaltyPointsDiscount;
  
  // Tổng sau giảm giá (giá đã bao gồm VAT)
  const totalWithVat = totalBeforeDiscount - totalDiscount;
  
  // Tính VAT breakdown
  const vatBreakdown = calculateVatFromInclusivePrice(totalWithVat);
  
  // Tính VAT cho từng item
  const itemsWithVat = items.map(item => {
    const price = item.price || item.product?.price || 0;
    const itemTotal = price * item.quantity;
    const itemVat = calculateVatFromInclusivePrice(itemTotal);
    
    return {
      ...item,
      priceBeforeVat: Math.round(price / (1 + VAT_RATE)),
      vatAmount: Math.round((price / (1 + VAT_RATE)) * VAT_RATE),
      totalBeforeVat: itemVat.priceBeforeVat,
      totalVat: itemVat.vatAmount,
      totalWithVat: itemVat.priceWithVat
    };
  });

  // VAT cho shipping
  const shippingVat = calculateVatFromInclusivePrice(shippingCost);

  return {
    subtotal,
    shippingCost,
    totalBeforeDiscount,
    discount: totalDiscount,
    totalWithVat,
    vatRate: VAT_RATE,
    vatPercentage: `${VAT_RATE * 100}%`,
    priceBeforeVat: vatBreakdown.priceBeforeVat,
    vatAmount: vatBreakdown.vatAmount,
    itemsWithVat,
    shippingVat: {
      priceBeforeVat: shippingVat.priceBeforeVat,
      vatAmount: shippingVat.vatAmount
    }
  };
};

/**
 * Format số tiền theo định dạng Việt Nam
 * @param {number} amount - Số tiền
 * @returns {string} Số tiền đã format
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

/**
 * Format số tiền không có ký hiệu tiền tệ
 * @param {number} amount - Số tiền
 * @returns {string} Số tiền đã format
 */
const formatNumber = (amount) => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Validate thông tin xuất hóa đơn VAT
 * @param {object} vatInfo - Thông tin hóa đơn
 * @returns {object} { isValid, errors }
 */
const validateVatInfo = (vatInfo) => {
  const errors = [];
  
  if (!vatInfo) {
    return { isValid: false, errors: ['Thông tin hóa đơn VAT không được để trống'] };
  }
  
  // Tên công ty/cá nhân
  if (!vatInfo.companyName || vatInfo.companyName.trim().length < 2) {
    errors.push('Tên công ty/người mua phải có ít nhất 2 ký tự');
  }
  
  // Mã số thuế (10 hoặc 13 số cho Việt Nam)
  if (vatInfo.taxCode) {
    const taxCodeRegex = /^[0-9]{10}(-[0-9]{3})?$/;
    if (!taxCodeRegex.test(vatInfo.taxCode)) {
      errors.push('Mã số thuế không hợp lệ (10 số hoặc 10-3 số)');
    }
  }
  
  // Địa chỉ
  if (!vatInfo.address || vatInfo.address.trim().length < 10) {
    errors.push('Địa chỉ phải có ít nhất 10 ký tự');
  }
  
  // Email (optional but must be valid if provided)
  if (vatInfo.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(vatInfo.email)) {
      errors.push('Email không hợp lệ');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Tạo VAT invoice number
 * @param {Date} date - Ngày xuất hóa đơn
 * @returns {string} Invoice number
 */
const generateInvoiceNumber = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `INV-${year}${month}${day}-${random}`;
};

/**
 * Kiểm tra đơn hàng đủ điều kiện xuất hóa đơn VAT
 * (Thường >= 200,000 VND)
 * @param {number} amount - Tổng tiền đơn hàng
 * @returns {boolean}
 */
const isEligibleForVatInvoice = (amount) => {
  const minimumAmount = 200000; // 200,000 VND
  return amount >= minimumAmount;
};

/**
 * Tính phí vận chuyển
 * Miễn phí cho đơn >= 500,000 VND, ngược lại 30,000 VND
 * @param {number} subtotal - Tổng tiền hàng
 * @returns {number} Phí vận chuyển
 */
const calculateShippingCost = (subtotal) => {
  const freeShippingThreshold = 500000;
  const defaultShippingFee = 30000;
  
  return subtotal >= freeShippingThreshold ? 0 : defaultShippingFee;
};

module.exports = {
  VAT_RATE,
  vatConfig,
  calculateVatFromInclusivePrice,
  calculateVatFromExclusivePrice,
  calculateOrderVat,
  formatCurrency,
  formatNumber,
  validateVatInfo,
  generateInvoiceNumber,
  isEligibleForVatInvoice,
  calculateShippingCost
};
