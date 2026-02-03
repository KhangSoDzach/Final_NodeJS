import React from 'react';
import PropTypes from 'prop-types';

// Configuration: Contact Information
const CONTACT_INFO = {
    companyName: 'Source Computer',
    description: 'Website thương mại điện tử chuyên cung cấp các sản phẩm máy tính và linh kiện chính hãng.',
    address: '19 Nguyễn Hữu Thọ, Tân Phong, Quận 7, Hồ Chí Minh',
    phone: '0912 xxx xxx',
    email: '522H0003@student.tdtu.edu.vn',
};

// Configuration: Product Categories for Footer
const FOOTER_CATEGORIES = [
    { href: '/products?category=laptop', label: 'Laptop' },
    { href: '/products?category=pc', label: 'PC' },
    { href: '/products?category=monitor', label: 'Màn hình' },
    { href: '/products?category=component', label: 'Linh kiện' },
    { href: '/products?category=accessory', label: 'Phụ kiện' },
];

// Configuration: Information Links
const INFO_LINKS = [
    { href: '/about', label: 'Giới thiệu' },
    { href: '/shipping-policy', label: 'Chính sách vận chuyển' },
    { href: '/return-policy', label: 'Chính sách đổi trả' },
    { href: '/warranty-policy', label: 'Chính sách bảo hành' },
    { href: '/privacy-policy', label: 'Chính sách bảo mật' },
    { href: '/contact', label: 'Liên hệ' },
];

// Configuration: Account Links (authenticated users)
const ACCOUNT_LINKS_AUTHENTICATED = [
    { href: '/user/profile', label: 'Thông tin tài khoản' },
    { href: '/user/orders', label: 'Đơn hàng của tôi' },
    { href: '/user/addresses', label: 'Địa chỉ' },
    { href: '/user/loyalty-points', label: 'Điểm tích lũy' },
    { href: '/auth/logout', label: 'Đăng xuất' },
];

// Configuration: Account Links (guest users)
const ACCOUNT_LINKS_GUEST = [
    { href: '/auth/login', label: 'Đăng nhập' },
    { href: '/auth/register', label: 'Đăng ký' },
];

/**
 * Footer Component
 * 
 * Site footer with company info, category links, information pages, and account links.
 * Displays different account links based on user authentication status.
 * 
 * @component
 */
const Footer = ({ user }) => {
    const currentYear = new Date().getFullYear();
    const accountLinks = user ? ACCOUNT_LINKS_AUTHENTICATED : ACCOUNT_LINKS_GUEST;

    return (
        <footer>
            <div className="container">
                <div className="footer-content">
                    {/* Company Information */}
                    <div className="footer-section">
                        <h3>{CONTACT_INFO.companyName}</h3>
                        <p>{CONTACT_INFO.description}</p>
                        <div className="contact-info">
                            <p>
                                <i className="fas fa-map-marker-alt"></i> {CONTACT_INFO.address}
                            </p>
                            <p>
                                <i className="fas fa-phone"></i> {CONTACT_INFO.phone}
                            </p>
                            <p>
                                <i className="fas fa-envelope"></i> {CONTACT_INFO.email}
                            </p>
                        </div>
                    </div>

                    {/* Product Categories */}
                    <div className="footer-section">
                        <h3>Danh mục</h3>
                        <ul>
                            {FOOTER_CATEGORIES.map((category, index) => (
                                <li key={index}>
                                    <a href={category.href}>{category.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Information Links */}
                    <div className="footer-section">
                        <h3>Thông tin</h3>
                        <ul>
                            {INFO_LINKS.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account Links */}
                    <div className="footer-section">
                        <h3>Tài khoản</h3>
                        <ul>
                            {accountLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link.href}>{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p>&copy; {currentYear} {CONTACT_INFO.companyName}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

Footer.propTypes = {
    /** User object (optional) - determines which account links to display */
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
    }),
};

export default Footer;
