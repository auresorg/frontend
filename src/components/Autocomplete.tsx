import React, { useState, useEffect, useRef } from "react"
import { Input, type InputProps } from "@/components/Input"
import { cx, getWithToken } from "@/lib/utils"

export interface AutocompleteSuggestionItem {
    value: string;
  payload?: Record<string, unknown>;
}

export type AutocompleteSuggestion = string | AutocompleteSuggestionItem;

interface AutocompleteProps extends InputProps {
  typeQuery: string;
  onValueChange?: (value: string, payload?: Record<string, unknown>) => void;
}

const Autocomplete = React.forwardRef<HTMLInputElement, AutocompleteProps>(
  ({ typeQuery, onValueChange, onChange, value, className, hasError, ...props }, ref) => {
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value as string || "")
    const [focusedIndex, setFocusedIndex] = useState(-1)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    useEffect(() => {
        setInputValue(value as string || "")
    }, [value])

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
      if (isOpen && focusedIndex >= 0 && listRef.current) {
        const item = listRef.current.children[focusedIndex] as HTMLElement
        if (item) {
          item.scrollIntoView({ block: "nearest" })
        }
      }
    }, [focusedIndex, isOpen])

    const fetchSuggestions = async (q: string) => {
      if (!q.trim()) {
        setSuggestions([])
        setIsOpen(false)
        setFocusedIndex(-1)
        return
      }
      try {
        const res = await getWithToken(`/autocomplete?type=${typeQuery}&q=${encodeURIComponent(q)}`)
        if (res?.status === 200 && Array.isArray(res.data)) {
          setSuggestions(res.data)
          setIsOpen(res.data.length > 0)
          setFocusedIndex(-1)
        } else {
            setSuggestions([])
            setIsOpen(false)
            setFocusedIndex(-1)
        }
      } catch (err) {
        console.error("Failed to fetch suggestions", err)
      }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      if (onChange) onChange(e)
      if (onValueChange) onValueChange(val)

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(val)
      }, 300)
    }

    const handleSelect = (suggestion: AutocompleteSuggestion) => {
      const isObj = typeof suggestion === 'object' && suggestion !== null;
      const val = isObj ? suggestion.value : suggestion;
      const payload = isObj ? suggestion.payload : undefined;

      setInputValue(val)
      if (onValueChange) onValueChange(val, payload)
      
      if (onChange) {
         const event = {
             target: { value: val }
         } as React.ChangeEvent<HTMLInputElement>
         onChange(event)
      }

      setIsOpen(false)
      setFocusedIndex(-1)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        setFocusedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev))
      } else if (e.key === "Enter") {
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          e.preventDefault()
          handleSelect(suggestions[focusedIndex])
        }
      } else if (e.key === "Escape") {
        setIsOpen(false)
        setFocusedIndex(-1)
      }
    }

    return (
      <div className={cx("relative w-full", className)} ref={wrapperRef}>
        <Input
          ref={ref}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true)
          }}
          hasError={hasError}
          autoComplete="off"
          {...props}
        />
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 overflow-auto rounded-md border shadow-xl shadow-black/5 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 max-h-60">
            <ul className="p-1" ref={listRef}>
              {suggestions.map((suggestion, idx) => {
                const displayValue = typeof suggestion === 'object' && suggestion !== null ? suggestion.value : suggestion;
                return (
                  <li
                    key={idx}
                    className={cx(
                      "cursor-pointer rounded-sm px-3 py-2 text-sm text-gray-900 dark:text-gray-50 truncate",
                      focusedIndex === idx
                        ? "bg-gray-100 dark:bg-gray-900 font-semibold"
                        : "hover:bg-gray-100 dark:hover:bg-gray-900 focus-visible:bg-gray-100 dark:focus-visible:bg-gray-900"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(suggestion);
                    }}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    {displayValue}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    )
  }
)

Autocomplete.displayName = "Autocomplete"

export { Autocomplete }
