/**
 * Invoice Generator Utility
 * Tạo hóa đơn PDF cho đơn hàng
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const vatCalculator = require('./vatCalculator');

// Company info for invoice
const companyInfo = {
  name: 'SOURCECOMPUTER',
  fullName: 'Công ty TNHH SourceComputer',
  taxCode: '0123456789', // Mã số thuế mẫu
  address: '123 Đường ABC, Phường XYZ, Quận 1, TP. Hồ Chí Minh',
  phone: '1900 1234',
  email: 'contact@sourcecomputer.vn',
  website: 'www.sourcecomputer.vn',
  bankAccount: '123456789',
  bankName: 'Vietcombank'
};

/**
 * Tạo PDF Invoice
 * @param {object} order - Đơn hàng
 * @param {object} options - Tùy chọn
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = async (order, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Hóa đơn ${order.invoiceNumber || order.orderNumber}`,
          Author: companyInfo.name,
          Subject: 'Hóa đơn bán hàng'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Register font for Vietnamese support
      const fontPath = path.join(__dirname, '../public/fonts/Roboto-Regular.ttf');
      const fontBoldPath = path.join(__dirname, '../public/fonts/Roboto-Bold.ttf');
      
      // Use default fonts if custom fonts not available
      const useDefaultFont = !fs.existsSync(fontPath);
      
      if (!useDefaultFont) {
        doc.registerFont('Vietnamese', fontPath);
        doc.registerFont('VietnameseBold', fontBoldPath);
      }

      // Header
      drawHeader(doc, order, useDefaultFont);

      // Customer Info
      drawCustomerInfo(doc, order, useDefaultFont);

      // Items Table
      drawItemsTable(doc, order, useDefaultFont);

      // VAT Summary
      drawVatSummary(doc, order, useDefaultFont);

      // Footer
      drawFooter(doc, order, useDefaultFont);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Vẽ header hóa đơn
 */
const drawHeader = (doc, order, useDefaultFont) => {
  const font = useDefaultFont ? 'Helvetica-Bold' : 'VietnameseBold';
  const fontNormal = useDefaultFont ? 'Helvetica' : 'Vietnamese';

  // Company logo placeholder
  doc.rect(50, 50, 100, 50).stroke();
  doc.font(font).fontSize(14).text('LOGO', 75, 70);

  // Company info
  doc.font(font).fontSize(16).text(companyInfo.name, 170, 50);
  doc.font(fontNormal).fontSize(10);
  doc.text(companyInfo.fullName, 170, 70);
  doc.text(`MST: ${companyInfo.taxCode}`, 170, 85);
  doc.text(companyInfo.address, 170, 100, { width: 350 });

  // Invoice title
  doc.moveDown(2);
  doc.font(font).fontSize(20).text('HOA DON BAN HANG', { align: 'center' });
  
  if (order.vatInvoice) {
    doc.font(fontNormal).fontSize(12).text('(VAT Invoice / Hoa don GTGT)', { align: 'center' });
  }

  // Invoice info
  doc.moveDown();
  doc.font(fontNormal).fontSize(10);
  
  const invoiceNumber = order.invoiceNumber || vatCalculator.generateInvoiceNumber(order.createdAt);
  const invoiceDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');
  
  doc.text(`So hoa don: ${invoiceNumber}`, 50);
  doc.text(`Ngay: ${invoiceDate}`, 50);
  doc.text(`Ma don hang: ${order.orderNumber || order._id}`, 50);

  doc.moveDown();
};

/**
 * Vẽ thông tin khách hàng
 */
