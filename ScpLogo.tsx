import React from 'react';

interface ScpLogoProps {
  className?: string;
  size?: number;
}

export const ScpLogo: React.FC<ScpLogoProps> = ({ className = '', size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Medallón circular azul marino institucional (#14284B) y aro dorado puente (#C59B3B) */}
      <circle cx="32" cy="32" r="30" fill="#14284B" stroke="#C59B3B" strokeWidth="2.4" />
      <circle cx="32" cy="32" r="25.5" stroke="#C59B3B" strokeWidth="0.9" strokeOpacity="0.6" />

      {/* Tablero y arco del puente dorado */}
      <path d="M12 34H52" stroke="#D7B45F" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M14 34C18.5 22 25 18 32 18C39 18 45.5 22 50 34"
        stroke="#C59B3B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M22 23.5V34M32 18V34M42 23.5V34" stroke="#D7B45F" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 34V41M32 34V41M47 34V41" stroke="#C59B3B" strokeWidth="2" strokeLinecap="round" />

      {/* Ondas serenas bajo el puente */}
      <path
        d="M13 43.5C17 41.5 21 45.5 25 43.5C29 41.5 33 45.5 37 43.5C41 41.5 45 45.5 51 43.5"
        stroke="#C59B3B"
        strokeWidth="1.7"
        strokeOpacity="0.85"
        strokeLinecap="round"
      />
      <path
        d="M18 48.5C22 47 25.5 50 29.5 48.5C33.5 47 37.5 50 41.5 48.5C44 47.6 46.5 48 48 48.8"
        stroke="#2E5A44"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
};
