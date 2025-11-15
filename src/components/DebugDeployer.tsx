'use client';

import { useState } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { encodeDeployData, parseUnits } from 'viem';
import type { Hex, Abi } from 'viem';

// Pre-compiled contract bytecodes from templates
const SIMPLE_TOKEN_BYTECODE = '0x608060405234801561001057600080fd5b506040516107e53803806107e58339818101604052810190610032919061031a565b82600090816100419190610586565b5080600190816100519190610586565b50670de0b6b3a76400008261006691906106b3565b60028190555060025460036000336001600160a01b03168152602001908152602001600020819055505050506106f5565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f8301126100d8576100d76100c4565b5b81516100e88482602086016101e5565b91505092915050565b6000819050919050565b610104816100f1565b811461010f57600080fd5b50565b600081519050610121816100fb565b92915050565b6000806000606084860312156101405761013f6100bf565b5b600084015167ffffffffffffffff81111561015e5761015d6100c4565b5b61016a868287016100c9565b935050602084015167ffffffffffffffff81111561018b5761018a6100c4565b5b610197868287016100c9565b92505060406101a886828701610112565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806101fa57607f821691505b60208210810361020d5761020c6101b3565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026102757fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610238565b61027f8683610238565b95508019841693508086168417925050509392505050565b6000819050919050565b60006102bc6102b76102b2846100f1565b610297565b6100f1565b9050919050565b6000819050919050565b6102d6836102a1565b6102ea6102e2826102c3565b848454610245565b825550505050565b600090565b6102ff6102f2565b61030a8184846102cd565b505050565b5b8181101561032e576103236000826102f7565b600181019050610310565b5050565b601f8211156103735761034481610213565b61034d84610228565b8101602085101561035c578190505b61037061036885610228565b83018261030f565b50505b505050565b600082821c905092915050565b600061039660001984600802610378565b1980831691505092915050565b60006103af8383610385565b9150826002028217905092915050565b6103c8826103e6565b67ffffffffffffffff8111156103e1576103e06100c4565b5b6103eb82546101e2565b6103f6828285610332565b600060209050601f8311600181146104295760008415610417578287015190505b61042185826103a3565b865550610489565b601f19841661043786610213565b60005b8281101561045f5784890151825560018201915060208501945060208101905061043a565b8683101561047c5784890151610478601f891682610385565b8355505b6001600288020188555050505b505050505050565b610489816100f156fea26469706673582212208c9d5e4f7a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b264736f6c63430008140033' as Hex;

