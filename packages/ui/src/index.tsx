import React from 'react';
import { cn } from './lib/utils';

// 스도쿠 그리드 컴포넌트
interface SudokuGridProps {
  grid: number[];
  onChange?: (index: number, value: number) => void;
  readonly?: boolean;
  highlightedCells?: number[];
  className?: string;
}

export const SudokuGrid: React.FC<SudokuGridProps> = ({
  grid,
  onChange,
  readonly = false,
  highlightedCells = [],
  className,
}) => {
  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (readonly) return;
    
    const value = e.target.value;
    if (value === '' || (value >= '1' && value <= '9')) {
      onChange?.(index, value === '' ? 0 : parseInt(value, 10));
    }
  };

  return (
    <div className={cn('grid grid-cols-9 gap-0 border-2 border-gray-800', className)}>
      {grid.map((cell, idx) => {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        const isHighlighted = highlightedCells.includes(idx);
        
        return (
          <input
            key={idx}
            type="text"
            inputMode="numeric"
            pattern="[1-9]"
            value={cell === 0 ? '' : cell.toString()}
            onChange={(e) => handleChange(idx, e)}
            readOnly={readonly}
            className={cn(
              'w-10 h-10 text-center text-lg font-semibold',
              'focus:outline-none focus:bg-blue-100',
              {
                'bg-gray-100': !isHighlighted && readonly && cell !== 0,
                'bg-white': !isHighlighted && (!readonly || cell === 0),
                'bg-yellow-100': isHighlighted,
                'border-r-2 border-gray-800': col % 3 === 2 && col !== 8,
                'border-b-2 border-gray-800': row % 3 === 2 && row !== 8,
                'border-r border-gray-300': col % 3 !== 2,
                'border-b border-gray-300': row % 3 !== 2,
              }
            )}
          />
        );
      })}
    </div>
  );
};

// 스도쿠 컨트롤 버튼
interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/90': variant === 'secondary',
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground': variant === 'outline',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'danger',
          'h-8 px-3 text-xs': size === 'sm',
          'h-10 px-4 py-2': size === 'md',
          'h-11 px-8': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      {children}
    </button>
  );
};

// 스도쿠 난이도 선택 컴포넌트
interface DifficultySelectProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const DifficultySelect: React.FC<DifficultySelectProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 py-2',
        'text-sm focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      <option value={1}>쉬움</option>
      <option value={2}>중간</option>
      <option value={3}>어려움</option>
    </select>
  );
};

// 증명 컨테이너 컴포넌트
interface ProofContainerProps {
  proof: string;
  onCopy?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const ProofContainer: React.FC<ProofContainerProps> = ({
  proof,
  onCopy,
  onDownload,
  className,
}) => {
  return (
    <div className={cn('rounded-md border border-gray-300 overflow-hidden', className)}>
      <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h3 className="text-sm font-medium">증명 데이터</h3>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={onCopy}>
            복사
          </Button>
          <Button variant="outline" size="sm" onClick={onDownload}>
            다운로드
          </Button>
        </div>
      </div>
      <textarea
        readOnly
        value={proof}
        className="w-full h-32 p-3 text-sm font-mono resize-none focus:outline-none"
      />
    </div>
  );
};

// 결과 메시지 컴포넌트
interface ResultMessageProps {
  success?: boolean;
  message: string;
  className?: string;
}

export const ResultMessage: React.FC<ResultMessageProps> = ({
  success,
  message,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-4 rounded-md',
        {
          'bg-green-100 text-green-800': success === true,
          'bg-red-100 text-red-800': success === false,
          'bg-gray-100 text-gray-800': success === undefined,
        },
        className
      )}
    >
      {message}
    </div>
  );
};

// 숫자 입력 패드 컴포넌트 (모바일 용)
interface NumberPadProps {
  onNumberClick: (num: number) => void;
  onClearClick: () => void;
  className?: string;
}

export const NumberPad: React.FC<NumberPadProps> = ({
  onNumberClick,
  onClearClick,
  className,
}) => {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          onClick={() => onNumberClick(num)}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-200 text-xl font-bold"
        >
          {num}
        </button>
      ))}
      <button
        onClick={onClearClick}
        className="w-12 h-12 col-span-3 flex items-center justify-center rounded-full bg-red-200 text-xl font-bold"
      >
        Clear
      </button>
    </div>
  );
};

// 타이머 컴포넌트
interface TimerProps {
  seconds: number;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ seconds, className }) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return (
    <div className={cn('font-mono text-lg', className)}>
      {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
    </div>
  );
};

// 모달 컴포넌트
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div
        className={cn(
          'bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto',
          className
        )}
      >
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// 유틸리티 함수를 내보냅니다
export * from './lib/utils';
