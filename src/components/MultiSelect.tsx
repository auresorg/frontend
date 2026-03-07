// Tremor Raw / Custom MultiSelect wrapper over Radix DropdownMenu

"use client"

import * as React from "react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '@/components/DropdownMenu'
import { RiExpandUpDownLine } from '@remixicon/react'
import { cx, focusInput } from '@/lib/utils'

export function MultiSelect({
  value = [],
  onValueChange,
  children,
  placeholder = 'Select...',
  className,
}: {
  value?: string[]
  onValueChange?: (value: string[]) => void
  children?: React.ReactNode
  placeholder?: string
  className?: string
}) {
  const options = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      const el = child as React.ReactElement<{ value: string; children?: React.ReactNode; label?: string }>;
      return {
        value: el.props.value,
        label: el.props.children || el.props.label,
      };
    })

  const selectedOptions = options.filter(opt => value.includes(opt.value))

  const handleSelect = (val: string) => {
    if (!onValueChange) return
    if (value.includes(val)) {
      onValueChange(value.filter((v: string) => v !== val))
    } else {
      onValueChange([...value, val])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cx(
            "group/trigger flex w-full select-none items-center justify-between gap-2 truncate rounded-md border px-3 py-2 shadow-sm outline-none transition sm:text-sm",
            "border-gray-300 dark:border-gray-800",
            "text-gray-900 dark:text-gray-50",
            "bg-white dark:bg-gray-950",
            "hover:bg-gray-50 dark:hover:bg-gray-950/50",
            focusInput,
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-500 dark:text-gray-500">{placeholder}</span>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedOptions.map(opt => (
                  <span key={opt.value} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {opt.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <RiExpandUpDownLine
            className="size-4 shrink-0 text-gray-400 dark:text-gray-600"
          />
        </button>
      </DropdownMenuTrigger>
      {/* Set high z-index to escape over Vaul Drawers & Dialogs */}
      <DropdownMenuContent className="z-[9999] w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]" align="start">
        {options.map(opt => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={value.includes(opt.value)}
            onCheckedChange={() => handleSelect(opt.value)}
            onSelect={(e) => e.preventDefault()} // Keeps the menu open!
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MultiSelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return null
}