// Contract ABIs for deployed contracts
export const CONTRACT_ABIS = {
  COUNTER: [
    {
      inputs: [],
      name: 'count',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'increment',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'decrement',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'reset',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const,
  
  STORAGE: [
    {
      inputs: [],
      name: 'get',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: 'x', type: 'uint256' }],
      name: 'set',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const,
  
  TOKEN: [
    {
      inputs: [],
      name: 'totalSupply',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: '', type: 'address' }],
      name: 'balanceOf',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'transfer',
      outputs: [{ name: '', type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const,
  
  NFT: [
    {
      inputs: [],
      name: 'tokenCounter',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: '', type: 'uint256' }],
      name: 'ownerOf',
      outputs: [{ name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ name: 'to', type: 'address' }],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ] as const,
  
  GREETER: [
    {
      inputs: [],
      name: 'visitsToday',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'totalVisits',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'visit',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getVisitsToday',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getTotalVisits',
      outputs: [{ name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }
  ] as const
} as const

export type ContractType = keyof typeof CONTRACT_ABIS

export interface DeployedContract {
  address: string
  type: ContractType
  name: string
  network: string
  networkId: number
  timestamp: number
  txHash: string
}

// Helper to get deployed contracts from localStorage
export function getDeployedContracts(): DeployedContract[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('deployedContracts')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

// Helper to get contracts by network
export function getContractsByNetwork(networkId: number): DeployedContract[] {
  return getDeployedContracts().filter(c => c.networkId === networkId)
}

// Helper to get ABI for a contract type
export function getAbiForContract(type: ContractType) {
  return CONTRACT_ABIS[type]
}
