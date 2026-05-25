"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  date?: Date
  onSelect: (date?: Date) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>()

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-[280px] justify-start gap-2 overflow-hidden text-left font-normal"
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{date ? format(date, "PPP") : "Pick a date"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[60] w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}

export function DatePicker({
  date,
  onSelect,
  placeholder = "Pilih tanggal",
  disabled = false,
  className,
}: DatePickerProps) {
  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!date}
          className={cn(
            "data-[empty=true]:text-muted-foreground flex h-10 w-full min-w-0 justify-start gap-2 overflow-hidden text-left font-normal",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate text-left">{date ? format(date, "PPP") : placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[60] w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus />
      </PopoverContent>
    </Popover>
  )
}