const drawCustomerInfo = (doc, order, useDefaultFont) => {
  const font = useDefaultFont ? 'Helvetica-Bold' : 'VietnameseBold';
  const fontNormal = useDefaultFont ? 'Helvetica' : 'Vietnamese';

  doc.font(font).fontSize(12).text('THONG TIN KHACH HANG', 50);
  doc.moveDown(0.5);

  doc.font(fontNormal).fontSize(10);

  // Customer name
  const customerName = order.vatInfo?.companyName || 
                       order.shippingAddress?.fullName || 
                       order.user?.name || 
                       order.guestInfo?.name || 
                       'Khach hang';
  doc.text(`Ho ten/Ten cong ty: ${customerName}`);

  // Tax code (if VAT invoice)
  if (order.vatInfo?.taxCode) {
    doc.text(`Ma so thue: ${order.vatInfo.taxCode}`);
  }

  // Address
  const address = order.vatInfo?.address || 
                  formatAddress(order.shippingAddress) || 
                  'Khong co dia chi';
  doc.text(`Dia chi: ${address}`, { width: 500 });

  // Phone & Email
  const phone = order.shippingAddress?.phone || order.guestInfo?.phone || '';
  const email = order.vatInfo?.email || order.user?.email || order.guestInfo?.email || '';
  
  if (phone) doc.text(`Dien thoai: ${phone}`);
  if (email) doc.text(`Email: ${email}`);

  // Payment method
  const paymentMethod = getPaymentMethodText(order.paymentMethod);
  doc.text(`Hinh thuc thanh toan: ${paymentMethod}`);

  doc.moveDown();
};

/**
 * Vẽ bảng sản phẩm
 */
const drawItemsTable = (doc, order, useDefaultFont) => {
  const font = useDefaultFont ? 'Helvetica-Bold' : 'VietnameseBold';
  const fontNormal = useDefaultFont ? 'Helvetica' : 'Vietnamese';

  const tableTop = doc.y;
  const tableHeaders = ['STT', 'Ten san pham', 'DVT', 'SL', 'Don gia', 'Thanh tien'];
  const columnWidths = [30, 200, 40, 40, 90, 95];
  const columnPositions = [50];
  
  for (let i = 1; i < columnWidths.length; i++) {
    columnPositions.push(columnPositions[i - 1] + columnWidths[i - 1]);
  }

  // Draw header background
  doc.rect(50, tableTop, 495, 20).fill('#f0f0f0');
  
  // Draw headers
  doc.fillColor('black').font(font).fontSize(9);
  tableHeaders.forEach((header, i) => {
    doc.text(header, columnPositions[i] + 2, tableTop + 5, {
      width: columnWidths[i] - 4,
      align: i > 2 ? 'right' : 'left'
    });
  });

  // Calculate VAT for items
  const vatData = vatCalculator.calculateOrderVat(order);

  // Draw items
  let currentY = tableTop + 25;
  doc.font(fontNormal).fontSize(9);

  order.items.forEach((item, index) => {
    const price = item.price || item.product?.price || 0;
    const total = price * item.quantity;
    const productName = item.product?.name || item.productName || 'San pham';
    const variant = item.variant ? ` (${item.variant.name}: ${item.variant.value})` : '';
    
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    // Row data
    const rowData = [
      (index + 1).toString(),
      truncateText(productName + variant, 35),
      'Cai',
      item.quantity.toString(),
      vatCalculator.formatNumber(price),
      vatCalculator.formatNumber(total)
    ];

    rowData.forEach((cell, i) => {
      doc.text(cell, columnPositions[i] + 2, currentY, {
        width: columnWidths[i] - 4,
        align: i > 2 ? 'right' : 'left'
      });
    });

    currentY += 20;
  });

  // Draw table border
  doc.rect(50, tableTop, 495, currentY - tableTop).stroke();
  
  // Draw column lines
  columnPositions.forEach(pos => {
    doc.moveTo(pos, tableTop).lineTo(pos, currentY).stroke();
  });
  doc.moveTo(545, tableTop).lineTo(545, currentY).stroke();

  // Draw header bottom line
  doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).stroke();

  doc.y = currentY + 10;
};

/**
 * Vẽ tổng kết VAT
 */
