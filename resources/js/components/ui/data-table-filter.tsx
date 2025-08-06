"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export interface FilterOption {
  id: string
  label: string
  value: string | number | boolean
}

export interface FilterConfig {
  id: string
  label: string
  options: FilterOption[]
  type: 'checkbox' | 'radio' // untuk future expansion
}

interface DataTableFilterProps {
  filters: FilterConfig[]
  onFilterChange: (filterId: string, selectedValues: (string | number | boolean)[]) => void
  activeFilters: Record<string, (string | number | boolean)[]>
}

export function DataTableFilter({
  filters,
  onFilterChange,
  activeFilters
}: DataTableFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Hitung total active filters
  const totalActiveFilters = Object.values(activeFilters).reduce(
    (acc, values) => acc + values.length,
    0
  )

  const handleFilterToggle = (filterId: string, optionValue: string | number | boolean) => {
    const currentValues = activeFilters[filterId] || []
    const isSelected = currentValues.includes(optionValue)

    let newValues: (string | number | boolean)[]
    if (isSelected) {
      // Remove filter
      newValues = currentValues.filter(item => item !== optionValue)
    } else {
      // Add filter
      newValues = [...currentValues, optionValue]
    }

    onFilterChange(filterId, newValues)
  }

  const clearAllFilters = () => {
    filters.forEach(filter => {
      onFilterChange(filter.id, [])
    })
  }

  const clearSpecificFilter = (filterId: string) => {
    onFilterChange(filterId, [])
  }

  const isOptionSelected = (filterId: string, optionValue: string | number | boolean) => {
    const currentValues = activeFilters[filterId] || []
    return currentValues.includes(optionValue)
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="cursor-pointer relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {totalActiveFilters > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 min-w-5 text-xs px-1.5"
              >
                {totalActiveFilters}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center justify-between px-2 py-1">
            <DropdownMenuLabel className="px-0">Filter Data</DropdownMenuLabel>
            {totalActiveFilters > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-auto p-1 text-xs hover:text-destructive-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />

          {filters.map((filter, filterIndex) => {
            const filterActiveCount = (activeFilters[filter.id] || []).length
            return (
              <div key={filter.id}>
                <div className="flex items-center justify-between px-2 py-1">
                  <DropdownMenuLabel className="px-0 text-sm font-medium">
                    {filter.label}
                  </DropdownMenuLabel>
                  {filterActiveCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="h-4 text-xs px-1">
                        {filterActiveCount}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearSpecificFilter(filter.id)}
                        className="h-auto p-0.5 hover:text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {filter.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.id}
                    checked={isOptionSelected(filter.id, option.value)}
                    onCheckedChange={() =>
                      handleFilterToggle(filter.id, option.value)
                    }
                    className="cursor-pointer"
                  >
                    {option.label}
                  </DropdownMenuCheckboxItem>
                ))}

                {filterIndex < filters.length - 1 && <DropdownMenuSeparator />}
              </div>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Active filters badges */}
      {totalActiveFilters > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(activeFilters).map(([filterId, values]) =>
            values.map((value, index) => {
              const filter = filters.find(f => f.id === filterId)
              const option = filter?.options.find(o => o.value === value)

              if (!option) return null

              return (
                <Badge
                  key={`${filterId}-${index}`}
                  variant="secondary"
                  className="text-xs cursor-pointer hover:text-destructive-foreground"
                  onClick={() => handleFilterToggle(filterId, value)}
                >
                  {option.label}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
