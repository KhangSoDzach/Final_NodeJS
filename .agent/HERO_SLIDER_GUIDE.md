# Hero Slider / Banner Documentation

## Tổng quan
Hero Slider là carousel banner chính trên trang chủ, hiển thị các khuyến mãi và sản phẩm nổi bật.

## Cấu trúc File

### 1. HTML Template
**File**: `views/partials/hero-slider.ejs`

Slider bao gồm 3 slides:
- **Slide 1**: Laptop cao cấp (sử dụng ảnh thật)
- **Slide 2**: Linh kiện máy tính (gradient placeholder)
- **Slide 3**: Phụ kiện gaming (gradient placeholder)

### 2. CSS Styling
**File**: `public/css/style.css` (dòng 839-1193)

Các tính năng CSS:
- Fixed height: 600px (desktop), 450px (tablet), 400px (mobile)
- Fade transition giữa các slides
- Zoom effect nhẹ trên background
- Fade-in-up animation cho text
- Glassmorphism cho navigation buttons
- Responsive design cho mobile

### 3. JavaScript Logic
**File**: `public/js/hero-slider.js`

Chức năng:
- Auto-slide mỗi 5 giây
- Navigation buttons (prev/next)
- Pagination dots
- Click vào dot để chuyển slide

## Cách sử dụng

### Thêm slide mới

1. Mở `views/partials/hero-slider.ejs`
2. Thêm slide mới trong `.slider-wrapper`:

```html
<div class="slide">
    <div class="slide-bg" style="background-image: url('/path/to/image.jpg');"></div>
    <div class="slide-overlay"></div>
    <div class="slide-content">
        <span class="slide-subtitle" style="animation-delay: 0.2s">Subtitle</span>
        <h2 style="animation-delay: 0.4s">TIÊU ĐỀ CHÍNH</h2>
        <p style="animation-delay: 0.6s">Mô tả ngắn gọn</p>
        <a href="/link" class="btn btn-primary slide-btn" style="animation-delay: 0.8s">
            Call to Action <i class="fas fa-icon"></i>
        </a>
    </div>
</div>
```

### Thay đổi ảnh background

**Cách 1: Sử dụng ảnh**
```html
<div class="slide-bg" style="background-image: url('/uploads/banners/your-image.jpg');"></div>
```

**Cách 2: Sử dụng gradient**
```html
<div class="slide-bg" style="background: linear-gradient(135deg, #color1 0%, #color2 100%);"></div>
```

### Tùy chỉnh thời gian auto-slide

Mở `public/js/hero-slider.js`, tìm dòng:
```javascript
slideInterval = setInterval(nextSlide, 5000); // 5000ms = 5 giây
```

Thay đổi `5000` thành giá trị mong muốn (tính bằng milliseconds).

### Tùy chỉnh màu sắc

Trong `public/css/style.css`, các biến CSS:
```css
--primary-color: #0066cc;    /* Màu chính (buttons, dots) */
--accent-color: #ff4500;     /* Màu nhấn (subtitle) */
--warning-color: #ffc107;    /* Màu highlight */
```

## Responsive Breakpoints

- **Desktop**: > 768px - Full size với text lớn
- **Tablet**: 481px - 768px - Text size trung bình, centered
- **Mobile**: ≤ 480px - Text size nhỏ, compact layout

## Animation Details

### Fade In Up Animation
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

Các elements có animation delay:
- Subtitle: 0.2s
- Heading: 0.4s
- Paragraph: 0.6s
- Button: 0.8s

## Best Practices

### Ảnh Background
- **Kích thước khuyến nghị**: 1920x600px
- **Format**: JPG (cho photos), PNG (cho graphics)
- **Dung lượng**: < 500KB (optimize trước khi upload)
- **Tỷ lệ**: 16:5 hoặc 3:1

### Nội dung Text
- **Heading**: Tối đa 2 dòng, 6-8 từ mỗi dòng
- **Paragraph**: 1-2 câu ngắn gọn
- **CTA Button**: 2-4 từ, rõ ràng

### Accessibility
- Luôn có `alt` text cho ảnh
- Đảm bảo contrast ratio đủ cao (overlay giúp điều này)
- Buttons có thể điều hướng bằng keyboard

## Troubleshooting

### Slider không tự động chạy
- Kiểm tra console có lỗi JavaScript không
- Đảm bảo file `hero-slider.js` được load
- Verify class `active` có trên slide đầu tiên

### Text bị mờ/khó đọc
- Tăng độ đậm của `.slide-overlay`
- Thay đổi gradient trong overlay
- Sử dụng ảnh background tối hơn

### Layout bị vỡ trên mobile
- Kiểm tra responsive CSS
- Test trên nhiều kích thước màn hình
- Rút ngắn text nếu cần

## Future Enhancements

Các tính năng có thể thêm:
- [ ] Swipe gesture cho mobile
- [ ] Pause on hover
- [ ] Video background support
- [ ] Lazy loading cho ảnh
- [ ] Admin panel để quản lý slides
- [ ] A/B testing cho CTR

## Liên hệ

Nếu cần hỗ trợ, vui lòng tham khảo:
- CSS Variables: `public/css/style.css` (dòng 4-46)
- Main documentation: `README.md`
