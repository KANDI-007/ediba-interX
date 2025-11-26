/**
 * Composant Logo EDIBA INTER
 * Utilise les logos réels de l'entreprise depuis src/image/imagelogo
 */

import React from 'react';

interface EdibaLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large' | number;
  variant?: 'default' | 'white' | 'colored';
  showText?: boolean;
}

const EdibaLogo: React.FC<EdibaLogoProps> = ({
  className = '',
  size = 'medium',
  variant = 'default',
  showText = false,
}) => {
  // Déterminer la taille
  const sizeValue = typeof size === 'number' 
    ? size 
    : size === 'small' 
      ? 40 
      : size === 'large' 
        ? 120 
        : 60;

  // Déterminer le logo à utiliser selon la variante
  const getLogoPath = () => {
    if (variant === 'white') {
      // Essayer plusieurs chemins possibles
      return './image/imagelogo/LOGO-EDIBA-INTER-blanc.png';
    }
    // Par défaut, utiliser le logo coloré principal
    // Essayer plusieurs chemins possibles pour compatibilité
    return './image/imagelogo/LOGO-EDIBA-INTER.jpg';
  };

  const logoPath = getLogoPath();

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <img
          src={logoPath}
          alt="EDIBA INTER SARL U"
          className="object-contain"
          style={{
            height: `${sizeValue}px`,
            width: 'auto',
            maxWidth: '100%',
          }}
          onError={(e) => {
            // Fallback si l'image ne charge pas
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            // Afficher un placeholder
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div style="
                  width: ${sizeValue}px;
                  height: ${sizeValue}px;
                  background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-weight: bold;
                  font-size: ${sizeValue * 0.3}px;
                ">EI</div>
              `;
            }
          }}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gray-800">EDIBA INTER</span>
          <span className="text-xs text-gray-600">SARL U</span>
        </div>
      )}
    </div>
  );
};

export default EdibaLogo;

