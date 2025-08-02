"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
} from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import * as XLSX from "xlsx"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, ArrowUpDown, ChevronDown, Settings2, ArrowUp, ArrowDown, FileDown, Search, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onAddNew?: () => void
  addButtonLabel?: string
  onBulkDelete?: (selectedRows: TData[]) => void
  searchColumn?: string
  searchPlaceholder?: string
  emptyMessage?: React.ReactNode
  initialColumnVisibility?: VisibilityState
  exportFilename?: string
   showExportButton?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onAddNew,
  addButtonLabel = "Tambah Data",
  onBulkDelete,
  searchColumn,
  searchPlaceholder = "Cari data...",
  emptyMessage,
  initialColumnVisibility = {},
  exportFilename = "exported-data",
  showExportButton = false
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const handleExport = () => {
    const excludedIds = ["select", "actions", "aksi", "action"]
    const visibleColumns = table.getAllColumns().filter(col =>
      col.getIsVisible() && !excludedIds.includes(col.id)
    )

    const exportData = table.getFilteredRowModel().rows.map(row => {
      const rowData: Record<string, any> = {}

      visibleColumns.forEach(col => {
        const columnId = col.id

        if (columnId === "no") {
          rowData["No"] = row.index + 1
        } else {
          const cell = row.getAllCells().find(c => c.column.id === columnId)
          if (cell) {
            const value = cell.renderValue() || cell.getValue()
            const header = col.columnDef.header
            const headerText = typeof header === "string"
              ? header
              : typeof header === "function"
                ? columnId
                : columnId
            rowData[headerText] = value
          }
        }
      })

      return rowData
    })

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1")

    // Save file
    XLSX.writeFile(wb, `${exportFilename}.xlsx`)
  }

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelectedRows = selectedRows.length > 0

  const handleBulkDelete = () => {
    if (onBulkDelete && hasSelectedRows) {
      const selectedData = selectedRows.map(row => row.original)
      onBulkDelete(selectedData)
      setRowSelection({})
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="w-full">
      {hasSelectedRows && (
        <div className="flex items-center justify-between py-2 px-4 bg-muted/50 rounded-md mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRows.length} item dipilih
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onBulkDelete && (
              <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus ({selectedRows.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus {selectedRows.length} jadwal yang dipilih?
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleBulkDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Ya, Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="cursor-pointer"
            >
              Batal Pilih
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4 py-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 gap-2 w-full flex-wrap">
          {/* search */}
          {searchColumn && (
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                }
                className="pl-9 w-full"
              />
            </div>
          )}

          {/* export button */}
          {showExportButton && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleExport}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          )}

          {/* visible columns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                <Settings2 className="mr-2 h-4 w-4" />
                Kolom
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  const headerText = (() => {
                    const header = column.columnDef.header
                    if (typeof header === "string") return header
                    if (typeof header === "function") return column.id
                    const rendered = flexRender(header, {})
                    return typeof rendered === "string" ? rendered : column.id
                  })()

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {headerText}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {onAddNew && (
          <div className="w-full md:w-auto">
            <Button onClick={onAddNew} className="w-full md:w-auto cursor-pointer">
              {addButtonLabel}
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? 'cursor-pointer select-none flex items-center gap-2'
                              : '',
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && !header.column.getIsSorted() && (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                          {header.column.getIsSorted() === 'asc' && (
                            <ArrowUp className="h-4 w-4" />
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage || "Belum ada data."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* pagination */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} dari{" "}
            {table.getFilteredRowModel().rows.length} data dipilih.
          </div>
          <div className="space-x-2 flex items-center">
            <p className="text-sm font-medium">Jumlah data per halaman</p>
            {/* todo: coba seed >10 data terus test ini */}
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[90px] text-sm">
                <SelectValue placeholder="Rows" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* pagination */}
        <div className="flex justify-between items-center sm:space-x-4 gap-2">
          <div className="text-sm text-left">
            Halaman {table.getState().pagination.pageIndex + 1} dari{" "}
            {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight/>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
