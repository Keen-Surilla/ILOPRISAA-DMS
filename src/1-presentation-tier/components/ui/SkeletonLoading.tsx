// src/1-presentation-tier/components/ui/TableSkeleton.tsx
import React from 'react';

interface TableSkeletonProps {
  rows?: number;
}

export function TableSkeleton({ rows = 3 }: TableSkeletonProps) {
  const skeletonArray = Array.from({ length: rows });

  return (
    <>
      {skeletonArray.map((_, index) => (
        <tr key={index} className="border-b border-slate-100 animate-pulse">
          <td className="py-3 pl-2">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-24 mb-1.5"></div>
                <div className="h-2.5 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
          </td>
          <td className="py-3 align-middle">
            <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto"></div>
          </td>
          <td className="py-3 align-middle">
            <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div>
          </td>
          <td className="py-3 align-middle">
            <div className="w-8 h-8 bg-slate-200 rounded-lg mx-auto"></div>
          </td>
          <td className="py-3 pr-2 align-middle">
            <div className="w-16 h-8 bg-slate-200 rounded-lg ml-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 6 }: CardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
            <div className="flex-1">
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded-full w-1/3"></div>
            </div>
          </div>
          <div className="h-3 bg-slate-200 rounded w-4/5 mt-4"></div>
        </div>
      ))}
    </>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-4">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 250 }: { height?: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="h-full w-full bg-slate-100 rounded-lg relative overflow-hidden flex items-end gap-2 px-4 pb-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 rounded-t"
            style={{ height: `${30 + Math.sin(i) * 20 + Math.random() * 20}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function PieChartSkeleton({ size = 220 }: { size?: number }) {
  return (
    <div className="animate-pulse flex flex-col items-center justify-center gap-4" style={{ height: size }}>
      <div className="relative" style={{ width: size * 0.8, height: size * 0.8 }}>
        <div className="absolute inset-0 rounded-full bg-slate-200"></div>
        <div
          className="absolute rounded-full bg-white"
          style={{
            top: '27%', left: '27%', right: '27%', bottom: '27%',
          }}
        ></div>
      </div>
      <div className="flex gap-4">
        <div className="h-2.5 w-14 bg-slate-200 rounded-full"></div>
        <div className="h-2.5 w-14 bg-slate-200 rounded-full"></div>
        <div className="h-2.5 w-14 bg-slate-200 rounded-full"></div>
      </div>
    </div>
  );
}

interface ListRowSkeletonProps {
  count?: number;
  variant?: 'avatar' | 'date';
}

export function ListRowSkeleton({ count = 3, variant = 'avatar' }: ListRowSkeletonProps) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          {variant === 'avatar' ? (
            <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
          ) : (
            <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0"></div>
          )}
          <div className="flex-1">
            <div className="h-3.5 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-2.5 bg-slate-200 rounded w-1/3"></div>
          </div>
          {variant === 'avatar' && <div className="h-7 w-16 bg-slate-200 rounded-lg shrink-0"></div>}
        </div>
      ))}
    </div>
  );
}