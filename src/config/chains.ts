// ═══════════════════════════════════════════════════════════════
// 🔗 MERKEZI CHAIN YÖNETİMİ - Tek Dosyadan Tüm Chain'leri Yönet
// ═══════════════════════════════════════════════════════════════
// Bu dosyaya yeni chain eklemek için sadece CHAINS array'ine yeni obje ekle!
// wagmi-config.ts ve networks.ts otomatik olarak buradan türetilir.
// ═══════════════════════════════════════════════════════════════

export interface ChainConfig {
  // Basic Chain Info
  id: string
  name: string
  displayName: string
  chainId: number
  
  // RPC Configuration
  rpcUrls: {
    primary: string
    fallbacks?: string[]
    websocket?: string
  }
  
  // Explorer
  explorerUrl: string
  explorerApiUrl: string
  explorerName: string
  
  // Native Currency
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  
  // Fee Token (if different from native)
  feeToken?: {
    name: string
    symbol: string
    contractAddress?: string
    decimals?: number
    isNative?: boolean
  }
  
  // UI Styling
  color: string
  ascii: string
  
  // Network Type
  testnet: boolean
  
  // Faucet (for testnets)
  faucet?: string
}

// ═══════════════════════════════════════════════════════════════
// 🌐 CHAIN DEFINITIONS - YENİ CHAIN EKLEMEK İÇİN BURAYA EKLE!
// ═══════════════════════════════════════════════════════════════

export const CHAINS: ChainConfig[] = [
  // ─────────────────────────────────────────────────────────────
  // 🔵 ARC NETWORK - Testnet (DEFAULT)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'ARC',
    name: 'ARC Testnet',
    displayName: 'ARC NETWORK',
    chainId: 5042002,
    
    rpcUrls: {
      primary: 'https://rpc.testnet.arc.network',
      fallbacks: [
        'https://rpc.blockdaemon.testnet.arc.network',
        'https://rpc.drpc.testnet.arc.network',
        'https://rpc.quicknode.testnet.arc.network'
      ],
    },
    
    explorerUrl: 'https://testnet.arcscan.app',
    explorerApiUrl: 'https://testnet.arcscan.app/api/v2/stats',
    explorerName: 'ARC Scan',
    
    nativeCurrency: {
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 18
    },
    
    feeToken: {
      name: 'USD Coin',
      symbol: 'USDC',
      contractAddress: '0x3600000000000000000000000000000000000000',
      decimals: 6,
      isNative: true // USDC is native gas token on ARC
    },
    
    color: 'blue',
    ascii: '█▓▒░ ARC NETWORK ░▒▓█',
    testnet: true,
    faucet: 'https://faucet.testnet.arc.network'
  },
  
  // ─────────────────────────────────────────────────────────────
  // 🟢 GIWA L2 (Upbit L2) - Sepolia Testnet
  // ─────────────────────────────────────────────────────────────
  {
    id: 'GIWA',
    name: 'Giwa Sepolia Testnet',
    displayName: 'GIWA L2',
    chainId: 91342,
    
    rpcUrls: {
      primary: 'https://sepolia-rpc.giwa.io',
      fallbacks: [
        'https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492',
        'https://rpc.giwa.sepolia.ethpandaops.io'
      ],
    },
    
    explorerUrl: 'https://sepolia-explorer.giwa.io',
    explorerApiUrl: 'https://sepolia-explorer.giwa.io/api/v2/stats',
    explorerName: 'Giwa Explorer',
    
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    
    color: 'green',
    ascii: '█▓▒░ GIWA L2 ░▒▓█',
    testnet: true,
    faucet: 'https://faucet.lambda256.io'
  },
  
  // ─────────────────────────────────────────────────────────────
  // 🟢 STABLE TESTNET - Tether USD Native
  // ─────────────────────────────────────────────────────────────
  {
    id: 'STABLE',
    name: 'Stable Testnet',
    displayName: 'STABLE',
    chainId: 2201,
    
    rpcUrls: {
      primary: 'https://rpc.stable.xyz',
      fallbacks: [], // No official fallbacks; add community/public if available (e.g., via providers like dRPC)
      websocket: 'wss://rpc.stable.xyz',
    },
    
    explorerUrl: 'https://testnet.stablescan.xyz',
    explorerApiUrl: 'https://testnet.stablescan.xyz/api', // Stablescan uses Etherscan-compatible API (/api?module=stats&action=...)
    explorerName: 'Stable Scan',
    
    nativeCurrency: {
      name: 'Tether USD',
      symbol: 'gUSDT',
      decimals: 18
    },
    
    feeToken: {
      name: 'Tether USD',
      symbol: 'gUSDT',
      decimals: 18,
      isNative: true // gUSDT is native gas token on Stable
    },
    
    color: 'darkgreen',
    ascii: '█▓▒░ STABLE ░▒▓█',
    testnet: true,
    faucet: 'https://faucet.stable.xyz'
  },
  
  // ─────────────────────────────────────────────────────────────
  // 🔵 BASE MAINNET - Ethereum L2
  // ─────────────────────────────────────────────────────────────
  {
    id: 'BASE',
    name: 'Base',
    displayName: 'BASE MAINNET',
    chainId: 8453,
    
    rpcUrls: {
      primary: 'https://mainnet.base.org',
      fallbacks: [
        'https://base.drpc.org',
        'https://base.gateway.tenderly.co',
        'https://1rpc.io/base'
      ],
      websocket: 'wss://base.gateway.tenderly.co'
    },
    
    explorerUrl: 'https://basescan.org',
    explorerApiUrl: 'https://api.basescan.org/api',
    explorerName: 'BaseScan',
    
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    
    color: 'cyan',
    ascii: '█▓▒░ BASE MAINNET ░▒▓█',
    testnet: false
  },
  
  // ═══════════════════════════════════════════════════════════════
  // 🚀 YENİ CHAIN EKLEMEK İÇİN:
  // ═══════════════════════════════════════════════════════════════
  // 1. Yukarıdaki formatta yeni bir obje ekle
  // 2. chainId'yi unique yap
  // 3. Tüm RPC URL'leri, explorer URL'leri ekle
  // 4. Native currency bilgilerini gir
  // 5. Eğer fee token farklıysa feeToken objesi ekle
  // 6. Testnet ise faucet linki ekle
  // 7. Hepsi bu! wagmi-config.ts ve networks.ts otomatik güncellenir
  // ═══════════════════════════════════════════════════════════════
]

