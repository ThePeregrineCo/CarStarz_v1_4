"use client"

import { useEffect, useState, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component that renders its children only on the client side
 * Use this to wrap components that use browser-specific APIs like indexedDB
 */
export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}