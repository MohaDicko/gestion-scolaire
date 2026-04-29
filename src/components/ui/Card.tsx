'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline' | 'flat';
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    
    const variantClass = {
      default: 'card',
      glass:   'glass-card',
      outline: 'card-outline', // I'll assume this mapping or just use card
      flat:    'card-flat',
    };

    const finalClassName = `${variantClass[variant] || 'card'} ${noPadding ? 'p-0' : ''} ${className || ''}`.trim();

    return (
      <div
        ref={ref}
        className={finalClassName}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ children, className, ...props }: any) => (
  <div className={`card-header ${className || ''}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: any) => (
  <h3 className={`card-title ${className || ''}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }: any) => (
  <p className={`text-muted ${className || ''}`} style={{ fontSize: '12px' }} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: any) => (
  <div className={className} {...props}>
    {children}
  </div>
);
