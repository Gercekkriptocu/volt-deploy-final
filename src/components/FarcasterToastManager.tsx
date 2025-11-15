'use client'

// Mini App ID: 58044ec6-bf7e-45fc-bb46-64b50969e653

import { useManifestStatus } from '@/hooks/useManifestStatus'
import { useRef, useEffect, useState } from 'react'

interface ManifestResult {
  header: string
  payload: string
  signature: string
}

interface FarcasterToastManagerProps {
  children: (handlers: {
    onManifestSuccess: (result: ManifestResult) => void
    onManifestError: (errorMessage: string, errorType: string) => void
  }) => React.ReactNode
}

export default function FarcasterToastManager({ children }: FarcasterToastManagerProps): JSX.Element {
  const { isSigned, isLoading, refetch } = useManifestStatus()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [copySucceeded, setCopySucceeded] = useState(false)
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  const copyAllAsJSON = async (result: ManifestResult): Promise<boolean> => {
    try {
      const fieldsOnly = {
        header: result.header,
        payload: result.payload,
        signature: result.signature,
      }
      const textToCopy = JSON.stringify(fieldsOnly, null, 2)
      await navigator.clipboard.writeText(textToCopy)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  const handleManifestSuccess = (result: ManifestResult): void => {
    // Refresh the manifest status after successful signing
    refetch()
    
    // Only copy to clipboard, no toast
    if (isSigned && !isLoading) {
      console.log('Manifest was already signed')
      return
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    ;(async () => {
      const success = await copyAllAsJSON(result)
      setCopySucceeded(success)
      console.log('Manifest signed successfully, copied to clipboard:', success)
    })()
  }

  const handleManifestError = (errorMessage: string, errorType: string): void => {
    // Only log error, no toast
    if (isSigned && !isLoading) {
      console.log('Manifest was already signed')
      return
    }
    
    console.error('Manifest signing failed:', errorType, errorMessage)
  }

  return (
    <>
      {children({
        onManifestSuccess: handleManifestSuccess,
        onManifestError: handleManifestError,
      })}
    </>
  )
}

export type { ManifestResult }
