'use client'
export const dynamic = 'force-dynamic';

import { WalletConnect } from '@/components/WalletConnect';
import { NetworkStats } from '@/components/NetworkStats';
import { DeploymentTerminal } from '@/components/DeploymentTerminal';
import { NetworkSwitcher } from '@/components/NetworkSwitcher';
import { NetworkProvider, useNetwork } from '@/contexts/NetworkContext';
import { useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useAddMiniApp } from "@/hooks/useAddMiniApp";
import { useQuickAuth } from "@/hooks/useQuickAuth";
import { useIsInFarcaster } from "@/hooks/useIsInFarcaster";

function PageContent(): JSX.Element {
  const { currentNetwork, currentNetworkId } = useNetwork();

  return (
    <div className="min-h-screen retro-background p-4 md:p-8" data-network={currentNetworkId}>
      {/* Scanlines effect */}
      <div className="scanlines"></div>
      
      {/* CRT screen glow */}
      <div className="crt-glow"></div>
      
      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center retro-text pt-20">
          {/* Network Title - Dynamic based on selected network */}
          <div className="text-4xl md:text-6xl font-bold mb-2">
            <span className="blink glow-text">█▓▒░</span>
            <span className={`font-black text-7xl tracking-wider ${currentNetworkId === 'ARC' ? 'text-[#E0E0E0]' : currentNetworkId === 'STABLE' ? 'text-emerald-400' : 'text-green-400'}`}> {currentNetwork.displayName} </span>
            <span className="blink glow-text">░▒▓█</span>
          </div>
          
          {/* Terminal info - moved down */}
          <div className="mt-8 space-y-2">
            <div className="text-lg md:text-xl">
              <span className="blink">&gt;&gt;&gt;</span> CONTRACT DEPLOYMENT TERMINAL{' '}
              <span className="blink">&lt;&lt;&lt;</span>
            </div>
            <div className="text-sm opacity-70">
              [ SYSTEM ONLINE - {new Date().toLocaleString()} ]
            </div>
            <div className="text-xs opacity-50 mt-2">
              POWERED BY {currentNetwork.displayName} TECHNOLOGY
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Wallet & Stats */}
          <div className="space-y-6">
            <WalletConnect />
            <NetworkStats />
            
            {/* System Info Panel */}
            <div className="retro-panel p-4 space-y-2">
              <div className="retro-text text-center mb-2">
                <span className="blink text-xs sm:text-sm">╔════════════════╗</span>
              </div>
              <div className="retro-text text-center">
                <span className="text-xs sm:text-sm">║ SYSTEM INFO ║</span>
              </div>
              <div className="retro-text text-center mb-3">
                <span className="blink text-xs sm:text-sm">╚════════════════╝</span>
              </div>
              <div className="space-y-2 text-xs retro-text">
                <p>&gt; NETWORK: {currentNetwork.name.toUpperCase()}</p>
                <p>&gt; CHAIN ID: {currentNetwork.chainId}</p>
                <p>&gt; RPC: {currentNetwork.rpcUrl.replace('https://', '')}</p>
                <p>&gt; EXPLORER: {currentNetwork.explorerUrl.replace('https://', '')}</p>
                {currentNetwork.feeToken && (
                  <>
                    <p className="text-yellow-400">&gt; FEE TOKEN: {currentNetwork.feeToken.symbol} {currentNetwork.feeToken.isNative && '(NATIVE)'}</p>
                    {currentNetwork.feeToken.contractAddress && (
                      <>
                        <p className="text-xs break-all">&gt; USDC CONTRACT:</p>
                        <p className="text-xs break-all ml-2">{currentNetwork.feeToken.contractAddress}</p>
                        <p className="text-xs">&gt; DECIMALS: {currentNetwork.feeToken.decimals}</p>
                      </>
                    )}
                  </>
                )}
                <p className="text-green-400 mt-3 blink">&gt; STATUS: OPERATIONAL</p>
              </div>
            </div>
          </div>

          {/* Right Column - Deployment Terminal */}
          <div className="lg:col-span-2">
            <DeploymentTerminal />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center retro-text text-xs opacity-50 mt-8 pb-4">
          <p className="blink">[ {currentNetwork.displayName} DEPLOYMENT TERMINAL v1.0.0 ]</p>
          <p className="mt-1">BUILT FOR THE FUTURE OF DECENTRALIZED SYSTEMS</p>
        </div>
      </div>
    </div>
  );
}

export default function Page(): JSX.Element {
    const { addMiniApp } = useAddMiniApp();
    const isInFarcaster = useIsInFarcaster()
    useQuickAuth(isInFarcaster)
    useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])
    useEffect(() => {
      const initializeFarcaster = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100))
          
          if (document.readyState !== 'complete') {
            await new Promise<void>(resolve => {
              if (document.readyState === 'complete') {
                resolve()
              } else {
                window.addEventListener('load', () => resolve(), { once: true })
              }

            })
          }

    

          await sdk.actions.ready()
          console.log('Farcaster SDK initialized successfully - app fully loaded')
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error)
          
          setTimeout(async () => {
            try {
              await sdk.actions.ready()
              console.log('Farcaster SDK initialized on retry')
            } catch (retryError) {
              console.error('Farcaster SDK retry failed:', retryError)
            }

          }, 1000)
        }

      }

    

      initializeFarcaster()
    }, [])
  return (
    <NetworkProvider>
      <NetworkSwitcher />
      <PageContent />
    </NetworkProvider>
  );
}
