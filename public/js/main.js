/**
 * Source Computer - Main JavaScript file
 */

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Xử lý điều hướng mobile
    const navToggle = document.querySelector('.nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            const navList = document.querySelector('.nav-list');
            navList.classList.toggle('active');
        });
    }
    
    // Xử lý sidebar admin trên mobile
    const mobileToggle = document.querySelector('.mobile-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            const sidebar = document.querySelector('.admin-sidebar');
            sidebar.classList.toggle('show');
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
            if (savedViewMode === 'list') {
                products.classList.add('list-view-active');
                products.classList.remove('grid-view-active');
                document.querySelector('.list-view-btn').classList.add('active');
                document.querySelector('.grid-view-btn').classList.remove('active');
            } else {
                products.classList.add('grid-view-active');
                products.classList.remove('list-view-active');
                document.querySelector('.grid-view-btn').classList.add('active');
                document.querySelector('.list-view-btn').classList.remove('active');
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
});