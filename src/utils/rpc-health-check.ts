import type { Hex } from 'viem'

export interface RPCHealthResult {
  url: string
  isHealthy: boolean
  blockNumber?: number
  chainId?: number
  latency?: number
  error?: string
}

/**
 * Tests RPC endpoint health by checking block number and chain ID
 */
export async function testRPCHealth(rpcUrl: string, expectedChainId: number = 91342): Promise<RPCHealthResult> {
  const startTime = Date.now()
  
  try {
    // Test 1: Get block number
    const blockResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    })

    if (!blockResponse.ok) {
      throw new Error(`HTTP ${blockResponse.status}: ${blockResponse.statusText}`)
    }

    const blockData = await blockResponse.json()
    
    if (blockData.error) {
      throw new Error(blockData.error.message || 'RPC error')
    }

    const blockNumber = parseInt(blockData.result as string, 16)

    // Test 2: Get chain ID
    const chainResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId',
        params: [],
        id: 2,
      }),
    })

    const chainData = await chainResponse.json()
    const chainId = parseInt(chainData.result as string, 16)

    const latency = Date.now() - startTime

    // Validate chain ID
    if (chainId !== expectedChainId) {
      return {
        url: rpcUrl,
        isHealthy: false,
        blockNumber,
        chainId,
        latency,
        error: `Wrong chain ID: ${chainId} (expected ${expectedChainId})`,
      }
    }

    return {
      url: rpcUrl,
      isHealthy: true,
      blockNumber,
      chainId,
      latency,
    }
  } catch (error) {
    const latency = Date.now() - startTime
    return {
      url: rpcUrl,
      isHealthy: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Tests multiple RPC endpoints and returns the fastest healthy one
 */
export async function findBestRPC(rpcUrls: string[], expectedChainId: number = 91342): Promise<RPCHealthResult | null> {
  const results = await Promise.all(
    rpcUrls.map(url => testRPCHealth(url, expectedChainId))
  )

  const healthyRPCs = results.filter(r => r.isHealthy)

  if (healthyRPCs.length === 0) {
    console.error('❌ No healthy RPC endpoints found!')
    return null
  }

  // Sort by latency (fastest first)
  healthyRPCs.sort((a, b) => (a.latency || 999) - (b.latency || 999))

  const best = healthyRPCs[0]
  console.log('✅ Best RPC:', best.url, `(${best.latency}ms, block ${best.blockNumber})`)

  return best
}

/**
 * Tests gas estimation on a specific RPC
 */
export async function testGasEstimation(
  rpcUrl: string,
  from: Hex,
  data: Hex
): Promise<{ success: boolean; gasLimit?: bigint; error?: string }> {
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_estimateGas',
        params: [
          {
            from,
            to: null, // Contract deployment
            data,
            // ⚠️ NO gasPrice parameter - this causes "invalid parameters" error!
          },
        ],
        id: 3,
      }),
    })

    const result = await response.json()

    if (result.error) {
      return {
        success: false,
        error: result.error.message || 'Gas estimation failed',
      }
    }

    const gasLimit = BigInt(result.result as string)

    return {
      success: true,
      gasLimit,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Logs RPC health check results to console in a formatted way
 */
export function logRPCHealthResults(results: RPCHealthResult[]): void {
  console.group('🔍 RPC Health Check Results')
  
  results.forEach((result, index) => {
    const status = result.isHealthy ? '✅' : '❌'
    const latency = result.latency ? `${result.latency}ms` : 'N/A'
    const block = result.blockNumber ? `Block ${result.blockNumber}` : ''
    const chain = result.chainId ? `Chain ${result.chainId}` : ''
    
    console.log(`${status} RPC ${index + 1}: ${result.url}`)
    console.log(`   Latency: ${latency} | ${block} | ${chain}`)
    
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })
  
  console.groupEnd()
}
