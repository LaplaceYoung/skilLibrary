import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
            fill="none"
            className={className}
        >
            <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-brand)" />
                    <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Background Plate */}
            <rect width="256" height="256" rx="64" fill="currentColor" fillOpacity="0.03" />

            {/* Geometric Foundation */}
            <path
                d="M128 32 L224 128 L128 224 L32 128 Z"
                stroke="url(#logo-grad)"
                strokeWidth="2"
                strokeOpacity="0.2"
            />

            {/* Inner Core Symbol */}
            <g filter="url(#logo-glow)">
                {/* Vertical Diamond */}
                <path
                    d="M128 64 C128 100 100 128 64 128 C100 128 128 156 128 192 C128 156 156 128 192 128 C156 128 128 100 128 64Z"
                    fill="url(#logo-grad)"
                />

                {/* Central Focus */}
                <circle cx="128" cy="128" r="12" fill="white" fillOpacity="0.9" />
                <circle cx="128" cy="128" r="6" fill="#1e1e2e" />
            </g>

            {/* Orbital Dots */}
            <circle cx="128" cy="32" r="4" fill="url(#logo-grad)" />
            <circle cx="224" cy="128" r="4" fill="url(#logo-grad)" />
            <circle cx="128" cy="224" r="4" fill="url(#logo-grad)" />
            <circle cx="32" cy="128" r="4" fill="url(#logo-grad)" />

            {/* Connecting Lines */}
            <path
                d="M128 32V64 M224 128H192 M128 224V192 M32 128H64"
                stroke="url(#logo-grad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeOpacity="0.5"
            />
        </svg>
    );
};
