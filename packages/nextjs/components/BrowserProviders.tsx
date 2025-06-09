"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useWalletHeaders } from '../lib/utils/clientAuthHelpers'

// No need to mock indexedDB anymore since we're using dynamic imports with SSR disabled

interface BrowserProvidersProps {
  children: ReactNode
}

export function BrowserProviders({ children }: BrowserProvidersProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  // Set up wallet headers for API requests
  useWalletHeaders()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <div>Loading...</div>
  }

  return <>{children}</>
}