import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface ProductNameMultiSelectProps {
  selectedProductNames: string[];
  onChange: (names: string[]) => void;
}

const ProductNameMultiSelect: React.FC<ProductNameMultiSelectProps> = ({ 
  selectedProductNames, 
  onChange 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Update input value when selectedProductNames changes from outside
  // Only update if the input isn't currently focused to avoid overriding user input
  useEffect(() => {
    if (!isFocused) {
      setInputValue(selectedProductNames.join('; '));
    }
  }, [selectedProductNames, isFocused]);
  
  // Process the input and convert it to array only on blur or when Enter is pressed
  const processInput = (value: string) => {
    // Split by semicolons (not commas) and trim whitespace
    const productNames = value
      .split(';')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Only update if we have valid product names or the input is empty
    if (productNames.length > 0 || value.trim() === '') {
      onChange(productNames);
    }
  };
  
  // Handle input change - just update the local state, don't process yet
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };
  
  // Handle key press to add a new item on Enter
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processInput(inputValue);
      // Add semicolon to separate entries if there isn't one already
      if (!inputValue.endsWith('; ') && !inputValue.endsWith(';')) {
        setInputValue(prev => prev + (prev.trim() !== '' ? '; ' : ''));
      }
    }
  };
  
  // Handle blur event to process the input
  const handleBlur = () => {
    setIsFocused(false);
    processInput(inputValue);
  };
  
  // Handle focus event
  const handleFocus = () => {
    setIsFocused(true);
  };
  
  // Remove a product name
  const handleRemove = (indexToRemove: number) => {
    const newNames = selectedProductNames.filter((_, i) => i !== indexToRemove);
    onChange(newNames);
  };
  
  // Add a product name via button click
  const handleAddProductName = () => {
    if (inputValue.trim()) {
      processInput(inputValue);
      // Add semicolon for the next entry
      setInputValue(prev => prev.endsWith('; ') ? prev : prev + '; ');
    }
  };
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">
        Product Names
        {selectedProductNames.length > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {selectedProductNames.length} entered
          </span>
        )}
      </h4>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter product names (semicolon separated)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className="flex-1"
          />
        </div>
        
        <div className="text-xs text-muted-foreground">
          Enter product names and press Enter or add semicolon (;) to separate multiple names. 
          You can use commas within each product name.
        </div>
        
        {selectedProductNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedProductNames.map((name, index) => (
              <div 
                key={index} 
                className="bg-green-50 text-green-800 px-2 py-1 rounded-md text-xs flex items-center"
              >
                {name}
                <button
                  className="ml-1 text-green-600 hover:text-green-800"
                  onClick={() => handleRemove(index)}
                  type="button"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductNameMultiSelect;
