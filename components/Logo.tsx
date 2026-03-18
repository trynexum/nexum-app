import React from "react";

export default function Logo({ style, className }: { style?: React.CSSProperties; className?: string }) {
    return (
        <svg
            className={className}
            style={style}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M 12 40 L 12 26 A 14 14 0 0 1 26 12 L 40 12 L 88 60 L 88 74 A 14 14 0 0 1 74 88 L 60 88 Z" fill="currentColor" />
            <rect x="12" y="56" width="28" height="32" rx="14" fill="currentColor" />
            <rect x="60" y="12" width="28" height="32" rx="14" fill="currentColor" />
        </svg>
    );
}
