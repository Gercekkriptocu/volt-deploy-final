'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useNetwork } from '@/contexts/NetworkContext';

interface NetworkStats {
  blockHeight: string;
  totalTransactions: string;
  activeAccounts: string;
  lastUpdate: string;
  avgBlockTime?: string;
}

interface StableNetworkStats {
  latestBlock: string;
  baseFee: string;
  lastUpdate: string;
}

export function NetworkStats(): JSX.Element {
  const [stats, setStats] = useState<NetworkStats>({
    blockHeight: 'LOADING...',
    totalTransactions: 'LOADING...',
    activeAccounts: 'LOADING...',
    lastUpdate: new Date().toISOString(),
  });

  const [stableStats, setStableStats] = useState<StableNetworkStats>({
    latestBlock: 'LOADING...',
    baseFee: 'LOADING...',
    lastUpdate: new Date().toISOString(),
  });

  const { currentNetwork } = useNetwork();

  const fetchBaseStats = async (): Promise<void> => {
    try {
      console.log('📊 Fetching BASE mainnet stats...');
      
      if (!window.ethereum) {
        throw new Error('Wallet not connected');
      }

      // Fetch latest block via RPC
      const blockNumberHex = await window.ethereum.request({
        method: 'eth_blockNumber',
        params: [],
      }) as string;
      
      const blockNumber = parseInt(blockNumberHex, 16);
      console.log('✅ Latest Block:', blockNumber);

      // Fetch Latest Block Details (for gas used)
      const latestBlock = await window.ethereum.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      }) as any;

      console.log('✅ Latest Block Data:', latestBlock);

      // Calculate Gas Used Percentage
      let gasUsedPercent = 'N/A';
      if (latestBlock?.gasUsed && latestBlock?.gasLimit) {
        const gasUsed = parseInt(latestBlock.gasUsed, 16);
        const gasLimit = parseInt(latestBlock.gasLimit, 16);
        const percentage = (gasUsed / gasLimit) * 100;
        gasUsedPercent = `${percentage.toFixed(2)}%`;
        console.log('✅ Gas Used:', gasUsedPercent);
      }

      // Fetch real-time statistics from Blockscout API
      let totalAddresses = 'N/A';
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'base.blockscout.com',
            path: '/api/v2/stats',
            method: 'GET',
            headers: {},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Blockscout API Response:', data);
          
          // Get total addresses
          if (data.total_addresses) {
            const addresses = parseInt(data.total_addresses);
            // Display without formatting
            totalAddresses = addresses.toString();
          }
          
          console.log('✅ Total Addresses:', totalAddresses);
        }
      } catch (apiError) {
        console.warn('⚠️ Could not fetch stats from Blockscout API');
        totalAddresses = 'N/A';
      }

      setStats({
        blockHeight: blockNumber.toString(),
        totalTransactions: totalAddresses, // Store total addresses
        activeAccounts: gasUsedPercent, // Store gas used percentage
        lastUpdate: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Failed to fetch BASE stats:', error);
      setStats({
        blockHeight: 'N/A',
        totalTransactions: 'N/A',
        activeAccounts: 'N/A',
        lastUpdate: new Date().toISOString(),
      });
    }
  };

  const fetchRpcStats = async (): Promise<void> => {
    try {
      console.log(`📊 Fetching RPC stats for ${currentNetwork.name}...`);
      
      if (!window.ethereum) {
        throw new Error('Wallet not connected');
      }

      // 1. Fetch Latest Block Number
      const blockNumberHex = await window.ethereum.request({
        method: 'eth_blockNumber',
        params: [],
      }) as string;
      
      const blockNumber = parseInt(blockNumberHex, 16);
      console.log('✅ Latest Block:', blockNumber);

      // 2. Fetch Latest Block Details (for base fee)
      const latestBlock = await window.ethereum.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      }) as any;

      console.log('✅ Latest Block Data:', latestBlock);

      // Extract base fee and convert from Wei to Gwei
      let baseFeeGwei = 'N/A';
      if (latestBlock?.baseFeePerGas) {
        const baseFeeWei = parseInt(latestBlock.baseFeePerGas, 16);
        const baseFeeInGwei = baseFeeWei / 1e9;
        // Remove trailing zeros
        baseFeeGwei = `${parseFloat(baseFeeInGwei.toFixed(2))} Gwei`;
        console.log('✅ Base Fee:', baseFeeGwei);
      }

      setStableStats({
        latestBlock: blockNumber.toString(),
        baseFee: baseFeeGwei,
        lastUpdate: new Date().toISOString(),
      });

    } catch (error) {
      console.error(`❌ Failed to fetch ${currentNetwork.name} stats:`, error);
      setStableStats({
        latestBlock: 'N/A',
        baseFee: 'N/A',
        lastUpdate: new Date().toISOString(),
      });
    }
  };

  const fetchArcStats = async (): Promise<void> => {
    try {
      console.log('📊 Fetching ARC Network stats...');
      
      if (!window.ethereum) {
        throw new Error('Wallet not connected');
      }

      // 1. Fetch Latest Block Number
      const blockNumberHex = await window.ethereum.request({
        method: 'eth_blockNumber',
        params: [],
      }) as string;
      
      const blockNumber = parseInt(blockNumberHex, 16);
      console.log('✅ Latest Block:', blockNumber);

      // 2. Fetch Latest Block Details (for base fee)
      const latestBlock = await window.ethereum.request({
        method: 'eth_getBlockByNumber',
        params: ['latest', false],
      }) as any;

      console.log('✅ Latest Block Data:', latestBlock);

      // Extract base fee and convert from Wei to Gwei
      let baseFeeGwei = 'N/A';
      if (latestBlock?.baseFeePerGas) {
        const baseFeeWei = parseInt(latestBlock.baseFeePerGas, 16);
        const baseFeeInGwei = baseFeeWei / 1e9;
        baseFeeGwei = `${parseFloat(baseFeeInGwei.toFixed(4))} Gwei`;
        console.log('✅ Base Fee:', baseFeeGwei);
      }

      // 3. Try to get transaction count from explorer API
      let totalTx = 'N/A';
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'testnet.arcscan.app',
            path: '/api/v2/stats',
            method: 'GET',
            headers: {},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          totalTx = data.total_transactions || 'N/A';
          console.log('✅ Total TX from API:', totalTx);
        }
      } catch (apiError) {
        console.warn('⚠️ Could not fetch total transactions from API, using block-based estimate');
        // Fallback: estimate transactions based on blocks
        totalTx = (blockNumber * 10).toString();
      }

      setStats({
        blockHeight: blockNumber.toString(),
        totalTransactions: totalTx,
        activeAccounts: baseFeeGwei, // Store base fee in activeAccounts field
        lastUpdate: new Date().toISOString(),
      });

    } catch (error) {
      console.error('❌ Failed to fetch ARC stats:', error);
      setStats({
        blockHeight: 'N/A',
        totalTransactions: 'N/A',
        activeAccounts: 'N/A',
        lastUpdate: new Date().toISOString(),
      });
    }
  };

  const fetchGiwaStats = async (): Promise<void> => {
    try {
      console.log('📊 Fetching GIWA Network stats...');
      
      if (!window.ethereum) {
        throw new Error('Wallet not connected');
      }

      // 1. Fetch Latest Block Number via RPC
      const blockNumberHex = await window.ethereum.request({
        method: 'eth_blockNumber',
        params: [],
      }) as string;
      
      const blockNumber = parseInt(blockNumberHex, 16);
      console.log('✅ Latest Block:', blockNumber);

      // 2. Fetch real-time transaction data from GIWA Explorer API
      let avgBlockTime = 'N/A';
      let txCount24h = 'N/A';
      
      try {
        const response = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            protocol: 'https',
            origin: 'sepolia-explorer.giwa.io',
            path: '/api/v2/stats',
            method: 'GET',
            headers: {},
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ GIWA API Response:', data);
          
          // Get average block time
          if (data.average_block_time) {
            const blockTimeMs = parseFloat(data.average_block_time);
            const blockTimeSec = (blockTimeMs / 1000).toFixed(2);
            avgBlockTime = blockTimeSec;
          }
          
          // Get 24h transaction count if available
          if (data.transactions_today) {
            const txToday = parseInt(data.transactions_today);
            txCount24h = txToday >= 1000 ? `${(txToday / 1000).toFixed(1)}K` : txToday.toString();
          }
          
          console.log('✅ Avg Block Time from GIWA API:', avgBlockTime);
          console.log('✅ 24H TX from GIWA API:', txCount24h);
        }
      } catch (apiError) {
        console.warn('⚠️ Could not fetch GIWA transaction data from API, using estimate');
        avgBlockTime = 'N/A';
        txCount24h = 'N/A';
      }

      setStats({
        blockHeight: blockNumber.toString(),
        totalTransactions: avgBlockTime, // Store avg block time
        activeAccounts: txCount24h, // Store 24h transaction count
        lastUpdate: new Date().toISOString(),
        avgBlockTime: avgBlockTime,
      });

    } catch (error) {
      console.error('❌ Failed to fetch GIWA stats:', error);
      setStats({
        blockHeight: 'N/A',
        totalTransactions: 'N/A',
        activeAccounts: 'N/A',
        lastUpdate: new Date().toISOString(),
      });
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      console.log(`📊 Fetching stats for ${currentNetwork.name}...`);
      
      // STABLE NETWORK: Use direct RPC calls (no public API)
      if (currentNetwork.chainId === 2201) {
        await fetchRpcStats();
        return;
      }
      
      // BASE NETWORK: Use RPC for block + estimate transactions
      if (currentNetwork.chainId === 8453) {
        await fetchBaseStats();
        return;
      }
      
      // ARC NETWORK: Use RPC for block + base fee + API for total transactions
      if (currentNetwork.chainId === 5042002) {
        await fetchArcStats();
        return;
      }
      
      // GIWA NETWORK: Use RPC for block + API for transaction data
      if (currentNetwork.chainId === 91342) {
        await fetchGiwaStats();
        return;
      }
      
      // OTHER NETWORKS: Use explorer API via proxy
      const explorerUrl = new URL(currentNetwork.explorerApiUrl);
      
      const response = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: explorerUrl.protocol.replace(':', ''),
          origin: explorerUrl.host,
          path: explorerUrl.pathname,
          method: 'GET',
          headers: {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Stats fetched:', data);
        setStats({
          blockHeight: data.total_blocks || 'N/A',
          totalTransactions: data.total_transactions || 'N/A',
          activeAccounts: data.total_addresses || 'N/A',
          lastUpdate: new Date().toISOString(),
        });
      } else {
        console.warn('⚠️ Stats API returned non-ok status');
      }
    } catch (error) {
      console.error('❌ Failed to fetch network stats:', error);
      if (currentNetwork.chainId !== 2201 && currentNetwork.chainId !== 8453 && currentNetwork.chainId !== 5042002 && currentNetwork.chainId !== 91342) {
        setStats({
          blockHeight: 'N/A',
          totalTransactions: 'N/A',
          activeAccounts: 'N/A',
          lastUpdate: new Date().toISOString(),
        });
      }
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Update every 10 seconds
    return (): void => clearInterval(interval);
  }, [currentNetwork]);

  // Render Stable Network stats (simplified format - RPC only)
  if (currentNetwork.chainId === 2201) {
    return (
      <Card className="retro-panel p-4 space-y-2">
        <div className="retro-text text-center mb-4">
          <span className="blink">╔══════════════════╗</span>
        </div>
        <div className="retro-text text-center mb-2">
          <span className="text-sm">║ NETWORK - {currentNetwork.id} ║</span>
        </div>
        <div className="retro-text text-center mb-4">
          <span className="blink">╚══════════════════╝</span>
        </div>
        
        <div className="space-y-3 font-mono">
          <div className="flex justify-between items-center">
            <span className="retro-text">&gt; LATEST BLOCK:</span>
            <span className="retro-text-highlight">{stableStats.latestBlock}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="retro-text">&gt; BASE FEE:</span>
            <span className="retro-text-highlight">{stableStats.baseFee}</span>
          </div>
          
          <div className="flex justify-between items-center text-xs opacity-60">
            <span className="retro-text">&gt; LAST UPDATE:</span>
            <span className="retro-text">
              {new Date(stableStats.lastUpdate).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </Card>
    );
  }

  // Render other networks stats (default format with all stats)
  return (
    <Card className="retro-panel p-4 space-y-2">
      <div className="retro-text text-center mb-4">
        <span className="blink">╔══════════════════╗</span>
      </div>
      <div className="retro-text text-center mb-2">
        <span className="text-sm">║ NETWORK - {currentNetwork.id} ║</span>
      </div>
      <div className="retro-text text-center mb-4">
        <span className="blink">╚══════════════════╝</span>
      </div>
      
      <div className="space-y-3 font-mono">
        <div className="flex justify-between items-center">
          <span className="retro-text">&gt; BLOCK HEIGHT:</span>
          <span className="retro-text-highlight">{stats.blockHeight}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="retro-text">&gt; {currentNetwork.chainId === 8453 ? 'TOTAL ADDRESSES:' : currentNetwork.chainId === 91342 ? 'AVG BLOCK TIME:' : 'TOTAL TX:'}</span>
          <span className="retro-text-highlight">{currentNetwork.chainId === 91342 && stats.avgBlockTime ? `${stats.avgBlockTime}s` : stats.totalTransactions}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="retro-text">&gt; {currentNetwork.chainId === 8453 ? 'GAS USED:' : currentNetwork.chainId === 5042002 ? 'GAS TRACKER:' : currentNetwork.chainId === 91342 ? 'TX 24H:' : 'AVG TPS:'}</span>
          <span className="retro-text-highlight">{stats.activeAccounts}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs opacity-60">
          <span className="retro-text">&gt; LAST UPDATE:</span>
          <span className="retro-text">
            {new Date(stats.lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </Card>
  );
}
