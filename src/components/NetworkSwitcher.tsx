'use client'

import { useNetwork } from '@/contexts/NetworkContext'
import type { NetworkId } from '@/config/networks'
import { playRetroSound } from '@/utils/retro-sounds'
import { useState, useEffect } from 'react'
import { useSwitchChain, useAccount } from 'wagmi'

export function NetworkSwitcher(): JSX.Element {
  const { currentNetworkId, switchNetwork, availableNetworks, currentNetwork } = useNetwork()
  const { switchChain } = useSwitchChain()
  const { chain } = useAccount() // Get current chain from wallet
  const [isOpen, setIsOpen] = useState(false)
  
  // 🔄 WALLET SYNC: When user changes network in wallet, update app context
  useEffect(() => {
    if (chain?.id) {
      // Find network in our config by chainId
      const networkEntry = Object.entries(availableNetworks).find(
        ([_, network]) => network.chainId === chain.id
      )
      
      if (networkEntry) {
        const [networkId] = networkEntry
        // If wallet network differs from app context, sync it
        if (networkId !== currentNetworkId) {
          console.log('🔄 Wallet network changed, syncing app context:', chain.id, networkId)
          switchNetwork(networkId as NetworkId)
        }
      }
    }
  }, [chain?.id, availableNetworks, currentNetworkId, switchNetwork])
  
  const handleSwitch = async (networkId: NetworkId): Promise<void> => {
    if (networkId !== currentNetworkId) {
      playRetroSound.switch()
      
      // Switch in our context
      switchNetwork(networkId)
      
      // Also switch in wagmi/rainbow kit
      const targetNetwork = availableNetworks[networkId]
      if (targetNetwork && switchChain) {
        try {
          await switchChain({ chainId: targetNetwork.chainId })
          console.log('✅ Wagmi chain switched to:', targetNetwork.name)
        } catch (error) {
          console.error('⚠️ Wagmi chain switch failed:', error)
          // Continue anyway - context switch was successful
        }
      }
      
      setIsOpen(false)
    }
  }

  // Get dark background color based on current network
  const getNetworkBgColor = (networkId: string): string => {
    switch (networkId) {
      case 'ARC':
        return 'rgba(96, 96, 96, 0.8)' // Dark gray
      case 'STABLE':
        return 'rgba(16, 185, 129, 0.8)' // Dark emerald
      case 'BASE':
        return 'rgba(0, 32, 96, 0.9)' // Navy blue
      case 'GIWA':
        return 'rgba(0, 128, 0, 0.8)' // Dark green
      default:
        return 'rgba(96, 96, 96, 0.8)'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-transparent transition-all relative">
        {/* Current Network Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            px-8 py-4 font-mono text-lg font-bold transition-all flex items-center gap-3
            ${currentNetworkId === 'ARC'
              ? 'text-gray-300 hover:text-white'
              : currentNetworkId === 'STABLE'
              ? 'text-emerald-500 hover:text-emerald-400'
              : currentNetworkId === 'SEPOLIA'
              ? 'text-purple-400 hover:text-purple-300'
              : currentNetworkId === 'BASE'
              ? 'text-cyan-400 hover:text-cyan-300'
              : 'text-green-400 hover:text-green-300'
            }
          `}
        >
          <span className="animate-pulse">▶</span>
          {currentNetwork.displayName}
          <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {/* Dropdown Menu - Transparent with selected network's dark background */}
        <div 
          className={`
            absolute top-full right-0 mt-2 w-full
            origin-top
            transition-all duration-300 ease-out
            ${isOpen 
              ? 'opacity-100 scale-y-100 translate-y-0' 
              : 'opacity-0 scale-y-0 -translate-y-2 pointer-events-none'
            }
          `}
        >
          {/* Transparent panel with selected network's dark background */}
          <div 
            className="backdrop-blur-sm rounded-lg border border-white/10 space-y-1 p-2"
            style={{ backgroundColor: getNetworkBgColor(currentNetworkId) }}
          >
            {Object.entries(availableNetworks).map(([id, network]) => {
              const isActive = currentNetworkId === id
              if (isActive) return null // Don't show current network in dropdown
              
              return (
                <button
                  key={id}
                  onClick={() => handleSwitch(id as NetworkId)}
                  className={`
                    w-full px-6 py-3 font-mono text-lg font-bold transition-all text-left
                    rounded-md hover:bg-white/10
                    ${id === 'ARC'
                      ? 'text-gray-300 hover:text-white'
                      : id === 'STABLE'
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : id === 'SEPOLIA'
                      ? 'text-purple-400 hover:text-purple-300'
                      : id === 'BASE'
                      ? 'text-cyan-400 hover:text-cyan-300'
                      : 'text-green-400 hover:text-green-300'
                    }
                  `}
                >
                  {network.displayName}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