const drawVatSummary = (doc, order, useDefaultFont) => {
  const font = useDefaultFont ? 'Helvetica-Bold' : 'VietnameseBold';
  const fontNormal = useDefaultFont ? 'Helvetica' : 'Vietnamese';

  const vatData = vatCalculator.calculateOrderVat(order);
  const startX = 350;
  let currentY = doc.y + 10;

  doc.font(fontNormal).fontSize(10);

  // Subtotal
  doc.text('Tong tien hang:', startX, currentY);
  doc.text(vatCalculator.formatNumber(vatData.subtotal) + ' d', 450, currentY, { align: 'right', width: 95 });
  currentY += 18;

  // Shipping
  if (vatData.shippingCost > 0) {
    doc.text('Phi van chuyen:', startX, currentY);
    doc.text(vatCalculator.formatNumber(vatData.shippingCost) + ' d', 450, currentY, { align: 'right', width: 95 });
    currentY += 18;
  }

  // Discount
  if (vatData.discount > 0) {
    doc.text('Giam gia:', startX, currentY);
    doc.text('-' + vatCalculator.formatNumber(vatData.discount) + ' d', 450, currentY, { align: 'right', width: 95 });
    currentY += 18;
  }

  // VAT breakdown (if VAT invoice)
  if (order.vatInvoice) {
    doc.text(`Gia truoc thue:`, startX, currentY);
    doc.text(vatCalculator.formatNumber(vatData.priceBeforeVat) + ' d', 450, currentY, { align: 'right', width: 95 });
    currentY += 18;

    doc.text(`Thue GTGT (${vatData.vatPercentage}):`, startX, currentY);
    doc.text(vatCalculator.formatNumber(vatData.vatAmount) + ' d', 450, currentY, { align: 'right', width: 95 });
    currentY += 18;
  }

  // Total
  doc.font(font).fontSize(12);
  doc.text('TONG CONG:', startX, currentY);
  doc.text(vatCalculator.formatNumber(order.totalAmount || vatData.totalWithVat) + ' d', 450, currentY, { align: 'right', width: 95 });
  currentY += 25;

  // Amount in words
  doc.font(fontNormal).fontSize(10);
  const amountInWords = numberToVietnameseWords(order.totalAmount || vatData.totalWithVat);
  doc.text(`Bang chu: ${amountInWords} dong`, 50, currentY, { width: 495 });

  doc.y = currentY + 30;
};

/**
 * Vẽ footer
 */
const drawFooter = (doc, order, useDefaultFont) => {
  const font = useDefaultFont ? 'Helvetica-Bold' : 'VietnameseBold';
  const fontNormal = useDefaultFont ? 'Helvetica' : 'Vietnamese';

  const currentY = doc.y;

  // Signatures
  doc.font(font).fontSize(10);
  doc.text('Nguoi mua hang', 100, currentY, { align: 'center', width: 150 });
  doc.text('Nguoi ban hang', 350, currentY, { align: 'center', width: 150 });

  doc.font(fontNormal).fontSize(9);
  doc.text('(Ky, ghi ro ho ten)', 100, currentY + 15, { align: 'center', width: 150 });
  doc.text('(Ky, ghi ro ho ten)', 350, currentY + 15, { align: 'center', width: 150 });

  // Notes
  doc.moveDown(5);
  doc.font(fontNormal).fontSize(8);
  doc.text('Luu y: Day la hoa don ban hang, khong co gia tri thay the hoa don do tai chinh.', 50, doc.y, { width: 495, align: 'center' });
  
  if (!order.vatInvoice) {
    doc.text('De nhan hoa don VAT, vui long lien he: ' + companyInfo.email, 50, doc.y + 10, { width: 495, align: 'center' });
  }

  // Footer line
  doc.moveDown(2);
  doc.fontSize(8).fillColor('gray');
  doc.text(`${companyInfo.name} | ${companyInfo.phone} | ${companyInfo.website}`, 50, 780, { align: 'center', width: 495 });
};

/**
 * Helper: Format địa chỉ
 */
const formatAddress = (address) => {
  if (!address) return '';
  const parts = [
    address.street,
    address.ward,
    address.district,
    address.city
  ].filter(Boolean);
  return parts.join(', ');
};

/**
 * Helper: Lấy text phương thức thanh toán
 */
