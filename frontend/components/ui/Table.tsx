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
}: TableProps<T>) {
  if (loading) {
    return (
      <Card className="overflow-hidden rounded-[28px] border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-border bg-card shadow-sm">
      {(title || description || headerAction) && (
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 p-6">
          <div>
            {title && (
              <CardTitle className="text-lg font-bold text-foreground">
                {title}
              </CardTitle>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </CardHeader>
      )}

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground ${column.headerClassName || ""}`}
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
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4">
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