const SIMPLE_NFT_BYTECODE = '0x608060405234801561001057600080fd5b506040516106a03803806106a08339818101604052810190610032919061025a565b8181600190816100429190610506565b5080600290816100529190610506565b505050505061060e565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f8301126100a05761009f61005b565b5b81516100b0848260208601610147565b91505092915050565b6000604051905090565b600067ffffffffffffffff8211156100de576100dd610060565b5b6100e782610189565b9050602081019050919050565b60005b838110156101125780820151818401526020810190506100f7565b60008484015250505050565b600061013161012b846100c3565b6100b9565b90508281526020810184848401111561014d5761014c610056565b5b6101588482856100f4565b509392505050565b600082601f8301126101755761017461005b565b5b815161018584826020860161011e565b91505092915050565b6000604082840312156101a4576101a3610051565b5b6101ae60406100b9565b9050600082015167ffffffffffffffff8111156101ce576101cd610056565b5b6101da84828501610089565b600083015250602082015167ffffffffffffffff8111156101fe576101fd610056565b5b61020a84828501610160565b60208301525092915050565b61021f81610225565b811461022a57600080fd5b50565b60008151905061023c81610216565b92915050565b60006040828403121561025857610257610051565b5b600061026684828501610160565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102b657607f821691505b6020821081036102c9576102c861026f565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103317fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102f4565b61033b86836102f4565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061038261037d61037884610353565b61035d565b610353565b9050919050565b6000819050919050565b61039c83610367565b6103b06103a882610389565b848454610301565b825550505050565b600090565b6103c56103b8565b6103d0818484610393565b505050565b5b818110156103f4576103e96000826103bd565b6001810190506103d6565b5050565b601f82111561043957610 40a816102cf565b610413846102e4565b81016020851015610422578190505b61043661042e856102e4565b8301826103d5565b50505b505050565b600082821c905092915050565b600061045c6000198460080261043e565b1980831691505092915050565b6000610475838361044b565b9150826002028217905092915050565b61048e82610496565b67ffffffffffffffff8111156104a7576104a6610060565b5b6104b1825461029e565b6104bc8282856103f8565b600060209050601f8311600181146104ef57600084156104dd578287015190505b6104e78582610469565b86555061054f565b601f1984166104fd866102cf565b60005b8281101561052557848901518255600182019150602085019450602081019050610500565b86831015610542578489015161053e601f89168261044b565b8355505b6001600288020188555050505b505050505050565b61056081610353565b82525050565b600060208201905061057b6000830184610557565b92915050565b6000819050919050565b600061059c61059761059284610581565b61035d565b610353565b9050919050565b6105ac8161058b565b82525050565b60006020820190506105c760008301846105a3565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006105f8826105cd565b9050919050565b610608816105ed565b82525050565b600060208201905061062360008301846105ff565b92915050565b60c3806106366000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c806306fdde031460415780636352211e14605b578063a0712d6814608a575b600080fd5b60476097565b604051605291906100ce565b60405180910390f35b606e6066366004610140565b6000908152602081905260409020546001600160a01b03165b6040516001600160a01b039091168152602001605256fea2646970667358221220f9e7d8c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a064736f6c63430008140033' as Hex;

const SIMPLE_TOKEN_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_symbol', type: 'string', internalType: 'string' },
      { name: '_totalSupply', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  }
] as Abi;

