import React from 'react';
import PropTypes from 'prop-types';

// Configuration: Profile Navigation Items
const PROFILE_NAV_ITEMS = [
    {
        id: 'profile',
        href: '/user/profile',
        icon: 'fa-user',
        label: 'Thông tin tài khoản',
    },
    {
        id: 'orders',
        href: '/user/orders',
        icon: 'fa-shopping-bag',
        label: 'Lịch sử đơn hàng',
    },
    {
        id: 'addresses',
        href: '/user/addresses',
        icon: 'fa-map-marker-alt',
        label: 'Địa chỉ',
    },
    {
        id: 'loyalty',
        href: '/user/loyalty-points',
        icon: 'fa-award',
        label: 'Điểm tích lũy',
    },
    {
        id: 'pre-orders',
        href: '/user/pre-orders',
        icon: 'fa-calendar-check',
        label: 'Đơn đặt trước',
    },
    {
        id: 'notifications',
        href: '/user/stock-notifications',
        icon: 'fa-bell',
        label: 'Thông báo hàng về',
    },
    {
        id: 'password',
        href: '/user/change-password',
        icon: 'fa-key',
        label: 'Đổi mật khẩu',
    },
];

/**
 * UserSidebar Component
 * 
 * User profile sidebar navigation with account info and menu.
 * Displays user information, loyalty points, and navigation menu with active state.
 * 
 * Note: Styling is NOT included in this component. CSS should be maintained separately.
 * 
 * @component
 */
const UserSidebar = ({ user, activePage }) => {
    const loyaltyPoints = user?.loyaltyPoints || 0;

    return (
        <div className="profile-sidebar">
            {/* User Information */}
            <div className="user-info">
                <div className="user-avatar">
                    <i className="fas fa-user-circle"></i>
                </div>
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <p className="loyalty-points">
                    <i className="fas fa-award"></i> Điểm tích lũy: <strong>{loyaltyPoints}</strong>
                </p>
            </div>

            {/* Profile Navigation */}
            <nav className="profile-nav">
                <ul>
                    {PROFILE_NAV_ITEMS.map((item) => (
                        <li
                            key={item.id}
                            className={activePage === item.id ? 'active' : ''}
                        >
                            <a href={item.href}>
                                <i className={`fas ${item.icon}`}></i> {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

UserSidebar.propTypes = {
    /** User object with name, email, and optional loyalty points */
    user: PropTypes.shape({
        name: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        loyaltyPoints: PropTypes.number,
    }).isRequired,
    /** Active page identifier for highlighting navigation item */
    activePage: PropTypes.oneOf([
        'profile',
        'orders',
        'addresses',
        'loyalty',
        'pre-orders',
        'notifications',
        'password',
    ]),
};

export default UserSidebar;
