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
          {/* 1. Athlete Info Column */}
          <td className="py-3 pl-2">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0"></div>
              <div>
                <div className="h-4 bg-slate-200 rounded w-24 mb-1.5"></div>
                <div className="h-2.5 bg-slate-200 rounded w-32"></div>
              </div>
            </div>
          </td>
          {/* 2. Role Column */}
          <td className="py-3 align-middle">
            <div className="h-3.5 bg-slate-200 rounded w-16 mx-auto"></div>
          </td>
          {/* 3. NEW: Status Column */}
          <td className="py-3 align-middle">
            <div className="h-6 bg-slate-200 rounded-full w-20 mx-auto"></div>
          </td>
          {/* 4. Documents Column */}
          <td className="py-3 align-middle">
            <div className="w-8 h-8 bg-slate-200 rounded-lg mx-auto"></div>
          </td>
          {/* 5. Delete Column */}
          <td className="py-3 pr-2 align-middle">
            <div className="w-16 h-8 bg-slate-200 rounded-lg ml-auto"></div>
          </td>
        </tr>
      ))}
    </>
  );
}