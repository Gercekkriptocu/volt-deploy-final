import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';
import { http } from 'wagmi';
import { CHAINS } from '@/config/chains';

// ═══════════════════════════════════════════════════════════════
// 🔗 AUTO-GENERATED WAGMI CONFIG FROM chains.ts
// ═══════════════════════════════════════════════════════════════
// Bu dosya artık chains.ts'den otomatik türetiliyor.
// Yeni chain eklemek için src/config/chains.ts'e git!
// ═══════════════════════════════════════════════════════════════

// Auto-generate chain definitions from CHAINS config
const viemChains = CHAINS.map(chain => {
  const rpcUrls: string[] = [chain.rpcUrls.primary]
  if (chain.rpcUrls.fallbacks) {
    rpcUrls.push(...chain.rpcUrls.fallbacks)
  }
  
  const rpcConfig: any = {
    default: {
      http: rpcUrls
    }
  }
  
  // Add websocket if available
  if (chain.rpcUrls.websocket) {
    rpcConfig.default.webSocket = [chain.rpcUrls.websocket]
  }
  
  return defineChain({
    id: chain.chainId,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: rpcConfig,
    blockExplorers: {
      default: {
        name: chain.explorerName,
        url: chain.explorerUrl,
      },
    },
    testnet: chain.testnet,
  })
})

// Export individual chains for backward compatibility
export const giwaSepoliaTestnet = viemChains.find(c => c.id === 91342)!
export const arcTestnet = viemChains.find(c => c.id === 5042002)!
export const stableTestnet = viemChains.find(c => c.id === 2201)!
export const baseMainnet = viemChains.find(c => c.id === 8453)!

// Auto-generate transports from CHAINS config
const transports = CHAINS.reduce((acc, chain) => {
  const chainDef = viemChains.find(c => c.id === chain.chainId)!
  
  // Network-specific retry counts
  const retryCount = chain.chainId === 5042002 ? 5 : 3 // ARC needs more retries
  
  acc[chainDef.id] = http(chain.rpcUrls.primary, {
    timeout: 30000, // 30s timeout
    retryCount,
    retryDelay: 1000,
  })
  
  return acc
}, {} as Record<number, ReturnType<typeof http>>)

export const config = getDefaultConfig({
  appName: 'Multi-Chain Contract Deployer',
  projectId: 'c3f4d8e1b5a67890c1d2e3f4a5b6c7d8',
  chains: viemChains as any,
  transports,
  ssr: false, // CRITICAL: Must be false to avoid indexedDB errors during server-side rendering
});