const SIMPLE_NFT_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_name', type: 'string', internalType: 'string' },
      { name: '_symbol', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'nonpayable'
  }
] as Abi;

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export function DebugDeployer(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [contractType, setContractType] = useState<string>('TOKEN');
  const [deploying, setDeploying] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deployedAddress, setDeployedAddress] = useState<string>('');
  
  const [tokenName, setTokenName] = useState<string>('Test Token');
  const [tokenSymbol, setTokenSymbol] = useState<string>('TEST');
  const [tokenSupply, setTokenSupply] = useState<string>('1000000');
  
  const [nftName, setNftName] = useState<string>('Test NFT');
  const [nftSymbol, setNftSymbol] = useState<string>('TNFT');

  const addLog = (message: string, type: LogEntry['type'] = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev: LogEntry[]) => [...prev, { time: timestamp, message, type }]);
    console.log(`[${timestamp}]`, message);
  };

  const deployToken = async (): Promise<void> => {
    try {
      setDeploying(true);
      setLogs([]);
      setDeployedAddress('');
      
      addLog('🚀 Starting ERC20 deployment...', 'info');
      addLog(`Name: ${tokenName}, Symbol: ${tokenSymbol}, Supply: ${tokenSupply}`, 'info');
      
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      addLog(`Connected wallet: ${address}`, 'success');
      
      const balance = await publicClient.getBalance({ address });
      addLog(`Wallet balance: ${(Number(balance) / 1e18).toFixed(4)} ETH`, 'info');
      
      if (balance === BigInt(0)) {
        throw new Error('Insufficient balance');
      }
      
      const chainId = await publicClient.getChainId();
      addLog(`Chain ID: ${chainId}`, 'info');
      
      const gasPrice = await publicClient.getGasPrice();
      addLog(`Gas Price: ${gasPrice.toString()} wei`, 'info');
      
      addLog('Preparing transaction...', 'info');
      
      // CRITICAL: Convert supply to wei using parseUnits
      // User enters "1000000" → becomes "1000000000000000000000000" (1M with 18 decimals)
      const supplyInWei = parseUnits(tokenSupply, 18);
      addLog(`Supply in wei: ${supplyInWei.toString()}`, 'info');
      
      const deployData = encodeDeployData({
        abi: SIMPLE_TOKEN_ABI,
        bytecode: SIMPLE_TOKEN_BYTECODE,
        args: [tokenName, tokenSymbol, supplyInWei]
      });
      
      addLog(`Deploy data length: ${deployData.length} characters`, 'info');
      
      addLog('Sending transaction (skipping gas estimation)...', 'warning');
      
      const hash = await walletClient.sendTransaction({
        account: address,
        to: null,
        data: deployData,
        gas: BigInt(5000000),
        gasPrice: gasPrice
      });
      
      addLog(`Transaction sent: ${hash}`, 'success');
      addLog('Waiting for confirmation...', 'info');
      
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 120000
      });
      
      if (receipt.status === 'success') {
        addLog('✅ Contract deployed successfully!', 'success');
        addLog(`Contract address: ${receipt.contractAddress || 'N/A'}`, 'success');
        addLog(`Gas used: ${receipt.gasUsed.toString()}`, 'info');
        setDeployedAddress(receipt.contractAddress || '');
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      addLog(`❌ Error: ${error.shortMessage || error.message}`, 'error');
      console.error('Full error:', err);
    } finally {
      setDeploying(false);
    }
  };

  const deployNFT = async (): Promise<void> => {
    try {
      setDeploying(true);
      setLogs([]);
      setDeployedAddress('');
      
      addLog('🚀 Starting ERC721 deployment...', 'info');
      addLog(`Name: ${nftName}, Symbol: ${nftSymbol}`, 'info');
      
      if (!walletClient || !publicClient) {
        throw new Error('Wallet not connected');
      }
      
      if (!address) {
        throw new Error('Address not found');
      }
      
      addLog(`Connected wallet: ${address}`, 'success');
      
      const balance = await publicClient.getBalance({ address });
      addLog(`Wallet balance: ${(Number(balance) / 1e18).toFixed(4)} ETH`, 'info');
      
      if (balance === BigInt(0)) {
        throw new Error('Insufficient balance');
      }
      
      const chainId = await publicClient.getChainId();
      addLog(`Chain ID: ${chainId}`, 'info');
      
      const gasPrice = await publicClient.getGasPrice();
      addLog(`Gas Price: ${gasPrice.toString()} wei`, 'info');
      
      addLog('Preparing transaction...', 'info');
      
      const deployData = encodeDeployData({
        abi: SIMPLE_NFT_ABI,
        bytecode: SIMPLE_NFT_BYTECODE,
        args: [nftName, nftSymbol]
      });
      
      addLog(`Deploy data length: ${deployData.length} characters`, 'info');
      addLog('Sending transaction (skipping gas estimation)...', 'warning');
      
      const hash = await walletClient.sendTransaction({
        account: address,
        to: null,
        data: deployData,
        gas: BigInt(3000000),
        gasPrice: gasPrice
      });
      
      addLog(`Transaction sent: ${hash}`, 'success');
      addLog('Waiting for confirmation...', 'info');
      
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        confirmations: 1,
        timeout: 120000
      });
      
      if (receipt.status === 'success') {
        addLog('✅ Contract deployed successfully!', 'success');
        addLog(`Contract address: ${receipt.contractAddress || 'N/A'}`, 'success');
        addLog(`Gas used: ${receipt.gasUsed.toString()}`, 'info');
        setDeployedAddress(receipt.contractAddress || '');
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (err: unknown) {
      const error = err as { shortMessage?: string; message?: string };
      addLog(`❌ Error: ${error.shortMessage || error.message}`, 'error');
      console.error('Full error:', err);
    } finally {
      setDeploying(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="retro-panel p-6 border-yellow-500">
        <p className="text-yellow-400 text-center blink">⚠️ CONNECT WALLET TO DEPLOY ⚠️</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Contract Type Selection */}
      <div className="retro-panel p-6 space-y-4">
        <div className="retro-text text-center space-y-2">
          <span className="blink text-sm">╔═══════════════════╗</span>
          <div className="text-base">║ DEBUG DEPLOYER  ║</div>
          <span className="blink text-sm">╚═══════════════════╝</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={(): void => setContractType('TOKEN')}
            className={`py-3 px-4 rounded-lg font-mono text-sm border-2 transition-all ${
              contractType === 'TOKEN'
                ? 'bg-green-500/20 border-green-500 text-green-400'
                : 'bg-black/50 border-green-500/30 text-green-500/50 hover:border-green-500/50'
            }`}
          >
            [ERC20 TOKEN]
          </button>
          <button
            onClick={(): void => setContractType('NFT')}
            className={`py-3 px-4 rounded-lg font-mono text-sm border-2 transition-all ${
              contractType === 'NFT'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                : 'bg-black/50 border-cyan-500/30 text-cyan-500/50 hover:border-cyan-500/50'
            }`}
          >
            [ERC721 NFT]
          </button>
        </div>

        {/* Token Form */}
        {contractType === 'TOKEN' && (
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs text-green-400 block mb-1">&gt; TOKEN NAME:</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTokenName(e.target.value)}
                placeholder="Token Name"
                className="retro-input w-full text-sm"
                disabled={deploying}
              />
            </div>
            <div>
              <label className="text-xs text-green-400 block mb-1">&gt; SYMBOL:</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="SYMBOL"
                className="retro-input w-full text-sm"
                disabled={deploying}
              />
            </div>
            <div>
              <label className="text-xs text-green-400 block mb-1">&gt; SUPPLY:</label>
              <input
                type="number"
                value={tokenSupply}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setTokenSupply(e.target.value)}
                placeholder="1000000"
                className="retro-input w-full text-sm"
                disabled={deploying}
              />
            </div>
            <button
              onClick={deployToken}
              disabled={deploying}
              className="retro-button w-full mt-2"
            >
              {deploying ? '[DEPLOYING...]' : '[DEPLOY TOKEN]'}
            </button>
          </div>
        )}

        {/* NFT Form */}
        {contractType === 'NFT' && (
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs text-cyan-400 block mb-1">&gt; NFT NAME:</label>
              <input
                type="text"
                value={nftName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNftName(e.target.value)}
                placeholder="NFT Name"
                className="retro-input w-full text-sm"
                disabled={deploying}
              />
            </div>
            <div>
              <label className="text-xs text-cyan-400 block mb-1">&gt; SYMBOL:</label>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setNftSymbol(e.target.value.toUpperCase())}
                placeholder="SYMBOL"
                className="retro-input w-full text-sm"
                disabled={deploying}
              />
            </div>
            <button
              onClick={deployNFT}
              disabled={deploying}
              className="retro-button w-full mt-2"
            >
              {deploying ? '[DEPLOYING...]' : '[DEPLOY NFT]'}
            </button>
          </div>
        )}
      </div>

      {/* Debug Logs */}
      {logs.length > 0 && (
        <div className="retro-panel p-4 max-h-96 overflow-y-auto border-cyan-500">
          <h3 className="text-cyan-400 font-mono font-bold mb-2 text-sm">📋 DEBUG LOGS</h3>
          <div className="space-y-1">
            {logs.map((log: LogEntry, i: number) => (
              <div key={i} className={`font-mono text-xs ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-300'
              }`}>
                <span className="text-gray-500">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success */}
      {deployedAddress && (
        <div className="retro-panel p-6 border-green-500">
          <h3 className="text-green-400 font-bold mb-2 blink">&gt; DEPLOYMENT SUCCESSFUL!</h3>
          <p className="text-xs text-green-400 mb-1">CONTRACT ADDRESS:</p>
          <p className="text-yellow-400 font-mono text-sm break-all mb-3">{deployedAddress}</p>
          <a
            href={`https://sepolia-explorer.giwa.io/address/${deployedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 text-xs hover:underline inline-block"
          >
            [VIEW ON GIWA EXPLORER] →
          </a>
        </div>
      )}
    </div>
  );
}
