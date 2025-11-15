// ═══════════════════════════════════════════════════════════════
// 🔗 AUTO-GENERATED NETWORK CONFIG FROM chains.ts
// ═══════════════════════════════════════════════════════════════
// Bu dosya artık chains.ts'den otomatik türetiliyor.
// Yeni network eklemek için src/config/chains.ts'e git!
// ═══════════════════════════════════════════════════════════════

import { CHAINS, type ChainConfig } from './chains'

// Network Configuration - Multi-Chain Support
export interface NetworkConfig {
  id: string
  name: string
  displayName: string
  chainId: number
  rpcUrl: string
  explorerUrl: string
  explorerApiUrl: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  feeToken?: {
    name: string
    symbol: string
    contractAddress?: string
    decimals?: number
    isNative?: boolean
  }
  color: string
  ascii: string
}

// Auto-generate NETWORKS from CHAINS
export const NETWORKS: Record<string, NetworkConfig> = CHAINS.reduce((acc, chain) => {
  acc[chain.id] = {
    id: chain.id,
    name: chain.name,
    displayName: chain.displayName,
    chainId: chain.chainId,
    rpcUrl: chain.rpcUrls.primary,
    explorerUrl: chain.explorerUrl,
    explorerApiUrl: chain.explorerApiUrl,
    nativeCurrency: chain.nativeCurrency,
    feeToken: chain.feeToken,
    color: chain.color,
    ascii: chain.ascii
  }
  return acc
}, {} as Record<string, NetworkConfig>)

export type NetworkId = keyof typeof NETWORKS
