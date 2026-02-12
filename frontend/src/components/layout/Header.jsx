import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

const Header = () => {
    const { user } = useAuth();

    return (
        <header className="bg-white shadow-md sticky top-0 z-sticky">
            <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">SC</span>
                        </div>
                        <span className="font-bold text-xl text-secondary">Source Computer</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/" className="text-secondary hover:text-primary transition-colors">
                            Trang chủ
                        </Link>
                        <Link to="/products" className="text-secondary hover:text-primary transition-colors">
                            Sản phẩm
                        </Link>
                    </div>

                    {/* Right side - Search, Cart, User */}
                    <div className="flex items-center gap-4">
                        {/* Search Bar (Simplified) */}
                        <div className="hidden lg:block">
                            <input
                                type="search"
                                placeholder="Tìm kiếm sản phẩm..."
                                className="w-64 px-4 py-2 border border-border-light rounded-lg focus:outline-none focus:border-primary"
                            />
                        </div>

                        {/* Cart Icon */}
                        <Link to="/cart" className="relative text-secondary hover:text-primary transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="absolute -top-2 -right-2 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                0
                            </span>
                        </Link>

                        {/* User Icon */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-secondary">{user.name}</span>
                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                        ) : (
                            <Link to="/auth/login" className="btn-base bg-primary text-white hover:bg-primary-dark">
                                Đăng nhập
                            </Link>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
