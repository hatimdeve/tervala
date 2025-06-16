import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button: React.FC<ButtonProps> = ({ className, children, ...props }) => {
  return (
    <button
      className={cn(
        'bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors duration-200',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
