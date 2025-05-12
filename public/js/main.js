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
    });
    
    // Xử lý dropdown menus trên thiết bị di động (cho nav-list)
    const navDropdownLinks = document.querySelectorAll('.nav-list .dropdown > a');
    if (window.innerWidth <= 768) {
        navDropdownLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Chỉ ngăn mặc định khi đang ở chế độ mobile
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.parentElement;
                    dropdown.classList.toggle('open');
                    const content = dropdown.querySelector('.dropdown-content');
                    if (content) {
                        if (content.style.display === 'block') {
                            content.style.display = 'none';
                        } else {
                            content.style.display = 'block';
                        }
                    }
                }
            });
        });
    }

    // Xử lý menu dropdown trong user-actions
    const userDropdownToggle = document.querySelector('.user-actions .dropdown-toggle');
    const userDropdownContent = document.querySelector('.user-actions .dropdown-content');
    
    if (userDropdownToggle && userDropdownContent) {
        // Function để đóng user dropdown
        function closeUserDropdown() {
            userDropdownContent.classList.remove('show');
            // Xóa event listener
            document.removeEventListener('click', handleOutsideClick);
        }
        
        // Function xử lý click bên ngoài dropdown
        function handleOutsideClick(event) {
            // Nếu click không phải vào dropdown toggle và không phải trong dropdown content
            if (!event.target.closest('.user-actions .dropdown-toggle') && 
                !event.target.closest('.user-actions .dropdown-content')) {
                closeUserDropdown();
            }
        }
        
        // Xử lý click cho dropdown menu người dùng
        userDropdownToggle.addEventListener('click', function(e) {
            // Ngăn chặn hành vi mặc định của thẻ a
            e.preventDefault();
            e.stopPropagation();
            
            // Kiểm tra trạng thái hiện tại của dropdown
            const isCurrentlyOpen = userDropdownContent.classList.contains('show');
            
            // Đóng tất cả các dropdown khác trước khi mở cái mới
            document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
                if (dropdown !== userDropdownContent) {
                    dropdown.classList.remove('show');
                }
            });
            
            // Toggle trạng thái dropdown
            if (isCurrentlyOpen) {
                closeUserDropdown();
            } else {
                userDropdownContent.classList.add('show');
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
    }

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
});