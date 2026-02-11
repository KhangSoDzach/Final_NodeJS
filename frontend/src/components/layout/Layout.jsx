import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

const Layout = () => {
    return (
        <div className="app-container flex flex-col min-h-screen">
            <Header />
            <main className="main-content flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