const getPaymentMethodText = (method) => {
  const methods = {
    'cod': 'Thanh toan khi nhan hang (COD)',
    'bank_transfer': 'Chuyen khoan ngan hang',
    'vnpay': 'VNPay',
    'momo': 'Vi MoMo',
    'zalopay': 'ZaloPay',
    'credit_card': 'The tin dung'
  };
  return methods[method] || method || 'Tien mat';
};

/**
 * Helper: Truncate text
 */
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

/**
 * Helper: Convert number to Vietnamese words
 */
const numberToVietnameseWords = (number) => {
  if (number === 0) return 'Khong';
  
  const units = ['', 'mot', 'hai', 'ba', 'bon', 'nam', 'sau', 'bay', 'tam', 'chin'];
  const teens = ['muoi', 'muoi mot', 'muoi hai', 'muoi ba', 'muoi bon', 'muoi lam', 'muoi sau', 'muoi bay', 'muoi tam', 'muoi chin'];
  
  const convert = (n) => {
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return units[ten] + ' muoi' + (one > 0 ? ' ' + units[one] : '');
    }
    if (n < 1000) {
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      return units[hundred] + ' tram' + (rest > 0 ? ' ' + convert(rest) : '');
    }
    if (n < 1000000) {
      const thousand = Math.floor(n / 1000);
      const rest = n % 1000;
      return convert(thousand) + ' nghin' + (rest > 0 ? ' ' + convert(rest) : '');
    }
    if (n < 1000000000) {
      const million = Math.floor(n / 1000000);
      const rest = n % 1000000;
      return convert(million) + ' trieu' + (rest > 0 ? ' ' + convert(rest) : '');
    }
    const billion = Math.floor(n / 1000000000);
    const rest = n % 1000000000;
    return convert(billion) + ' ty' + (rest > 0 ? ' ' + convert(rest) : '');
  };

  const result = convert(Math.floor(number));
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * Generate HTML Invoice (alternative to PDF)
 */
