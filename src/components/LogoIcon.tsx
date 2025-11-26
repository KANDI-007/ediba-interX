import React from 'react';
import { Building2 } from 'lucide-react';

interface LogoIconProps {
  className?: string;
  size?: number;
  variant?: 'default' | 'gradient' | 'simple' | 'image';
}

const LogoIcon: React.FC<LogoIconProps> = ({ 
  className = '', 
  size = 24,
  variant = 'default'
}) => {
  const baseClasses = 'transition-all duration-300';
  
  // Utiliser le logo image de l'entreprise si demandé
  if (variant === 'image') {
    return (
      <div className={`relative ${baseClasses} ${className}`}>
        <img
          src="/src/image/imagelogo/LOGO-EDIBA-INTER.jpg"
          alt="EDIBA INTER"
          className="object-contain"
          style={{
            height: `${size}px`,
            width: 'auto',
          }}
          onError={(e) => {
            // Fallback vers l'icône si l'image ne charge pas
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>
    );
  }
  
  // Style par défaut avec gradient professionnel
  if (variant === 'default') {
    return (
      <div className={`relative ${baseClasses} ${className}`}>
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-green-600 rounded-xl p-2 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-green-500 rounded-xl opacity-75 blur-sm"></div>
          <Building2 
            className="relative z-10 text-white" 
            size={size}
            strokeWidth={2.5}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent rounded-xl"></div>
        </div>
      </div>
    );
  }
  
  // Style avec gradient
  if (variant === 'gradient') {
    return (
      <div className={`relative ${baseClasses} ${className}`}>
        <div className="relative bg-white rounded-lg p-1.5 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg"></div>
          <Building2 
            className="relative z-10 text-blue-600" 
            size={size}
            strokeWidth={2.5}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 via-blue-600/20 to-transparent rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // Style simple et élégant
  return (
    <Building2 
      className={`${baseClasses} text-blue-600 ${className}`}
      size={size}
      strokeWidth={2.5}
    />
  );
};

export default LogoIcon;

