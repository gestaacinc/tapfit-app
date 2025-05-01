// src/components/Footer.jsx
import React from 'react';
import './Footer.css'; // We'll create this CSS file next

function Footer() {
    const currentYear = new Date().getFullYear(); // Get current year dynamically

    return (
        <footer className="app-footer">
            {/* Use the text you provided, maybe add the dynamic year */}
            DMMMSU (BSTFT) {currentYear}
            {/* Or exactly as you typed: DMMMSU BSFT 2025 */}
        </footer>
    );
}

export default Footer;