import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useI18n } from '../i18n';

export interface SelectOption {
    label: string | React.ReactNode;
    value: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
    value,
    onChange,
    options,
    placeholder,
    className,
    disabled = false
}) => {
    const { t } = useI18n();
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const triggerId = useId();
    const listboxId = useId();

    const selectedOption = options.find((option) => option.value === value);
    const selectedIndex = options.findIndex((option) => option.value === value);
    const effectivePlaceholder = placeholder || t('select.placeholder');

    const getInitialHighlightIndex = () => {
        if (selectedIndex >= 0) return selectedIndex;
        return options.length > 0 ? 0 : -1;
    };

    const effectiveHighlightedIndex =
        highlightedIndex >= 0 && highlightedIndex < options.length ? highlightedIndex : getInitialHighlightIndex();
    const menuOpen = isOpen && !disabled;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!menuOpen || effectiveHighlightedIndex < 0) return;
        optionRefs.current[effectiveHighlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [effectiveHighlightedIndex, menuOpen]);

    const closeMenu = (focusTrigger = false) => {
        setIsOpen(false);
        setHighlightedIndex(-1);
        if (focusTrigger) {
            triggerRef.current?.focus();
        }
    };

    const openMenu = () => {
        if (disabled) return;
        setIsOpen(true);
        setHighlightedIndex(getInitialHighlightIndex());
    };

    const moveHighlight = (direction: 1 | -1) => {
        if (options.length === 0) return;
        setHighlightedIndex((current) => {
            if (current < 0) return direction === 1 ? 0 : options.length - 1;
            const next = current + direction;
            if (next < 0) return options.length - 1;
            if (next >= options.length) return 0;
            return next;
        });
    };

    const handleSelect = (nextValue: string) => {
        onChange(nextValue);
        closeMenu(true);
    };

    const selectHighlighted = () => {
        if (effectiveHighlightedIndex < 0 || effectiveHighlightedIndex >= options.length) return;
        handleSelect(options[effectiveHighlightedIndex].value);
    };

    const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                if (!menuOpen) {
                    openMenu();
                    return;
                }
                moveHighlight(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                if (!menuOpen) {
                    openMenu();
                    return;
                }
                moveHighlight(-1);
                break;
            case 'Home':
                if (!menuOpen) return;
                event.preventDefault();
                setHighlightedIndex(options.length > 0 ? 0 : -1);
                break;
            case 'End':
                if (!menuOpen) return;
                event.preventDefault();
                setHighlightedIndex(options.length > 0 ? options.length - 1 : -1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (!menuOpen) {
                    openMenu();
                    return;
                }
                selectHighlighted();
                break;
            case 'Escape':
                if (!menuOpen) return;
                event.preventDefault();
                closeMenu(true);
                break;
            default:
                break;
        }
    };

    const handleListboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveHighlight(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveHighlight(-1);
                break;
            case 'Home':
                event.preventDefault();
                setHighlightedIndex(options.length > 0 ? 0 : -1);
                break;
            case 'End':
                event.preventDefault();
                setHighlightedIndex(options.length > 0 ? options.length - 1 : -1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                selectHighlighted();
                break;
            case 'Escape':
                event.preventDefault();
                closeMenu(true);
                break;
            case 'Tab':
                closeMenu();
                break;
            default:
                break;
        }
    };

    return (
        <div className={cn('relative w-full', className)} ref={containerRef}>
            <button
                ref={triggerRef}
                id={triggerId}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                aria-controls={listboxId}
                disabled={disabled}
                className={cn(
                    'flex items-center justify-between w-full themed-input px-4 py-3 cursor-pointer select-none transition-all duration-300 text-left',
                    menuOpen ? 'border-brand ring-1 ring-brand/50' : '',
                    disabled ? 'opacity-30 cursor-not-allowed' : 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60'
                )}
                onClick={() => (menuOpen ? closeMenu() : openMenu())}
                onKeyDown={handleTriggerKeyDown}
            >
                <span className={cn('block truncate font-medium', !selectedOption && 'text-text-muted font-normal')}>
                    {selectedOption ? selectedOption.label : effectivePlaceholder}
                </span>
                <ChevronDown className={cn('w-5 h-5 text-text-muted transition-transform duration-300', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-labelledby={triggerId}
                    tabIndex={-1}
                    onKeyDown={handleListboxKeyDown}
                    className="absolute z-[100] w-full mt-2 bg-bg-panel border border-border-main rounded-[calc(var(--radius-base))] shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-300 max-h-60 overflow-auto custom-scrollbar"
                >
                    {options.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-text-muted text-center cursor-default">{t('select.noOptions')}</div>
                    ) : (
                        options.map((option, index) => (
                            <button
                                ref={(node) => {
                                    optionRefs.current[index] = node;
                                }}
                                type="button"
                                key={option.value}
                                role="option"
                                aria-selected={value === option.value}
                                tabIndex={effectiveHighlightedIndex === index ? 0 : -1}
                                className={cn(
                                    'flex w-[calc(100%-0.75rem)] mx-1.5 items-center justify-between px-4 py-2.5 rounded-[calc(var(--radius-base)*0.75)] cursor-pointer transition-colors text-sm text-left',
                                    value === option.value
                                        ? 'bg-brand/10 text-brand font-bold'
                                        : effectiveHighlightedIndex === index
                                            ? 'bg-bg-action text-text-main'
                                            : 'text-text-main hover:bg-bg-action'
                                )}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                onFocus={() => setHighlightedIndex(index)}
                                onClick={() => handleSelect(option.value)}
                            >
                                <span className="block truncate">{option.label}</span>
                                {value === option.value && <Check className="w-4 h-4 ml-2 shrink-0" />}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
