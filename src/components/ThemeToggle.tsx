import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';

interface ThemeToggleProps {
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false }) => {
  const { theme, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const options: { mode: ThemeMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'system', label: 'System', icon: Laptop },
  ];

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef} id="theme-toggle-container">
      {/* Primary Quick-Toggle Button */}
      <button
        id="theme-toggle-btn"
        type="button"
        onClick={toggleTheme}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-2xs transition-all focus:outline-hidden focus:ring-2 focus:ring-sky-500/20"
        title={`Current: ${themeMode} (${theme} mode). Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode.`}
        aria-label={`Toggle theme. Current theme: ${themeMode}`}
      >
        {theme === 'dark' ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-600 transition-transform hover:-rotate-12" />
        )}
        
        {showLabel && (
          <span className="text-xs font-semibold capitalize hidden sm:inline">
            {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>

      {/* Mini Options Dropdown Trigger */}
      <button
        id="theme-menu-trigger-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="ml-0.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-hidden"
        title="Select theme preference"
        aria-label="Select theme options menu"
        aria-expanded={isOpen}
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Theme selection dropdown menu */}
      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150"
          role="menu"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
            Appearance
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = themeMode === opt.mode;
            return (
              <button
                key={opt.mode}
                id={`theme-opt-${opt.mode}`}
                type="button"
                role="menuitem"
                onClick={() => {
                  setThemeMode(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left font-medium transition-colors ${
                  isSelected
                    ? 'bg-sky-50 text-sky-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
