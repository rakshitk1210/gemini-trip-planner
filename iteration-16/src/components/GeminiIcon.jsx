import React from 'react';

export default function GeminiIcon({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M14 1C14 1 14.15 13.85 1 14C14.15 14.15 14 27 14 27C14 27 13.85 14.15 27 14C13.85 13.85 14 1 14 1Z" fill="url(#gemGrad)"/>
      <defs>
        <linearGradient id="gemGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4285F4"/>
          <stop offset="40%"  stopColor="#9C27B0"/>
          <stop offset="75%"  stopColor="#EA4335"/>
          <stop offset="100%" stopColor="#FBBC04"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
