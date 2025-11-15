'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card } from '@/components/ui/card';

export function WalletConnect(): JSX.Element {

  return (
    <Card className="retro-panel p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="retro-text text-center">
          <span className="blink text-xs sm:text-base">╔══════════════════╗</span>
        </div>
        <div className="retro-text text-center">
          <span className="text-sm sm:text-base">║ WALLET PORT ║</span>
        </div>
        <div className="retro-text text-center mb-2">
          <span className="blink text-xs sm:text-base">╚══════════════════╝</span>
        </div>
        
        <div className="w-full flex justify-center px-2">
          <div className="transform scale-90">
            <ConnectButton 
              showBalance={true}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
