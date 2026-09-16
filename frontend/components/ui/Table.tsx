"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "./card";

export interface Column<T> {
  key: string;
  header: string;
  headerClassName?: string;
  cell: (item: T) => ReactNode;
}

interface TableProps<T> {
  loading?: boolean;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
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
        className={`overflow-hidden rounded-[28px] border border-[#123957] bg-[#061d31] shadow-lg ${
          className || ""
        }`}
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
    <Card
      className={`overflow-hidden rounded-[28px] border border-[#123957] bg-[#061d31] shadow-lg ${
        className || ""
      }`}
    >
      <CardContent className="bg-[#061d31] p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#123957] bg-[#041a2b]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                      column.headerClassName || ""
                    }`}
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
                    className="bg-[#061d31] py-16 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={keyExtractor(item)}
                    className="border-b border-[#123957]/70 bg-[#061d31] transition-colors last:border-0 hover:bg-[#08253b]"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 align-middle">
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
