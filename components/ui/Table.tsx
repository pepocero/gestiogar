import React from 'react'
import { clsx } from 'clsx'

interface TableProps {
  children: React.ReactNode
  className?: string
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  colSpan?: number
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
  colSpan?: number
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={clsx('table', className)}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className }: TableHeaderProps) {
  return (
    <thead className={clsx('bg-gray-50', className)}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={clsx('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={clsx(
        'hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className, colSpan }: TableHeadProps) {
  return (
    <th
      className={clsx('table th', className)}
      colSpan={colSpan}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <td
      className={clsx('table td', className)}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}
