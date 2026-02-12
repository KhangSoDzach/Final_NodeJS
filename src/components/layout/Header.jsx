import React from 'react';
import PropTypes from 'prop-types';

// Configuration: Product Categories
const PRODUCT_CATEGORIES = [
    { id: 'laptop', label: 'Laptop', icon: 'fa-laptop' },
    { id: 'pc', label: 'PC', icon: 'fa-desktop' },
    { id: 'monitor', label: 'Màn hình', icon: 'fa-tv' },
    { id: 'component', label: 'Linh kiện', icon: 'fa-microchip' },
    { id: 'accessory', label: 'Phụ kiện', icon: 'fa-keyboard' },
];

// Configuration: Main Navigation Items
const MAIN_NAV_ITEMS = [
    { href: '/', label: 'Trang chủ', icon: 'fa-home' },
    {
        href: '/products',
        label: 'Sản phẩm',
        icon: 'fa-laptop',
        dropdown: PRODUCT_CATEGORIES.map(cat => ({
            href: `/products?category=${cat.id}`,
            label: cat.label
        }))
    },
    ...PRODUCT_CATEGORIES.slice(0, 4).map(cat => ({
        href: `/products?category=${cat.id}`,
        label: cat.label,
        icon: cat.icon
    }))
];

// Configuration: User Menu Items
const USER_MENU_ITEMS = [
    { href: '/user/profile', label: 'Thông tin tài khoản', icon: null },
    { href: '/user/orders', label: 'Đơn hàng của tôi', icon: null },
    { href: '/user/wishlist', label: 'Yêu thích', icon: 'fa-heart text-danger' },
    { href: '/user/addresses', label: 'Địa chỉ', icon: null },
    { href: '/user/loyalty-points', label: 'Điểm tích lũy', icon: null },
];

/**
 * Header Component
 * 
 * Main navigation header with search bar, cart, wishlist, and user dropdown.
 * Preserves semantic HTML structure and ARIA attributes from the original EJS template.
 * 
 * @component
 */
const Header = ({ user, cart, searchQuery = '', wishlist }) => {
    const cartItemCount = cart?.items?.length || 0;
    const wishlistCount = wishlist?.count || 0;

    return (
        <header>
            <div className="container">
                <div className="top-header">
                    <div className="logo">
                        <a href="/">
                            <h1>Source Computer</h1>
                        </a>
                    </div>

                    {/* Search Bar */}
                    <div className="search-bar">
                        <form action="/products" method="GET" id="search-form">
                            <input
                                type="text"
                                name="search"
                                id="search-input"
                                placeholder="Tìm kiếm sản phẩm..."
                                defaultValue={searchQuery}
                                autoComplete="off"
                            />
                            <button type="submit">
                                <i className="fas fa-search"></i>
                            </button>
                        </form>
                        <div
                            id="search-suggestions"
                            className="search-suggestions"
                            style={{ display: 'none' }}
                        ></div>
                    </div>

                    {/* User Actions */}
                    <div className="user-actions">
                        {/* Compare Button */}
                        <a href="/compare" className="compare-icon" title="So sánh sản phẩm">
                            <i className="fas fa-balance-scale"></i>
                            <span className="compare-count badge bg-primary" style={{ display: 'none' }}>
                                0
                            </span>
                        </a>

                        {/* Wishlist Button (only when logged in) */}
                        {user && (
                            <a href="/user/wishlist" className="wishlist-icon" title="Danh sách yêu thích">
                                <i className="fas fa-heart"></i>
                                <span
                                    className="wishlist-count badge bg-danger"
                                    style={{ display: wishlistCount > 0 ? 'inline' : 'none' }}
                                >
                                    {wishlistCount}
                                </span>
                            </a>
                        )}

                        {/* Cart */}
                        <a href="/cart" className="cart-icon">
                            <i className="fas fa-shopping-cart"></i>
                            {cartItemCount > 0 && (
                                <span className="cart-count">{cartItemCount}</span>
                            )}
                        </a>

                        {/* User Dropdown or Auth Links */}
                        {user ? (
                            <div className="dropdown">
                                <a href="/user/profile" className="dropdown-toggle">
                                    <i className="fas fa-user"></i> {user.name}
                                </a>
                                <div className="dropdown-content">
                                    {USER_MENU_ITEMS.map((item, index) => (
                                        <a key={index} href={item.href}>
                                            {item.icon && <i className={`fas ${item.icon}`}></i>} {item.label}
                                        </a>
                                    ))}
                                    {user.role === 'admin' && (
                                        <a href="/admin">Quản trị</a>
                                    )}
                                    <a href="/auth/logout">Đăng xuất</a>
                                </div>
                            </div>
                        ) : (
                            <>
                                <a href="/auth/login">
                                    <i className="fas fa-sign-in-alt"></i> Đăng nhập
                                </a>
                                <a href="/auth/register">
                                    <i className="fas fa-user-plus"></i> Đăng ký
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="main-nav">
                <div className="container">
                    <ul className="nav-list">
                        {MAIN_NAV_ITEMS.map((item, index) => (
                            <li key={index} className={item.dropdown ? 'dropdown' : ''}>
                                <a href={item.href}>
                                    <i className={`fas ${item.icon}`}></i> {item.label}
                                    {item.dropdown && <i className="fas fa-angle-down"></i>}
                                </a>
                                {item.dropdown && (
                                    <div className="dropdown-content">
                                        {item.dropdown.map((subItem, subIndex) => (
                                            <a key={subIndex} href={subItem.href}>
                                                {subItem.label}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>
        </header>
    );
};

Header.propTypes = {
    /** User object containing name, email, and role */
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        role: PropTypes.oneOf(['admin', 'user']).isRequired,
    }),
    /** Shopping cart with items array */
    cart: PropTypes.shape({
        items: PropTypes.array,
    }),
    /** Current search query string */
    searchQuery: PropTypes.string,
    /** Wishlist with count */
    wishlist: PropTypes.shape({
        count: PropTypes.number,
    }),
};

export default Header;
