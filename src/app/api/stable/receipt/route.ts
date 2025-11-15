import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * STABLE NETWORK - RECEIPT POLLING API (CORS FIX)
 * 
 * This API route acts as a server-side proxy to poll transaction receipts
 * from the Stable RPC, avoiding CORS issues that occur when calling directly
 * from the browser.
 * 
 * WHY: Browser → RPC = CORS ❌
 *      Browser → Backend → RPC = No CORS ✅
 */

interface ReceiptRequest {
  txHash: string
  rpcUrl?: string // Optional, defaults to Stable RPC
}

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📡 STABLE RECEIPT API - Server-side RPC call')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const body: ReceiptRequest = await request.json()
    const { txHash, rpcUrl = 'https://rpc.stable.xyz' } = body
    
    if (!txHash) {
      return NextResponse.json(
        { error: 'txHash is required' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Checking receipt for TX:', txHash)
    console.log('📡 RPC URL:', rpcUrl)
    
    // Server-side RPC call - NO CORS!
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionReceipt',
        params: [txHash],
        id: 1
      })
    })
    
    if (!response.ok) {
      console.error('❌ RPC request failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: `RPC request failed: ${response.statusText}` },
        { status: response.status }
      )
    }
    
    const data = await response.json()
    
    if (data.error) {
      console.error('❌ RPC error:', data.error)
      return NextResponse.json(
        { error: data.error.message || 'RPC error' },
        { status: 500 }
      )
    }
    
    // Receipt found or null (still pending)
    if (data.result) {
      console.log('✅ Receipt found!')
      console.log('   - Status:', data.result.status)
      console.log('   - Contract Address:', data.result.contractAddress)
      console.log('   - Block Number:', data.result.blockNumber)
    } else {
      console.log('⏳ Receipt not found yet (transaction pending)')
    }
    
    // Return the receipt (or null if not found)
    return NextResponse.json({
      success: true,
      receipt: data.result
    })
    
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ STABLE RECEIPT API ERROR')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch receipt' 
      },
      { status: 500 }
    )
  }
}
