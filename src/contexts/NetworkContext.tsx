'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { NETWORKS, type NetworkId, type NetworkConfig } from '@/config/networks'

interface NetworkContextType {
  currentNetwork: NetworkConfig
  currentNetworkId: NetworkId
  switchNetwork: (networkId: NetworkId) => void
  availableNetworks: Record<string, NetworkConfig>
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined)

export function NetworkProvider({ children }: { children: ReactNode }): JSX.Element {
  const [currentNetworkId, setCurrentNetworkId] = useState<NetworkId>(() => {
    // Restore saved network from localStorage on initial load
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedNetwork')
      if (saved && (saved === 'ARC' || saved === 'GIWA' || saved === 'STABLE' || saved === 'BASE')) {
        return saved as NetworkId
      }
    }
    return 'ARC'
  })

  const switchNetwork = useCallback((networkId: NetworkId) => {
    console.log('🔄 Switching network to:', networkId)
    setCurrentNetworkId(networkId)
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedNetwork', networkId)
    }
  }, [])

  // Restore network selection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedNetwork')
      if (saved && (saved === 'ARC' || saved === 'GIWA' || saved === 'STABLE' || saved === 'BASE')) {
        setCurrentNetworkId(saved as NetworkId)
      }
    }
  }, [])

  const value: NetworkContextType = {
    currentNetwork: NETWORKS[currentNetworkId],
    currentNetworkId,
    switchNetwork,
    availableNetworks: NETWORKS
  }

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork(): NetworkContextType {
  const context = useContext(NetworkContext)
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider')
  }
  return context
}
