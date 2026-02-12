const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

// Create transporter with more reliable configuration
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || emailConfig.auth.user,
    pass: process.env.EMAIL_APP_PASSWORD || emailConfig.auth.pass // Use app password here
  },
  secure: true
});

// Test the connection when the service starts
transporter.verify(function(error, success) {
  if (error) {
    console.error('Email service error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Send password reset email with improved error handling
exports.sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    console.log(`Attempting to send password reset email to: ${email}`);
    console.log(`Using email account: ${process.env.EMAIL_USER}`);
    
    const mailOptions = {
      from: `"Source Computer" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: email,
      subject: 'Đặt lại mật khẩu Source Computer',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0066cc;">Source Computer</h1>
          </div>
          
          <p>Xin chào,</p>
          <p>Bạn nhận được email này vì bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          
          <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này và mật khẩu của bạn sẽ không thay đổi.</p>
          <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Source Computer. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      `,
      text: `Xin chào, bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Source Computer. Vui lòng truy cập liên kết sau để đặt lại mật khẩu: ${resetUrl}. Liên kết này sẽ hết hạn sau 1 giờ.`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error details:', error);
    return false;  }
};

// Send order confirmation email
exports.sendOrderConfirmationEmail = async (email, order) => {
  try {
    console.log(`Attempting to send order confirmation email to: ${email}`);
    
    // Format order date
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Format currency
    const formatCurrency = (amount) => {
      return amount.toLocaleString('vi-VN') + ' ₫';
    };
    
    // Build items table HTML
    let itemsHtml = '';
    order.items.forEach(item => {
      const productName = item.product ? item.product.name || 'Sản phẩm' : 'Sản phẩm';
      const variantInfo = item.variant ? ` - ${item.variant.name}: ${item.variant.value}` : '';
      
      itemsHtml += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${productName}${variantInfo}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
        </tr>
      `;
    });
    
    const mailOptions = {
      from: `"Source Computer" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: email,
      subject: `Xác nhận đơn hàng #${order.orderNumber} - Source Computer`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #0066cc;">Source Computer</h1>
            <h2 style="color: #333;">Xác nhận đơn hàng</h2>
          </div>
          
          <p>Xin chào ${order.shippingAddress.name},</p>
          <p>Cảm ơn bạn đã đặt hàng tại Source Computer. Đơn hàng của bạn đã được xác nhận!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Thông tin đơn hàng:</h3>
            <p><strong>Mã đơn hàng:</strong> #${order.orderNumber}</p>
            <p><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
            <p><strong>Phương thức thanh toán:</strong> ${
              order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
              order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
              'Thẻ tín dụng / Thẻ ghi nợ'
            }</p>
            <p><strong>Trạng thái thanh toán:</strong> ${
              order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
            }</p>
          </div>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Chi tiết sản phẩm:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                  <th style="padding: 10px; text-align: center;">Số lượng</th>
                  <th style="padding: 10px; text-align: right;">Đơn giá</th>
                  <th style="padding: 10px; text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tổng cộng:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold;">${formatCurrency(order.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Địa chỉ giao hàng:</h3>
            <p><strong>Người nhận:</strong> ${order.shippingAddress.name}</p>
            <p><strong>Địa chỉ:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.district}, ${order.shippingAddress.province}</p>
            <p><strong>Số điện thoại:</strong> ${order.shippingAddress.phone}</p>
          </div>
          
          <p>Bạn có thể theo dõi trạng thái đơn hàng của mình trong mục "Đơn hàng của tôi" trên trang web của chúng tôi.</p>
          <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
          
          <p style="margin-top: 30px;">Trân trọng,</p>
          <p><strong>Đội ngũ Source Computer</strong></p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Source Computer. Mọi quyền được bảo lưu.</p>
            <p>Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
            <p>Hotline: 1900 1234 | Email: support@sourcecomputer.vn</p>
          </div>
        </div>
      `,
      text: `
        Xác nhận đơn hàng - Source Computer
        
        Xin chào ${order.shippingAddress.name},
        
        Cảm ơn bạn đã đặt hàng tại Source Computer. Đơn hàng của bạn đã được xác nhận!
        
        Thông tin đơn hàng:
        - Mã đơn hàng: #${order.orderNumber}
        - Ngày đặt hàng: ${orderDate}
        - Tổng tiền: ${formatCurrency(order.totalAmount)}
        - Phương thức thanh toán: ${
          order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' :
          order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
          'Thẻ tín dụng / Thẻ ghi nợ'
        }
        
        Địa chỉ giao hàng:
        ${order.shippingAddress.name}
        ${order.shippingAddress.street}, ${order.shippingAddress.district}, ${order.shippingAddress.province}
        SĐT: ${order.shippingAddress.phone}
        
        Bạn có thể theo dõi trạng thái đơn hàng của mình trong mục "Đơn hàng của tôi" trên trang web của chúng tôi.
        
        Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi qua email hoặc hotline.
        
        Trân trọng,
        Đội ngũ Source Computer
        
        © ${new Date().getFullYear()} Source Computer. Mọi quyền được bảo lưu.
        Địa chỉ: 123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
        Hotline: 1900 1234 | Email: support@sourcecomputer.vn
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Order confirmation email send error details:', error);
    return false;
  }
};

/**
 * Gửi email thông báo pre-order có hàng
 */
exports.sendPreOrderNotification = async (preOrder) => {
  try {
    const productUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/products/${preOrder.product.slug}`;
    
    const mailOptions = {
      from: `"Source Computer" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: preOrder.contactEmail,
      subject: `🎉 Sản phẩm bạn đặt trước đã có hàng - ${preOrder.product.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #10b981;">🎉 Tin vui!</h1>
          </div>
          
          <p>Xin chào <strong>${preOrder.user?.name || 'bạn'}</strong>,</p>
          
          <p>Sản phẩm bạn đã đặt trước <strong>${preOrder.product.name}</strong> hiện đã có hàng!</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; align-items: center; gap: 15px;">
              ${preOrder.product.images && preOrder.product.images[0] ? 
                `<img src="${preOrder.product.images[0]}" alt="${preOrder.product.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : ''
              }
              <div>
                <h3 style="margin: 0 0 5px;">${preOrder.product.name}</h3>
                ${preOrder.variant && preOrder.variant.name ? 
                  `<p style="margin: 0; color: #64748b;">${preOrder.variant.name}: ${preOrder.variant.value}</p>` : ''
                }
                <p style="margin: 5px 0 0; font-size: 18px; color: #dc2626; font-weight: bold;">
                  ${new Intl.NumberFormat('vi-VN').format(preOrder.priceAtOrder)}đ
                </p>
              </div>
            </div>
          </div>
          
          <p style="color: #dc2626;"><strong>⚠️ Lưu ý:</strong> Giá đặt trước của bạn sẽ được bảo đảm trong <strong>48 giờ</strong>. Vui lòng hoàn tất đơn hàng trước khi hết hạn.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${productUrl}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Mua ngay
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Nếu bạn không muốn mua nữa, vui lòng bỏ qua email này. Đơn đặt trước sẽ tự động hủy sau 48 giờ.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>Source Computer - Đồng hành cùng công nghệ</p>
            <p>Hotline: 1900 1234 | Email: support@sourcecomputer.vn</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Pre-order notification sent to:', preOrder.contactEmail);
    return true;
  } catch (error) {
    console.error('Pre-order notification email error:', error);
    return false;
  }
};

/**
 * Gửi email thông báo sản phẩm có hàng lại (Back in Stock)
 */
exports.sendBackInStockNotification = async (subscription) => {
  try {
    const productUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/products/${subscription.product.slug}`;
    
    const mailOptions = {
      from: `"Source Computer" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: subscription.email,
      subject: `📦 Sản phẩm bạn quan tâm đã có hàng trở lại!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #3b82f6;">📦 Đã có hàng!</h1>
          </div>
          
          <p>Xin chào,</p>
          
          <p>Sản phẩm bạn đăng ký theo dõi hiện đã có hàng trở lại!</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            ${subscription.product.images && subscription.product.images[0] ? 
              `<img src="${subscription.product.images[0]}" alt="${subscription.product.name}" style="width: 150px; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">` : ''
            }
            <h3 style="margin: 10px 0 5px;">${subscription.product.name}</h3>
            ${subscription.variant && subscription.variant.name ? 
              `<p style="margin: 0; color: #64748b;">${subscription.variant.name}: ${subscription.variant.value}</p>` : ''
            }
            <p style="margin: 10px 0 0; font-size: 20px; color: #dc2626; font-weight: bold;">
              ${new Intl.NumberFormat('vi-VN').format(subscription.product.discountPrice || subscription.product.price)}đ
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${productUrl}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Xem sản phẩm
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Hãy nhanh tay đặt hàng trước khi sản phẩm hết hàng lần nữa! 🔥
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            <p>Source Computer - Đồng hành cùng công nghệ</p>
            <p>Hotline: 1900 1234 | Email: support@sourcecomputer.vn</p>
            <p style="margin-top: 10px;">
              <a href="${process.env.BASE_URL || 'http://localhost:3000'}/user/notifications/unsubscribe?email=${subscription.email}&product=${subscription.product._id}" style="color: #64748b;">
                Hủy đăng ký thông báo
              </a>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Back in stock notification sent to:', subscription.email);
    return true;
  } catch (error) {
    console.error('Back in stock notification email error:', error);
    return false;
  }
};

/**
 * Gửi email cảnh báo tồn kho thấp cho admin
 */
exports.sendLowStockAlert = async (products, adminEmail) => {
  try {
    const productList = products.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.sku || 'N/A'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${p.stock}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${p.lowStockThreshold}</td>
      </tr>
    `).join('');
    
    const mailOptions = {
      from: `"Source Computer" <${process.env.EMAIL_USER || emailConfig.auth.user}>`,
      to: adminEmail,
      subject: `⚠️ Cảnh báo: ${products.length} sản phẩm sắp hết hàng`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">⚠️ Cảnh báo tồn kho thấp</h2>
          
          <p>Các sản phẩm sau đây đang có tồn kho thấp và cần được nhập thêm:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: left;">SKU</th>
                <th style="padding: 10px; text-align: left;">Tồn kho</th>
                <th style="padding: 10px; text-align: left;">Ngưỡng</th>
              </tr>
            </thead>
            <tbody>
              ${productList}
            </tbody>
          </table>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin/inventory/alerts" 
               style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Xem chi tiết
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 12px;">
            Email này được gửi tự động từ hệ thống quản lý kho của Source Computer.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Low stock alert sent to admin:', adminEmail);
    return true;
  } catch (error) {
    console.error('Low stock alert email error:', error);
    return false;
  }
};