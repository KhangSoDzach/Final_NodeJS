const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

// Create transporter with more reliable configuration
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || emailConfig.auth.user,
    pass: process.env.EMAIL_PASSWORD || emailConfig.auth.pass
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true // Enable debugging to see detailed logs
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
    return false;
  }
};