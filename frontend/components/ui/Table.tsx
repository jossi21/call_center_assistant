"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export interface Column<T> {
  key: string;
  header: string;
  headerClassName?: string;
  cell: (item: T) => ReactNode;
}

interface TableProps<T> {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  loading?: boolean;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  title,
  description,
  headerAction,
  loading = false,
  columns,
  data,
  keyExtractor,
  emptyMessage = "No items found",
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <Card
        className={`overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-lg ${className || ""}`}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-lg">
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 p-6">
          <div>
            {title && (
              <CardTitle className="text-lg font-bold text-white">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${column.headerClassName || ""}`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-16 text-center text-sm text-slate-500 bg-slate-950"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="border-b border-slate-800/70 last:border-0 bg-slate-950 hover:bg-slate-900/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 text-slate-200">
                        {column.cell(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
