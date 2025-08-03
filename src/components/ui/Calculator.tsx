// src/components/ui/Calculator.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Calculator as CalculatorIcon, X, Minus, Plus } from "lucide-react";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'floating' | 'inline';
  className?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ 
  isOpen, 
  onClose, 
  position = 'floating',
  className = ""
}) => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewOperand, setWaitingForNewOperand] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!isOpen) return;

      const { key } = event;
      
      if (key >= '0' && key <= '9') {
        inputNumber(key);
      } else if (key === '.') {
        inputDecimal();
      } else if (['+', '-', '*', '/'].includes(key)) {
        performOperation(key);
      } else if (key === 'Enter' || key === '=') {
        performOperation('=');
      } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clear();
      } else if (key === 'Backspace') {
        backspace();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, display, previousValue, operation, waitingForNewOperand]);

  const inputNumber = (num: string) => {
    if (waitingForNewOperand) {
      setDisplay(num);
      setWaitingForNewOperand(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewOperand) {
      setDisplay("0.");
      setWaitingForNewOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewOperand(false);
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let result: number;

      switch (operation) {
        case '+':
          result = currentValue + inputValue;
          break;
        case '-':
          result = currentValue - inputValue;
          break;
        case '*':
          result = currentValue * inputValue;
          break;
        case '/':
          result = inputValue !== 0 ? currentValue / inputValue : 0;
          break;
        default:
          return;
      }

      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForNewOperand(true);
    setOperation(nextOperation === '=' ? null : nextOperation);
  };

  if (!isOpen) return null;

  const buttonClass = "h-12 text-sm font-medium transition-colors hover:bg-gray-100 active:bg-gray-200";
  const operatorClass = "h-12 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800";
  const equalsClass = "h-12 text-sm font-medium bg-green-600 text-white hover:bg-green-700 active:bg-green-800";

  const calculatorContent = (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-64">
      {/* Calculator Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalculatorIcon className="h-4 w-4 mr-2 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Calculator</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Display */}
      <div className="bg-gray-50 border rounded p-3 mb-4">
        <div className="text-right text-lg font-mono text-gray-900 truncate">
          {display}
        </div>
      </div>

      {/* Calculator Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <Button variant="outline" className={buttonClass} onClick={clear}>
          C
        </Button>
        <Button variant="outline" className={buttonClass} onClick={backspace}>
          ⌫
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => performOperation('/')}>
          ÷
        </Button>
        <Button className={operatorClass} onClick={() => performOperation('*')}>
          ×
        </Button>

        {/* Row 2 */}
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('7')}>
          7
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('8')}>
          8
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('9')}>
          9
        </Button>
        <Button className={operatorClass} onClick={() => performOperation('-')}>
          −
        </Button>

        {/* Row 3 */}
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('4')}>
          4
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('5')}>
          5
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('6')}>
          6
        </Button>
        <Button className={operatorClass} onClick={() => performOperation('+')}>
          +
        </Button>

        {/* Row 4 */}
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('1')}>
          1
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('2')}>
          2
        </Button>
        <Button variant="outline" className={buttonClass} onClick={() => inputNumber('3')}>
          3
        </Button>
        <Button 
          className={equalsClass} 
          onClick={() => performOperation('=')} 
          style={{ gridRow: 'span 2' }}
        >
          =
        </Button>

        {/* Row 5 */}
        <Button 
          variant="outline" 
          className={buttonClass} 
          onClick={() => inputNumber('0')}
          style={{ gridColumn: 'span 2' }}
        >
          0
        </Button>
        <Button variant="outline" className={buttonClass} onClick={inputDecimal}>
          .
        </Button>
      </div>

      {/* Keyboard shortcuts info */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        Use keyboard: 0-9, +, -, *, /, Enter, Esc
      </div>
    </div>
  );

  if (position === 'floating') {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        {calculatorContent}
      </div>
    );
  }

  return (
    <div className={className}>
      {calculatorContent}
    </div>
  );
};

// Calculator Toggle Button Component
interface CalculatorToggleProps {
  onClick: () => void;
  className?: string;
}

export const CalculatorToggle: React.FC<CalculatorToggleProps> = ({ onClick, className = "" }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="sm"
      className={`flex items-center gap-2 ${className}`}
      title="Open Calculator (Ctrl+Shift+C)"
    >
      <CalculatorIcon className="h-4 w-4" />
      <span className="hidden sm:inline">Calculator</span>
    </Button>
  );
};
