/**
 * Source Computer - Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
    // Debug flash messages
    console.log('Flash messages in DOM:', {
        success: document.querySelectorAll('.alert-success').length > 0,
        error: document.querySelectorAll('.alert-danger').length > 0
    });
    
    // Xử lý hiển thị thông báo toast
    const toasts = document.querySelectorAll('.toast');
    toasts.forEach(toast => {
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000); // Ẩn toast sau 5 giây
    });

    // Xử lý đóng toast khi click vào nút close
    const toastCloseButtons = document.querySelectorAll('.toast-close');
    toastCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const toast = this.closest('.toast');
            if (toast) {
                toast.classList.remove('show');
            }
        });
    });
    
    // Flash message handling - Cải thiện xử lý flash messages
    const alerts = document.querySelectorAll('.alert');
    if (alerts.length > 0) {
        // Cuộn lên đầu trang khi có flash message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Thêm class để kích hoạt animation (nếu có)
        alerts.forEach(alert => {
            alert.classList.add('alert-visible');
            
            // Tự động ẩn alerts sau 5 giây
            setTimeout(() => {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 500);
            }, 5000);
        });
    }
    
    // Xử lý nút đóng thông báo
    const alertCloseButtons = document.querySelectorAll('.alert .close-alert');
    alertCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.closest('.alert');
            if (alert) {
                alert.style.opacity = '0';
                setTimeout(() => {
                    alert.style.display = 'none';
                }, 500);
            }
        });
    });
    
    // Xử lý điều hướng mobile
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            const navList = document.querySelector('.nav-list');
            navList.classList.toggle('active');
            
            // Thêm class active cho thanh điều hướng để biết trạng thái menu đã mở
            document.querySelector('.main-nav').classList.toggle('menu-active');
            
            // Thay đổi icon hamburger khi mở/đóng menu
            const icon = this.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // Xử lý sidebar admin trên mobile
    const mobileToggle = document.querySelector('.mobile-toggle');
    const adminSidebar = document.querySelector('.admin-sidebar');
    
    if (mobileToggle && adminSidebar) {
        // Chuyển đổi trạng thái sidebar khi click nút toggle
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Ngăn sự kiện lan ra document
            adminSidebar.classList.toggle('show');
            
            // Thay đổi icon nếu có
            const icon = this.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-bars')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Đóng sidebar khi click bên ngoài
        document.addEventListener('click', function(e) {
            // Kiểm tra xem sidebar có đang hiển thị không và click không phải trong sidebar
            if (adminSidebar.classList.contains('show') && 
                !adminSidebar.contains(e.target) && 
                e.target !== mobileToggle && 
                !mobileToggle.contains(e.target)) {
                adminSidebar.classList.remove('show');
                
                // Reset icon nếu có
                const icon = mobileToggle.querySelector('i');
                if (icon && icon.classList.contains('fa-times')) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Ngăn sự kiện click trong sidebar lan ra ngoài
        adminSidebar.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Đóng sidebar khi thay đổi kích thước màn hình trở lại desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && adminSidebar.classList.contains('show')) {
                adminSidebar.classList.remove('show');
                
                // Reset icon nếu có
                const icon = mobileToggle.querySelector('i');
                if (icon && icon.classList.contains('fa-times')) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // Xử lý thay đổi chế độ xem sản phẩm (grid/list)
    const viewButtons = document.querySelectorAll('.view-btn');
    if (viewButtons.length > 0) {
        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const products = document.querySelector('.products');
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                if (this.classList.contains('grid-view-btn')) {
                    products.classList.add('grid-view-active');
                    products.classList.remove('list-view-active');
                    localStorage.setItem('view-mode', 'grid');
                } else {
                    products.classList.add('list-view-active');
                    products.classList.remove('grid-view-active');
                    localStorage.setItem('view-mode', 'list');
                }
            });
        });

        // Khôi phục chế độ xem đã lưu
        const savedViewMode = localStorage.getItem('view-mode');
        if (savedViewMode) {
            const products = document.querySelector('.products');
            if (products) {
                if (savedViewMode === 'list') {
                    products.classList.add('list-view-active');
                    products.classList.remove('grid-view-active');
                    const listBtn = document.querySelector('.list-view-btn');
                    const gridBtn = document.querySelector('.grid-view-btn');
                    if (listBtn) listBtn.classList.add('active');
                    if (gridBtn) gridBtn.classList.remove('active');
                } else {
                    products.classList.add('grid-view-active');
                    products.classList.remove('list-view-active');
                    const listBtn = document.querySelector('.list-view-btn');
                    const gridBtn = document.querySelector('.grid-view-btn');
                    if (gridBtn) gridBtn.classList.add('active');
                    if (listBtn) listBtn.classList.remove('active');
                }
            }
        }
    }
    
    // Xử lý slider hình ảnh sản phẩm
    const mainImage = document.querySelector('.main-image img');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    if (mainImage && thumbnails.length > 0) {
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener('click', function() {
                const src = this.getAttribute('data-src');
                mainImage.src = src;
                thumbnails.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
    }
    
    // Kiểm tra nếu có lỗi validation ở các form
    const formGroups = document.querySelectorAll('.form-group');
    formGroups.forEach(group => {
        const input = group.querySelector('input, select, textarea');
        if (input && input.classList.contains('is-invalid')) {
            input.addEventListener('input', function() {
                this.classList.remove('is-invalid');
                const feedback = group.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.style.display = 'none';
                }
            });
        }
    });    // Xử lý dropdown menus trên thiết bị di động (cho nav-list)
    const navDropdownLinks = document.querySelectorAll('.nav-list .dropdown > a');
    navDropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Chỉ ngăn mặc định khi đang ở chế độ mobile
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation(); // Ngăn lan sự kiện
                
                const dropdown = this.parentElement;
                dropdown.classList.toggle('open');
                
                const content = dropdown.querySelector('.dropdown-content');
                if (content) {
                    // Đóng tất cả dropdown khác trước
                    document.querySelectorAll('.nav-list .dropdown-content').forEach(otherContent => {
                        if (otherContent !== content && otherContent.classList.contains('show')) {
                            otherContent.classList.remove('show');
                            otherContent.style.display = 'none';
                            otherContent.parentElement.classList.remove('open');
                        }
                    });
                    
                    if (content.classList.contains('show')) {
                        content.classList.remove('show');
                        content.style.display = 'none';
                    } else {
                        content.classList.add('show');
                        content.style.display = 'block';
                    }
                }
            }
        });
    });// Xử lý menu dropdown trong user-actions
    const userDropdownToggle = document.querySelector('.user-actions .dropdown-toggle');
    const userDropdownContent = document.querySelector('.user-actions .dropdown-content');
    
    if (userDropdownToggle && userDropdownContent) {
        console.log('Found dropdown elements:', userDropdownToggle, userDropdownContent);
        
        // Đảm bảo dropdown ẩn khi trang tải lần đầu
        userDropdownContent.classList.remove('show');
        userDropdownContent.style.display = 'none';
        
        // Function để đóng user dropdown
        function closeUserDropdown() {
            console.log('Closing dropdown');
            userDropdownContent.classList.remove('show');
            userDropdownContent.style.display = 'none';
            userDropdownToggle.classList.remove('active');
            // Xóa event listener
            document.removeEventListener('click', handleOutsideClick);
        }
        
        // Function xử lý click bên ngoài dropdown
        function handleOutsideClick(event) {
            // Nếu click không phải vào dropdown toggle và không phải trong dropdown content
            if (!event.target.closest('.user-actions .dropdown-toggle') && 
                !event.target.closest('.user-actions .dropdown-content')) {
                console.log('Outside click detected');
                closeUserDropdown();
            }
        }
        
        // Xử lý click cho dropdown menu người dùng
        userDropdownToggle.addEventListener('click', function(e) {
            console.log('Dropdown toggle clicked');
            // Ngăn chặn hành vi mặc định của thẻ a
            e.preventDefault();
            e.stopPropagation();
              // Kiểm tra trạng thái hiện tại của dropdown
            const isCurrentlyOpen = userDropdownContent.classList.contains('show');
            
            // Đóng tất cả các dropdown khác trước khi mở cái mới
            document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
                if (dropdown !== userDropdownContent) {
                    dropdown.classList.remove('show');
                    dropdown.style.display = 'none';
                }
            });
            
            // Toggle trạng thái dropdown
            if (isCurrentlyOpen) {
                closeUserDropdown();
            } else {
                userDropdownContent.classList.add('show');
                userDropdownContent.style.display = 'block';
                userDropdownToggle.classList.add('active');
                // Thêm event listener để đóng dropdown khi click ra ngoài
                setTimeout(() => {
                    document.addEventListener('click', handleOutsideClick);
                }, 0);
            }
        });

        // Đóng dropdown khi click vào một mục trong menu
        const dropdownLinks = userDropdownContent.querySelectorAll('a');
        dropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                closeUserDropdown();
            });
        });
        
        // Đóng dropdown khi cuộn trang
        window.addEventListener('scroll', function() {
            if (userDropdownContent.classList.contains('show')) {
                closeUserDropdown();
            }
        });
        
        // Đóng dropdown khi thay đổi kích thước màn hình
        window.addEventListener('resize', function() {
            if (userDropdownContent.classList.contains('show')) {
                closeUserDropdown();
            }
        });
    }    // Đảm bảo đóng tất cả dropdown khi trang web tải lần đầu
    const allDropdownContents = document.querySelectorAll('.dropdown-content');
    allDropdownContents.forEach(dropdown => {
        dropdown.classList.remove('show');
        dropdown.style.display = 'none';
    });

    // Đảm bảo cũng đóng dropdown khi click vào màn hình di động
    document.addEventListener('touchstart', function(e) {
        // Kiểm tra nếu click không phải vào dropdown toggle và dropdown content
        if (!e.target.closest('.dropdown-toggle') && !e.target.closest('.dropdown-content')) {
            // Đóng tất cả dropdown
            allDropdownContents.forEach(dropdown => {
                dropdown.classList.remove('show');
                dropdown.style.display = 'none';
            });
            
            // Đảm bảo xóa class active trên tất cả toggle buttons
            const allToggleButtons = document.querySelectorAll('.dropdown-toggle');
            allToggleButtons.forEach(button => {
                button.classList.remove('active');
            });
        }
    });

    // Xử lý chọn variant và gửi đúng dữ liệu khi thêm vào giỏ
    const addToCartForm = document.getElementById('addToCartForm');
    if (addToCartForm) {
        addToCartForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(addToCartForm);
            const variants = {};
            for (const [key, value] of formData.entries()) {
                if (key.startsWith('variants[')) {
                    const variantName = key.match(/variants\[(.+)\]/)[1];
                    variants[variantName] = value;
                }
            }
            // Gửi AJAX với variants
            // ...AJAX code gửi productId, quantity, variants...
        });
    }
    
    // ===== PRE-ORDER & NOTIFICATION HANDLERS =====
    
    // Pre-order button handler
    const preOrderBtn = document.getElementById('preOrderBtn');
    if (preOrderBtn) {
        preOrderBtn.addEventListener('click', async function() {
            const productId = this.dataset.id;
            const quantityInput = document.getElementById('quantity');
            const quantity = quantityInput ? parseInt(quantityInput.value) : 1;
            
            // Get selected variant if any
            let variant = null;
            const variantSelect = document.querySelector('.variant-select');
            if (variantSelect) {
                variant = {
                    name: variantSelect.dataset.name,
                    value: variantSelect.value
                };
            }
            
            try {
                const response = await fetch('/products/pre-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId,
                        quantity,
                        variant
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('success', data.message);
                    // Optionally disable button
                    preOrderBtn.disabled = true;
                    preOrderBtn.innerHTML = '<i class="fas fa-check"></i> Đã đặt trước';
                } else {
                    if (response.status === 401) {
                        // Redirect to login
                        window.location.href = '/auth/login?returnTo=' + encodeURIComponent(window.location.pathname);
                    } else {
                        showToast('error', data.message);
                    }
                }
            } catch (error) {
                console.error('Pre-order error:', error);
                showToast('error', 'Đã xảy ra lỗi khi đặt trước. Vui lòng thử lại.');
            }
        });
    }
    
    // Notify button handler (Back in stock notification)
    const notifyBtn = document.getElementById('notifyBtn');
    if (notifyBtn) {
        notifyBtn.addEventListener('click', async function() {
            const productId = this.dataset.id;
            const emailInput = document.getElementById('notifyEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            
            if (!email) {
                showToast('error', 'Vui lòng nhập email');
                emailInput.focus();
                return;
            }
            
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showToast('error', 'Email không hợp lệ');
                emailInput.focus();
                return;
            }
            
            // Get selected variant if any
            let variant = null;
            const variantSelect = document.querySelector('.variant-select');
            if (variantSelect) {
                variant = {
                    name: variantSelect.dataset.name,
                    value: variantSelect.value
                };
            }
            
            try {
                const response = await fetch('/products/notify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        productId,
                        email,
                        variant
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showToast('success', data.message);
                    // Update UI
                    notifyBtn.disabled = true;
                    notifyBtn.innerHTML = '<i class="fas fa-check"></i> Đã đăng ký';
                } else {
                    showToast('error', data.message);
                }
            } catch (error) {
                console.error('Notify subscription error:', error);
                showToast('error', 'Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        });
    }
    
    // Helper function to show toast notifications
    function showToast(type, message) {
        // Check if toast container exists, if not create one
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;margin-left:10px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
});