const generateInvoiceHTML = (order) => {
  const vatData = vatCalculator.calculateOrderVat(order);
  const invoiceNumber = order.invoiceNumber || vatCalculator.generateInvoiceNumber(order.createdAt);
  const invoiceDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hóa đơn ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
    .invoice { max-width: 800px; margin: 0 auto; padding: 30px; background: #fff; }
    .header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2ecc71; }
    .company-info h1 { color: #2ecc71; font-size: 24px; }
    .invoice-info { text-align: right; }
    .invoice-title { text-align: center; margin: 20px 0; }
    .invoice-title h2 { font-size: 22px; color: #2c3e50; }
    .customer-info { margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th, .items-table td { padding: 12px; border: 1px solid #ddd; }
    .items-table th { background: #2ecc71; color: white; text-align: left; }
    .items-table tr:nth-child(even) { background: #f8f9fa; }
    .items-table .text-right { text-align: right; }
    .summary { width: 300px; margin-left: auto; }
    .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .summary-row.total { font-size: 18px; font-weight: bold; color: #2ecc71; border-top: 2px solid #2ecc71; }
    .amount-words { margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; font-style: italic; }
    .signatures { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
    .signature-box { width: 200px; }
    .signature-line { border-top: 1px solid #333; margin-top: 80px; padding-top: 10px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
    @media print { 
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="company-info">
        <h1>${companyInfo.name}</h1>
        <p>${companyInfo.fullName}</p>
        <p>MST: ${companyInfo.taxCode}</p>
        <p>${companyInfo.address}</p>
        <p>ĐT: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
      </div>
      <div class="invoice-info">
        <p><strong>Số hóa đơn:</strong> ${invoiceNumber}</p>
        <p><strong>Ngày:</strong> ${invoiceDate}</p>
        <p><strong>Mã đơn hàng:</strong> ${order.orderNumber || order._id}</p>
      </div>
    </div>

    <div class="invoice-title">
      <h2>HÓA ĐƠN BÁN HÀNG</h2>
      ${order.vatInvoice ? '<p>(VAT Invoice / Hóa đơn GTGT)</p>' : ''}
    </div>

    <div class="customer-info">
      <h3>Thông tin khách hàng</h3>
      <p><strong>Họ tên/Công ty:</strong> ${order.vatInfo?.companyName || order.shippingAddress?.fullName || order.guestInfo?.name || 'Khách hàng'}</p>
      ${order.vatInfo?.taxCode ? `<p><strong>Mã số thuế:</strong> ${order.vatInfo.taxCode}</p>` : ''}
      <p><strong>Địa chỉ:</strong> ${order.vatInfo?.address || formatAddress(order.shippingAddress) || 'N/A'}</p>
      <p><strong>Điện thoại:</strong> ${order.shippingAddress?.phone || order.guestInfo?.phone || 'N/A'}</p>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50px">STT</th>
          <th>Tên sản phẩm</th>
          <th style="width: 60px">ĐVT</th>
          <th style="width: 60px" class="text-right">SL</th>
          <th style="width: 120px" class="text-right">Đơn giá</th>
          <th style="width: 120px" class="text-right">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map((item, index) => {
          const price = item.price || item.product?.price || 0;
          const total = price * item.quantity;
          const productName = item.product?.name || item.productName || 'Sản phẩm';
          const variant = item.variant ? ` (${item.variant.name}: ${item.variant.value})` : '';
          return `
            <tr>
              <td>${index + 1}</td>
              <td>${productName}${variant}</td>
              <td>Cái</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">${vatCalculator.formatNumber(price)}đ</td>
              <td class="text-right">${vatCalculator.formatNumber(total)}đ</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Tổng tiền hàng:</span>
        <span>${vatCalculator.formatNumber(vatData.subtotal)}đ</span>
      </div>
      ${vatData.shippingCost > 0 ? `
        <div class="summary-row">
          <span>Phí vận chuyển:</span>
          <span>${vatCalculator.formatNumber(vatData.shippingCost)}đ</span>
        </div>
      ` : ''}
      ${vatData.discount > 0 ? `
        <div class="summary-row">
          <span>Giảm giá:</span>
          <span>-${vatCalculator.formatNumber(vatData.discount)}đ</span>
        </div>
      ` : ''}
      ${order.vatInvoice ? `
        <div class="summary-row">
          <span>Giá trước thuế:</span>
          <span>${vatCalculator.formatNumber(vatData.priceBeforeVat)}đ</span>
        </div>
        <div class="summary-row">
          <span>Thuế GTGT (${vatData.vatPercentage}):</span>
          <span>${vatCalculator.formatNumber(vatData.vatAmount)}đ</span>
        </div>
      ` : ''}
      <div class="summary-row total">
        <span>TỔNG CỘNG:</span>
        <span>${vatCalculator.formatNumber(order.totalAmount || vatData.totalWithVat)}đ</span>
      </div>
    </div>

    <div class="amount-words">
      <strong>Bằng chữ:</strong> ${numberToVietnameseWords(order.totalAmount || vatData.totalWithVat)} đồng
    </div>

    <div class="signatures">
      <div class="signature-box">
        <strong>Người mua hàng</strong>
        <div class="signature-line">(Ký, ghi rõ họ tên)</div>
      </div>
      <div class="signature-box">
        <strong>Người bán hàng</strong>
        <div class="signature-line">(Ký, ghi rõ họ tên)</div>
      </div>
    </div>

    <div class="footer">
      <p>${companyInfo.name} | ${companyInfo.phone} | ${companyInfo.website}</p>
      <p>Cảm ơn quý khách đã mua hàng!</p>
    </div>

    <div class="no-print" style="margin-top: 30px; text-align: center;">
      <button onclick="window.print()" style="padding: 10px 30px; font-size: 16px; background: #2ecc71; color: white; border: none; cursor: pointer; border-radius: 5px;">
        🖨️ In hóa đơn
      </button>
    </div>
  </div>
</body>
</html>`;
};

module.exports = {
  companyInfo,
  generateInvoicePDF,
  generateInvoiceHTML,
  formatAddress,
  getPaymentMethodText,
  numberToVietnameseWords
};
