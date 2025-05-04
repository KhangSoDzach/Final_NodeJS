/**
 * Source Computer - Checkout Page JavaScript
 * Xử lý logic cho trang thanh toán
 */

document.addEventListener('DOMContentLoaded', function() {
    // Biến toàn cục nhận từ EJS
    let userLoyaltyPoints = 0;
    let cartTotalNoDiscount = 0;
    let cartTotalWithDiscount = 0;
    let isUserLoggedIn = false;

    // Khởi tạo các giá trị từ dữ liệu được nhúng
    function initializeCheckoutData(data) {
        userLoyaltyPoints = data.userLoyaltyPoints || 0;
        cartTotalNoDiscount = data.cartTotalNoDiscount || 0;
        cartTotalWithDiscount = data.cartTotalWithDiscount || cartTotalNoDiscount;
        isUserLoggedIn = data.isUserLoggedIn || false;
    }

    // Xử lý chọn địa chỉ đã lưu
    function handleSavedAddresses(addresses) {
        const savedAddressSelect = document.getElementById('saved-address');
        if (savedAddressSelect) {
            savedAddressSelect.addEventListener('change', function() {
                if (this.value !== '') {
                    const index = parseInt(this.value);
                    const address = addresses[index];
                    
                    if (address) {
                        document.getElementById('street').value = address.street || '';
                        document.getElementById('district').value = address.district || '';
                        document.getElementById('province').value = address.province || '';
                    }
                }
            });
        }
    }
    
    // Xử lý phương thức thanh toán
    function handlePaymentMethods() {
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                // Ẩn tất cả chi tiết thanh toán
                document.querySelectorAll('.payment-details').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Hiển thị chi tiết thanh toán đã chọn
                if (this.value === 'bank_transfer') {
                    document.querySelector('.bank-transfer-details').style.display = 'block';
                } else if (this.value === 'credit_card') {
                    document.querySelector('.credit-card-details').style.display = 'block';
                }
            });
        });
    }

    // Xử lý sử dụng điểm tích lũy
    function handleLoyaltyPoints() {
        const loyaltyCheckbox = document.getElementById('useLoyaltyPoints');
        if (loyaltyCheckbox) {
            loyaltyCheckbox.addEventListener('change', function() {
                const loyaltyDiscount = document.querySelector('.loyalty-discount');
                const orderTotal = document.querySelector('.order-total');

                if (this.checked) {
                    if (loyaltyDiscount) loyaltyDiscount.style.display = 'flex';

                    const loyaltyValue = userLoyaltyPoints * 1000;
                    let newTotal = cartTotalWithDiscount - loyaltyValue;
                    if (newTotal < 0) newTotal = 0;

                    if (orderTotal) orderTotal.textContent = newTotal.toLocaleString('vi-VN') + ' ₫';
                } else {
                    if (loyaltyDiscount) loyaltyDiscount.style.display = 'none';
                    if (orderTotal) orderTotal.textContent = cartTotalWithDiscount.toLocaleString('vi-VN') + ' ₫';
                }
            });
        }
    }

    // Xử lý áp dụng mã giảm giá
    function handleCouponApplication() {
        const applyCouponBtn = document.getElementById('apply-coupon');
        if (applyCouponBtn) {
            applyCouponBtn.addEventListener('click', function() {
                const couponCode = document.getElementById('coupon-code').value.trim();
                const couponMessage = document.getElementById('coupon-message');

                if (!couponCode) {
                    if (couponMessage) couponMessage.innerHTML = '<p class="text-danger">Vui lòng nhập mã giảm giá</p>';
                    return;
                }

                fetch('/cart/apply-coupon', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ couponCode })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        if (couponMessage) couponMessage.innerHTML = `<p class="text-success">${data.message}</p>`;
                        location.reload();
                    } else {
                        if (couponMessage) couponMessage.innerHTML = `<p class="text-danger">${data.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    if (couponMessage) couponMessage.innerHTML = '<p class="text-danger">Đã xảy ra lỗi khi áp dụng mã giảm giá</p>';
                });
            });
        }
    }

    // Xử lý xóa mã giảm giá
    function handleCouponRemoval() {
        const removeCouponBtn = document.getElementById('remove-coupon');
        if (removeCouponBtn) {
            removeCouponBtn.addEventListener('click', function() {
                fetch('/cart/remove-coupon', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        location.reload();
                    } else {
                        alert(data.message || 'Đã xảy ra lỗi khi xóa mã giảm giá');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Đã xảy ra lỗi khi xóa mã giảm giá');
                });
            });
        }
    }

    // Tạo và hiển thị thông báo xử lý đặt hàng
    function showProcessingMessage() {
        // Tạo overlay thông báo
        const overlay = document.createElement('div');
        overlay.id = 'checkout-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';
        
        const messageBox = document.createElement('div');
        messageBox.style.backgroundColor = 'white';
        messageBox.style.padding = '30px';
        messageBox.style.borderRadius = '10px';
        messageBox.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        messageBox.style.textAlign = 'center';
        messageBox.style.maxWidth = '80%';
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.border = '4px solid #f3f3f3';
        spinner.style.borderTop = '4px solid #3498db';
        spinner.style.borderRadius = '50%';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.margin = '0 auto 20px auto';
        spinner.style.animation = 'spin 1s linear infinite';
        
        const styleElement = document.createElement('style');
        styleElement.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        
        const message = document.createElement('p');
        message.textContent = 'Đang xử lý đơn hàng của bạn...';
        message.style.fontSize = '18px';
        message.style.marginBottom = '15px';
        
        const subMessage = document.createElement('p');
        subMessage.textContent = 'Vui lòng không đóng trang này.';
        subMessage.style.fontSize = '14px';
        subMessage.style.color = '#666';
        
        messageBox.appendChild(spinner);
        messageBox.appendChild(message);
        messageBox.appendChild(subMessage);
        overlay.appendChild(messageBox);
        document.head.appendChild(styleElement);
        document.body.appendChild(overlay);
        
        return overlay;
    }
    
    // Xử lý lỗi timeout khi đặt hàng quá lâu
    function handleOrderTimeout(overlay, placeOrderBtn) {
        const messageBox = overlay.querySelector('div');
        const spinner = overlay.querySelector('.spinner');
        
        spinner.style.display = 'none';
        messageBox.style.backgroundColor = '#fff8f8';
        messageBox.style.borderTop = '5px solid #e74c3c';
        
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Quá thời gian xử lý đơn hàng!';
        errorMessage.style.fontSize = '18px';
        errorMessage.style.color = '#e74c3c';
        errorMessage.style.fontWeight = 'bold';
        errorMessage.style.marginBottom = '15px';
        
        const errorSubMessage = document.createElement('p');
        errorSubMessage.textContent = 'Vui lòng thử lại hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ.';
        errorSubMessage.style.fontSize = '14px';
        errorSubMessage.style.marginBottom = '20px';
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Thử lại';
        retryButton.style.padding = '10px 20px';
        retryButton.style.border = 'none';
        retryButton.style.borderRadius = '5px';
        retryButton.style.backgroundColor = '#3498db';
        retryButton.style.color = 'white';
        retryButton.style.cursor = 'pointer';
        retryButton.style.marginRight = '10px';
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Hủy';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.backgroundColor = '#ccc';
        cancelButton.style.color = 'white';
        cancelButton.style.cursor = 'pointer';
        
        // Thêm sự kiện cho nút
        retryButton.addEventListener('click', function() {
            overlay.remove();
            document.getElementById('checkout-form').submit();
        });
        
        cancelButton.addEventListener('click', function() {
            overlay.remove();
            if (placeOrderBtn) {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = 'Đặt hàng';
            }
        });
        
        // Xóa nội dung cũ và thêm thông báo lỗi
        messageBox.innerHTML = '';
        messageBox.appendChild(errorMessage);
        messageBox.appendChild(errorSubMessage);
        messageBox.appendChild(retryButton);
        messageBox.appendChild(cancelButton);
    }

    // Xác thực biểu mẫu thanh toán
    function validateCheckoutForm() {
        const checkoutForm = document.getElementById('checkout-form');
        const placeOrderBtn = document.getElementById('place-order-btn');

        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                // Không ngăn chặn việc gửi biểu mẫu theo mặc định
                // Chỉ ngăn chặn nếu xác thực không thành công
                
                const name = document.getElementById('name').value;
                const phone = document.getElementById('phone').value;
                const street = document.getElementById('street').value;
                const district = document.getElementById('district').value;
                const province = document.getElementById('province').value;

                // Kiểm tra email cho khách thanh toán không đăng nhập
                if (!isUserLoggedIn && document.getElementById('email')) {
                    const email = document.getElementById('email').value;
                    if (!email) {
                        e.preventDefault();
                        alert('Vui lòng nhập email để tiếp tục.');
                        return;
                    }
                }

                if (!name || !phone || !street || !district || !province) {
                    e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                    alert('Vui lòng điền đầy đủ thông tin giao hàng.');
                    return;
                }

                const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
                if (!phoneRegex.test(phone)) {
                    e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                    alert('Số điện thoại không hợp lệ.');
                    return;
                }

                // Kiểm tra phương thức thanh toán
                const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
                if (!paymentMethod) {
                    e.preventDefault();
                    alert('Vui lòng chọn phương thức thanh toán.');
                    return;
                }

                if (paymentMethod.value === 'credit_card') {
                    const cardNumber = document.getElementById('card_number').value;
                    const cardName = document.getElementById('card_name').value;
                    const cardExpiry = document.getElementById('card_expiry').value;
                    const cardCvv = document.getElementById('card_cvv').value;

                    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
                        e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                        alert('Vui lòng điền đầy đủ thông tin thẻ thanh toán.');
                        return;
                    }

                    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
                        e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                        alert('Số thẻ không hợp lệ.');
                        return;
                    }

                    if (!/^\d{3,4}$/.test(cardCvv)) {
                        e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                        alert('Mã CVV không hợp lệ.');
                        return;
                    }

                    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
                        e.preventDefault(); // Ngăn chặn gửi biểu mẫu
                        alert('Định dạng ngày hết hạn không hợp lệ (MM/YY).');
                        return;
                    }
                }

                // Nếu mọi xác thực đều thành công
                // Vô hiệu hóa nút để tránh gửi đơn hàng hai lần và hiển thị trạng thái đang xử lý
                if (placeOrderBtn) {
                    placeOrderBtn.disabled = true;
                    placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';
                }
                
                // Hiển thị thông báo xử lý đặt hàng
                const processingOverlay = showProcessingMessage();
                
                // Thiết lập timeout cho trường hợp quá trình xử lý quá lâu (30 giây)
                const orderTimeout = setTimeout(() => {
                    handleOrderTimeout(processingOverlay, placeOrderBtn);
                }, 30000);
                
                // Lưu timeout ID vào window để có thể huỷ nếu cần
                window.orderTimeoutId = orderTimeout;
                
                // Tiếp tục gửi biểu mẫu
                console.log('Đang xử lý đơn hàng...');
            });
        }
    }

    // Hàm khởi tạo để chạy tất cả các hàm xử lý
    window.initCheckoutPage = function(data) {
        initializeCheckoutData(data);
        handleSavedAddresses(data.addresses || []);
        handlePaymentMethods();
        handleLoyaltyPoints();
        handleCouponApplication();
        handleCouponRemoval();
        validateCheckoutForm();
    };
});