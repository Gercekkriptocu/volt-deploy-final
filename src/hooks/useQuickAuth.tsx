import { sdk } from '@farcaster/miniapp-sdk'
import { useEffect, useRef } from 'react'

interface UserData {
  fid: number
  displayName: string
  username: string
  pfpUrl?: string
  primaryAddress?: string
}

export function useQuickAuth(isInFarcaster: boolean): void {
  const hasAuthenticated = useRef(false)

  useEffect(() => {
    const authenticateUser = async (): Promise<void> => {
      try {
        if (!isInFarcaster) return
        
        if (hasAuthenticated.current) return
        hasAuthenticated.current = true
        
        const response: Response = await sdk.quickAuth.fetch('/api/me')
        
        if (response.ok) {
          const userData: UserData = await response.json()
          console.log('Quick Auth successful:', userData)
        } else {
          console.error('Authentication failed')
        }
      } catch (error) {
        console.error('Quick Auth error:', error)
      }
    }

    authenticateUser()
  }, [isInFarcaster])
}
