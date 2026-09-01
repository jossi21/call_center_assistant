"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// --- Table -> Card grid ------------------------------------------------
// react-markdown (with remark-gfm) calls these overrides for table nodes.
// Rather than rendering an actual <table>, we intercept the structure here
// and re-compose each row as a card: first column is the card title, every
// other column becomes a "label: value" row inside the card. Cell content
// (bold, code, links, etc.) is passed through untouched, just relaid out.

function Td({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function Th({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function Tr({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function Thead({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
function Tbody({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

function extractRows(sectionChildren: React.ReactNode): React.ReactElement[][] {
  const rows: React.ReactElement[][] = [];
  React.Children.forEach(sectionChildren, (trEl) => {
    if (!React.isValidElement(trEl)) return;
    const cells = React.Children.toArray(
      (trEl.props as { children?: React.ReactNode }).children,
    ).filter(React.isValidElement) as React.ReactElement[];
    rows.push(cells);
  });
  return rows;
}

function Table({ children }: { children?: React.ReactNode }) {
  let headerCells: React.ReactElement[] = [];
  let bodyRows: React.ReactElement[][] = [];

  React.Children.forEach(children, (section) => {
    if (!React.isValidElement(section)) return;
    if (section.type === Thead) {
      const rows = extractRows(
        (section.props as { children?: React.ReactNode }).children,
      );
      headerCells = rows[0] || [];
    }
    if (section.type === Tbody) {
      bodyRows = extractRows(
        (section.props as { children?: React.ReactNode }).children,
      );
    }
  });

  const headerLabels = headerCells.map(
    (th) => (th.props as { children?: React.ReactNode }).children,
  );

  return (
    <div className="my-3 grid grid-cols-1 gap-3">
      {bodyRows.map((cells, rowIdx) => (
        <div
          key={rowIdx}
          className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm"
        >
          {cells.map((cell, cellIdx) => {
            const value = (cell.props as { children?: React.ReactNode })
              .children;

            if (cellIdx === 0) {
              return (
                <div
                  key={cellIdx}
                  className="mb-2 text-sm font-semibold text-zinc-900"
                >
                  {value}
                </div>
              );
            }

            return (
              <div
                key={cellIdx}
                className="flex items-center justify-between gap-3 border-t border-zinc-100 py-1.5 text-xs first:border-t-0"
              >
                <span className="text-zinc-400">{headerLabels[cellIdx]}</span>
                <span className="text-right font-medium text-zinc-700">
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
// ------------------------------------------------------------------------

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 text-xl font-bold text-zinc-900">{children}</h1>
        ),

        h2: ({ children }) => (
          <h2 className="mb-2 mt-4 text-lg font-semibold text-zinc-900">
            {children}
          </h2>
        ),

        h3: ({ children }) => (
          <h3 className="mb-2 mt-3 text-base font-semibold text-zinc-900">
            {children}
          </h3>
        ),

        p: ({ children }) => (
          <p className="mb-3 leading-7 last:mb-0">{children}</p>
        ),

        ol: ({ children }) => (
          <ol className="mb-3 ml-6 list-decimal space-y-2">{children}</ol>
        ),

        ul: ({ children }) => (
          <ul className="mb-3 ml-6 list-disc space-y-2">{children}</ul>
        ),

        li: ({ children }) => <li className="leading-7">{children}</li>,

        strong: ({ children }) => (
          <strong className="font-semibold text-zinc-900">{children}</strong>
        ),

        em: ({ children }) => <em className="italic">{children}</em>,

        code: ({ children }) => (
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600">
            {children}
          </code>
        ),

        pre: ({ children }) => (
          <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-100">
            {children}
          </pre>
        ),

        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-indigo-500 pl-4 italic text-zinc-600">
            {children}
          </blockquote>
        ),

        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline hover:text-indigo-700"
          >
            {children}
          </a>
        ),

        hr: () => <hr className="my-4 border-zinc-200" />,

        table: Table,
        thead: Thead,
        tbody: Tbody,
        tr: Tr,
        th: Th,
        td: Td,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
