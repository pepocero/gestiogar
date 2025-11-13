'use client'

import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface LimitIndicatorProps {
  current: number
  limit: number | null
  label: string
  itemName: string
}

export function LimitIndicator({ current, limit, label, itemName }: LimitIndicatorProps) {
  if (limit === null) {
    // Plan Pro - ilimitado
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span>{label}: <strong>{current}</strong> (Ilimitado)</span>
      </div>
    )
  }

  const percentage = (current / limit) * 100
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= limit

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}:</span>
        <span className={`font-medium ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900'}`}>
          {current} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {isAtLimit && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>Límite alcanzado. Actualiza a Pro para crear más {itemName}.</span>
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <div className="flex items-center gap-1 text-xs text-yellow-600">
          <AlertCircle className="h-3 w-3" />
          <span>Cerca del límite. Considera actualizar a Pro.</span>
        </div>
      )}
    </div>
  )
}

