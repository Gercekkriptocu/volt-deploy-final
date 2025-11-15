import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  try {
    console.log('📊 Fetching Stable network stats...');
    
    // Approach 1: Blockscout Stats API - THE CORRECT ENDPOINT
    console.log('🔍 Trying Blockscout stats API...');
    const statsEndpoints = [
      'https://testnet.stablescan.xyz/api?module=stats&action=totaltx',
      'https://testnet.stablescan.xyz/api?module=stats&action=ethsupply',
    ];
    
    for (const endpoint of statsEndpoints) {
      try {
        console.log('🔍 Trying:', endpoint);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Stats API response:', JSON.stringify(data));
          
          // Blockscout returns: { status: "1", message: "OK", result: "5440000" }
          if (data.result) {
            const txCount = parseInt(data.result);
            console.log('✅ Found transactions from stats API:', txCount);
            
            // Format as M if over 1 million
            let formatted = String(txCount);
            if (txCount >= 1000000) {
              formatted = (txCount / 1000000).toFixed(2) + 'M';
            } else if (txCount >= 1000) {
              formatted = (txCount / 1000).toFixed(1) + 'K';
            }
            
            return NextResponse.json({
              success: true,
              transactions: formatted,
              method: 'blockscout_stats_api',
            });
          }
        }
      } catch (e) {
        console.log(`⚠️ Stats endpoint ${endpoint} failed:`, e);
      }
    }
    
    // Approach 2: Try Stablescan proxy API (Etherscan-like)
    console.log('🔍 Trying Stablescan proxy API...');
    const proxyEndpoints = [
      'https://testnet.stablescan.xyz/api?module=proxy&action=eth_blockNumber',
      'https://testnet.stablescan.xyz/api?module=stats&action=ethsupply',
    ];
    
    for (const endpoint of proxyEndpoints) {
      try {
        console.log('🔍 Trying:', endpoint);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Proxy API response:', JSON.stringify(data).substring(0, 500));
          
          if (data.result) {
            console.log('✅ Proxy API working, but need transaction count...');
          }
        }
      } catch (e) {
        console.log(`⚠️ Proxy endpoint ${endpoint} failed:`, e);
      }
    }
    
    // Approach 3: RPC Direct Call (Server-side, no CORS!)
    console.log('🔍 Trying RPC direct call from backend...');
    try {
      const STABLE_TESTNET_RPC = 'https://rpc.testnet.stable.xyz';
      
      // Get latest block number first
      const blockResponse = await fetch(STABLE_TESTNET_RPC, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });
      
      if (blockResponse.ok) {
        const blockData = await blockResponse.json();
        const latestBlockNum = parseInt(blockData.result, 16);
        console.log('✅ Latest block from RPC:', latestBlockNum);
        
        // Sample last 20 blocks to estimate tx count
        let totalTxInSample = 0;
        const sampleSize = 20;
        
        for (let i = 0; i < sampleSize; i++) {
          const blockNum = latestBlockNum - i;
          const blockHex = '0x' + blockNum.toString(16);
          
          const blockDetailsResponse = await fetch(STABLE_TESTNET_RPC, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBlockByNumber',
              params: [blockHex, false],
              id: 1,
            }),
          });
          
          if (blockDetailsResponse.ok) {
            const blockDetails = await blockDetailsResponse.json();
            if (blockDetails.result?.transactions) {
              totalTxInSample += blockDetails.result.transactions.length;
            }
          }
        }
        
        // Calculate average and estimate total
        const avgTxPerBlock = totalTxInSample / sampleSize;
        const estimatedTotalTx = Math.floor(avgTxPerBlock * latestBlockNum);
        
        console.log('✅ RPC Estimation:', {
          avgTxPerBlock,
          estimatedTotalTx,
          latestBlock: latestBlockNum,
        });
        
        // Format the number
        let formatted = String(estimatedTotalTx);
        if (estimatedTotalTx >= 1000000) {
          formatted = (estimatedTotalTx / 1000000).toFixed(2) + 'M';
        } else if (estimatedTotalTx >= 1000) {
          formatted = (estimatedTotalTx / 1000).toFixed(1) + 'K';
        }
        
        return NextResponse.json({
          success: true,
          transactions: formatted,
          method: 'rpc_estimation',
        });
      }
    } catch (rpcError) {
      console.log('⚠️ RPC direct call failed:', rpcError);
    }
    
    // Approach 3: HTML scraping as fallback
    console.log('📄 Trying HTML scraping...');
    try {
      const htmlResponse = await fetch('https://testnet.stablescan.xyz/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (htmlResponse.ok) {
        const html = await htmlResponse.text();
        console.log('✅ Fetched HTML, length:', html.length);
        
        // Look for transaction count patterns - more comprehensive
        const patterns = [
          // X.XXM format with Transactions
          /([\d,]+\.?\d*)\s*M\s+Transactions/gi,
          /Transactions\s*[:\-]?\s*([\d,]+\.?\d*)\s*M/gi,
          // Just numbers with M
          /([\d,]+\.?\d*M)/gi,
          // Numbers with commas: 5,440,000
          /Transactions?\s*[:\-]?\s*([\d,]+)/gi,
          // In data attributes
          /data-[^=]*transactions?[^=]*=["']?([\d,]+\.?\d*M?)["']?/gi,
          // JSON structures
          /"(?:total_)?transactions?":\s*"?([\d,]+\.?\d*M?)"?/gi,
        ];
        
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i];
          const matches = html.matchAll(pattern);
          
          for (const match of matches) {
            if (match[1]) {
              const value = match[1];
              console.log(`✅ Found via HTML scraping (pattern ${i+1}):`, value);
              
              // If it already has M/K suffix, use as is
              if (value.includes('M') || value.includes('K')) {
                return NextResponse.json({
                  success: true,
                  transactions: value.replace(/,/g, ''),
                  method: 'html_scraping',
                });
              }
              
              // Otherwise parse and format
              const num = parseInt(value.replace(/,/g, ''));
              if (num > 1000) {  // Reasonable transaction count
                let formatted = String(num);
                if (num >= 1000000) {
                  formatted = (num / 1000000).toFixed(2) + 'M';
                } else if (num >= 1000) {
                  formatted = (num / 1000).toFixed(1) + 'K';
                }
                
                return NextResponse.json({
                  success: true,
                  transactions: formatted,
                  method: 'html_scraping',
                });
              }
            }
          }
        }
        
        // Log first 1000 chars for debugging
        console.log('📄 HTML sample:', html.substring(0, 1000));
      }
    } catch (htmlError) {
      console.log('⚠️ HTML scraping failed:', htmlError);
    }
    
    // If all else fails
    console.warn('⚠️ All methods failed');
    return NextResponse.json({
      success: false,
      transactions: 'N/A',
    });

  } catch (error) {
    console.error('❌ Error in stable-stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        transactions: 'N/A'
      },
      { status: 500 }
    );
  }
}
