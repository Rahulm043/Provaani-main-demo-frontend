import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ label = 'Back', to, onClick, className = '', style = {} }) {
    const navigate = useNavigate();

    const handleClick = (e) => {
        if (onClick) {
            onClick(e);
            return;
        }
        to ? navigate(to) : navigate(-1);
    };

    return (
        <button 
            className={`btn-secondary ${className}`} 
            style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem', height: 'auto', fontSize: '0.8rem', ...style }}
            onClick={handleClick}
        >
            <ChevronLeft size={14} style={{ marginRight: '4px' }} /> {label}
        </button>
    );
}
