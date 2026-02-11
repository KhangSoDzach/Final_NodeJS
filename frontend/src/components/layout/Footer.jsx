import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-secondary text-white mt-auto">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Source Computer</h3>
                        <p className="text-sm text-gray-300 mb-2">
                            Chuyên cung cấp linh kiện máy tính, laptop và phụ kiện chính hãng
                        </p>
                        <p className="text-sm text-gray-300">
                            Hotline: 1900-xxxx
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Liên kết</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                                    Trang chủ
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-gray-300 hover:text-white transition-colors">
                                    Sản phẩm
                                </Link>
                            </li>
                            <li>
                                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                                    Liên hệ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Hỗ trợ</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Chính sách bảo hành
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Chính sách đổi trả
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                                    Hướng dẫn mua hàng
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-300">
                    <p>&copy; {new Date().getFullYear()} Source Computer. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