// ═══════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Chain ID'ye göre chain bilgisi getir
export function getChainById(chainId: number): ChainConfig | undefined {
  return CHAINS.find(chain => chain.chainId === chainId)
}

// Chain kısa koduna göre chain bilgisi getir (örn: 'GIWA', 'ARC')
export function getChainByShortName(id: string): ChainConfig | undefined {
  return CHAINS.find(chain => chain.id === id)
}

// Tüm chain ID'leri listele
export function getAllChainIds(): number[] {
  return CHAINS.map(chain => chain.chainId)
}

// Testnet chain'leri filtrele
export function getTestnetChains(): ChainConfig[] {
  return CHAINS.filter(chain => chain.testnet)
}

// Mainnet chain'leri filtrele
export function getMainnetChains(): ChainConfig[] {
  return CHAINS.filter(chain => !chain.testnet)
}

// Chain'in desteklenen bir chain olup olmadığını kontrol et
export function isSupportedChain(chainId: number): boolean {
  return CHAINS.some(chain => chain.chainId === chainId)
}

// Chain'i MetaMask'e eklemek için gereken parametreleri oluştur
export function getAddChainParameters(chainId: number): {
  chainId: string
  chainName: string
  rpcUrls: string[]
  blockExplorerUrls: string[]
  nativeCurrency: { name: string; symbol: string; decimals: number }
} | null {
  const chain = getChainById(chainId)
  if (!chain) return null
  
  const rpcUrls = [chain.rpcUrls.primary]
  if (chain.rpcUrls.fallbacks) {
    rpcUrls.push(...chain.rpcUrls.fallbacks)
  }
  
  return {
    chainId: '0x' + chainId.toString(16),
    chainName: chain.name,
    rpcUrls,
    blockExplorerUrls: [chain.explorerUrl],
    nativeCurrency: chain.nativeCurrency
  }
}

// Chain'in faucet linki var mı kontrol et
export function getFaucetUrl(chainId: number): string | null {
  const chain = getChainById(chainId)
  return chain?.faucet || null
}

// Network display name'i al (UI'da gösterilecek kısa isim)
export function getNetworkDisplayName(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.displayName || `Chain ${chainId}`
}

// Network rengini al (UI styling için)
export function getNetworkColor(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.color || 'gray'
}

// ASCII art banner'ı al
export function getNetworkAsciiArt(chainId: number): string {
  const chain = getChainById(chainId)
  return chain?.ascii || '█▓▒░ NETWORK ░▒▓█'
}
