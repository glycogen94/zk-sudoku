'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface SudokuGridProps {
  grid: number[];
  onChange?: (index: number, value: number) => void;
  originalGrid?: number[];
  highlightedCells?: number[];
  className?: string;
  readOnly?: boolean;
}

const SudokuGrid: React.FC<SudokuGridProps> = ({
  grid,
  onChange,
  originalGrid,
  highlightedCells = [],
  className,
  readOnly = false,
}) => {
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const handleCellChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly) return;
    if (originalGrid && originalGrid[index] !== 0) return;

    const value = e.target.value;
    if (value === '' || (value >= '1' && value <= '9')) {
      onChange?.(index, value === '' ? 0 : parseInt(value));
    }
  };

  const handleCellClick = (index: number) => {
    if (!readOnly && (!originalGrid || originalGrid[index] === 0)) {
      setSelectedCell(index);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (readOnly) return;
    if (originalGrid && originalGrid[index] !== 0) return;

    if (e.key >= '1' && e.key <= '9') {
      onChange?.(index, parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      onChange?.(index, 0);
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const row = Math.floor(index / 9);
      const col = index % 9;
      
      let newRow = row;
      let newCol = col;
      
      if (e.key === 'ArrowUp') newRow = Math.max(0, row - 1);
      if (e.key === 'ArrowDown') newRow = Math.min(8, row + 1);
      if (e.key === 'ArrowLeft') newCol = Math.max(0, col - 1);
      if (e.key === 'ArrowRight') newCol = Math.min(8, col + 1);
      
      const newIndex = newRow * 9 + newCol;
      setSelectedCell(newIndex);
      
      // Focus the new cell
      const newCell = document.querySelector(`[data-index="${newIndex}"]`) as HTMLInputElement;
      if (newCell) newCell.focus();
    }
  };

  return (
    <div
      className={cn(
        'grid grid-cols-9 gap-0 border-2 border-gray-800 mx-auto',
        'max-w-[540px] aspect-square',
        className
      )}
    >
      {grid.map((cell, idx) => {
        const row = Math.floor(idx / 9);
        const col = idx % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);
        const isHighlighted = highlightedCells.includes(idx);
        const isOriginal = originalGrid ? originalGrid[idx] !== 0 : false;
        const isSelected = selectedCell === idx;
        
        return (
          <input
            key={idx}
            data-index={idx}
            type="text"
            inputMode="numeric"
            pattern="[1-9]"
            value={cell === 0 ? '' : cell.toString()}
            onChange={(e) => handleCellChange(idx, e)}
            onClick={() => handleCellClick(idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            readOnly={readOnly || isOriginal}
            className={cn(
              'w-full h-full text-center text-lg sm:text-xl font-semibold',
              'focus:outline-none',
              {
                'bg-gray-100 text-gray-900 font-bold': isOriginal,
                'bg-white': !isOriginal && !isHighlighted && !isSelected,
                'bg-blue-100': isSelected && !isHighlighted,
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

export default SudokuGrid;
