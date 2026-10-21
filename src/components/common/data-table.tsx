"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode | ((isAr: boolean) => React.ReactNode);
  accessor?: (item: T) => any;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
  headerClassName?: string;
  align?: "start" | "center" | "end" | "left" | "right";
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: FilterOption[];
  predicate: (item: T, selectedValue: string) => boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filters?: FilterDef<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  searchPredicate?: (item: T, query: string) => boolean;
  defaultSortKey?: string;
  defaultSortDirection?: "asc" | "desc";
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  isAr?: boolean;
  onRowClick?: (item: T) => void;
  exportFileName?: string;
  enableExport?: boolean;
  title?: string | React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
  emptyIcon?: React.ComponentType<{ className?: string }>;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filters = [],
  searchPlaceholder,
  searchKeys,
  searchPredicate,
  defaultSortKey,
  defaultSortDirection = "asc",
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  isAr = false,
  onRowClick,
  exportFileName,
  enableExport = true,
  title,
  subtitle,
  actions,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
  className,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Active filter count
  const activeFiltersCount = Object.values(selectedFilters).filter(
    (v) => v && v !== "all"
  ).length + (searchQuery.trim() ? 1 : 0);

  const handleFilterChange = (filterKey: string, value: string) => {
    setSelectedFilters((prev) => {
      const next = { ...prev };
      if (!value || value === "all") {
        delete next[filterKey];
      } else {
        next[filterKey] = value;
      }
      return next;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedFilters({});
    setCurrentPage(1);
  };

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        // Reset sort
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(columnKey);
      setSortDirection("asc");
    }
  };

  // Filter & Search Logic
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (searchPredicate) {
          if (!searchPredicate(item, query)) return false;
        } else if (searchKeys && searchKeys.length > 0) {
          const matches = searchKeys.some((k) => {
            const val = item[k as string];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(query);
          });
          if (!matches) return false;
        } else {
          // Default: Search across all column accessors/keys
          const matches = columns.some((col) => {
            if (col.searchable === false) return false;
            let val = col.accessor ? col.accessor(item) : item[col.key];
            if (val === undefined || val === null) return false;
            return String(val).toLowerCase().includes(query);
          });
          if (!matches) return false;
        }
      }

      // 2. Dropdown Filters
      for (const [filterKey, filterValue] of Object.entries(selectedFilters)) {
        if (!filterValue || filterValue === "all") continue;
        const filterDef = filters.find((f) => f.key === filterKey);
        if (filterDef && !filterDef.predicate(item, filterValue)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchQuery, selectedFilters, searchPredicate, searchKeys, columns, filters]);

  // Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      let valA = column?.accessor ? column.accessor(a) : a[sortKey];
      let valB = column?.accessor ? column.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      // Date comparison
      if (typeof valA === "string" && !isNaN(Date.parse(valA)) && isNaN(Number(valA))) {
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }
      }

      // Numeric comparison
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      // String comparison
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      const comp = strA.localeCompare(strB, isAr ? "ar" : "en", { numeric: true });
      return sortDirection === "asc" ? comp : -comp;
    });
  }, [filteredData, sortKey, sortDirection, columns, isAr]);

  // Pagination Logic
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    if (pageSize >= 1000) return sortedData;
    const startIdx = (safePage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, safePage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    try {
      const exportCols = columns.filter((c) => c.key !== "actions" && c.key !== "_actions");
      const headers = exportCols
        .map((c) => {
          if (typeof c.header === "string") return `"${c.header.replace(/"/g, '""')}"`;
          return `"${c.key}"`;
        })
        .join(",");

      const rows = sortedData.map((item) => {
        return exportCols
          .map((c) => {
            let val = c.accessor ? c.accessor(item) : item[c.key];
            if (val === undefined || val === null) val = "";
            if (typeof val === "object") val = JSON.stringify(val);
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(",");
      });

      const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${exportFileName || "export"}_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
    }
  };

  const startEntry = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, totalItems);

  return (
    <Card className={cn("border border-border/80 bg-card rounded-2xl overflow-hidden shadow-xs", className)}>
      {/* ── Table Header / Toolbar ──────────────────────────────── */}
      <div className="p-4 border-b border-border/80 space-y-3 bg-muted/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {(title || subtitle) && (
            <div>
              {title && (
                <div className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                  {title}
                </div>
              )}
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            {actions}

            {enableExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-xs font-semibold rounded-xl gap-1.5 border-border/80"
                title={isAr ? "تصدير البيانات المعروضة لملف CSV" : "Export current data to CSV"}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">{isAr ? "تصدير CSV" : "Export CSV"}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute start-3 top-2.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                searchPlaceholder ||
                (isAr ? "بحث فوري في كل الحقول والبيانات..." : "Quick search all records...")
              }
              className="h-8.5 ps-9 pe-8 text-xs bg-background rounded-xl border-border/80"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute end-2.5 top-2.5 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filters Strip */}
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter) => (
              <div key={filter.key} className="flex items-center">
                <select
                  value={selectedFilters[filter.key] || "all"}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="h-8.5 px-3 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="all">{filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8.5 px-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 rounded-xl gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? "إعادة تعيين" : "Reset"}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-600 font-bold">
                  {activeFiltersCount}
                </span>
              </Button>
            )}

            {/* Total Count Badge */}
            <div className="text-[11px] font-semibold text-muted-foreground px-2.5 py-1 bg-muted/40 rounded-xl border border-border/60 ms-auto md:ms-0 whitespace-nowrap">
              {isAr
                ? `${totalItems} من إجمالي ${data.length}`
                : `${totalItems} of ${data.length}`}
            </div>
          </div>
        </div>
      </div>

      {/* ── Table Content ───────────────────────────────────────── */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-xs text-start border-collapse">
          <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground font-bold select-none">
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                const canSort = col.sortable !== false;
                const headerContent =
                  typeof col.header === "function" ? col.header(isAr) : col.header;

                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "end" || col.align === "right"
                    ? "text-end"
                    : "text-start";

                return (
                  <th
                    key={col.key}
                    onClick={() => canSort && handleSort(col.key)}
                    className={cn(
                      "py-3 px-3.5 font-bold tracking-tight text-slate-700 dark:text-zinc-300 transition-colors whitespace-nowrap",
                      canSort && "cursor-pointer hover:bg-muted/70 hover:text-foreground",
                      alignClass,
                      col.headerClassName
                    )}
                  >
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5",
                        col.align === "center" && "justify-center",
                        (col.align === "end" || col.align === "right") && "justify-end"
                      )}
                    >
                      <span>{headerContent}</span>
                      {canSort && (
                        <span className="text-muted-foreground/60 shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ChevronUp className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-card">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center text-muted-foreground">
                  {EmptyIcon ? (
                    <EmptyIcon className="w-9 h-9 mx-auto mb-2 text-muted-foreground/40" />
                  ) : (
                    <SlidersHorizontal className="w-9 h-9 mx-auto mb-2 text-muted-foreground/40" />
                  )}
                  <p className="font-bold text-sm text-foreground">
                    {emptyTitle || (isAr ? "لا توجد نتائج مطابقة" : "No matching records found")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {emptyDescription ||
                      (activeFiltersCount > 0
                        ? isAr
                          ? "جرّب تغيير كلمات البحث أو إزالة الفلاتر المحددة لعرض المزيد من البيانات."
                          : "Try adjusting your search query or clearing active filters to view data."
                        : isAr
                        ? "لم يتم تسجيل أي بيانات في هذا الجدول بعد."
                        : "No data has been recorded in this table yet.")}
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="mt-3.5 h-7 text-xs rounded-xl"
                    >
                      <RotateCcw className="w-3 h-3 me-1.5" />
                      {isAr ? "إلغاء الفلاتر والبحث" : "Clear all filters"}
                    </Button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const rowKey = (item.id as string) || `row-${index}`;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "center"
                          ? "text-center"
                          : col.align === "end" || col.align === "right"
                          ? "text-end"
                          : "text-start";

                      const content = col.render
                        ? col.render(item, index)
                        : col.accessor
                        ? col.accessor(item)
                        : item[col.key];

                      return (
                        <td
                          key={col.key}
                          className={cn("py-3 px-3.5 text-foreground", alignClass, col.className)}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Table Footer / Pagination ─────────────────────────────── */}
      <div className="p-3 border-t border-border/80 bg-muted/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            {isAr
              ? `عرض ${startEntry} إلى ${endEntry} من إجمالي ${totalItems} سجل`
              : `Showing ${startEntry} to ${endEntry} of ${totalItems} records`}
          </span>

          <div className="flex items-center gap-1.5 ms-2">
            <span className="text-[11px]">{isAr ? "السطور:" : "Rows:"}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-7 px-2 text-xs rounded-lg bg-background border border-border/80 text-foreground focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt >= 1000 ? (isAr ? "الكل" : "All") : opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 w-7 p-0 rounded-lg"
              title={isAr ? "الصفحة السابقة" : "Previous page"}
            >
              {isAr ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </Button>

            <span className="px-2 text-xs font-semibold text-foreground">
              {safePage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 w-7 p-0 rounded-lg"
              title={isAr ? "الصفحة التالية" : "Next page"}
            >
              {isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
