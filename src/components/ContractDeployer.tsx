'use client'
import { useState, useEffect, useRef, memo } from 'react'
import { useAccount } from 'wagmi'
import type { ReactElement } from 'react'
import { playRetroSound } from '@/utils/retro-sounds'
import { useNetwork } from '@/contexts/NetworkContext'
import { CustomizeTokenModal } from './CustomizeTokenModal'
import { CustomizeNFTModal } from './CustomizeNFTModal'
import { getAddChainParameters } from '@/config/chains'

// Kontrat kaynak kodları ve bytecode'ları
const CONTRACTS = {
  COUNTER: {
    name: 'COUNTER',
    icon: '[##]',
    description: 'Artırma ve azaltma işlevi olan sayaç',
    bytecode: '0x608060405234801561001057600080fd5b5061015f806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632baeceb714610046578063d09de08a14610050578063f5c9d9e31461005a575b600080fd5b61004e610064565b005b6100586100a0565b005b6100626100dc565b005b600080541115610073576100a0565b6000808154809291906001900391905055505b565b6001600080828254610092919061012e565b925050819055505056fea264697066735822122098765432109876543210987654321098765432109876543210987654321098765064736f6c63430008130033',
    gas: '0x2DC6C0', // 3,000,000 - HEX FORMAT!
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Counter {
    uint256 public count = 0;
    
    function increment() public {
        count += 1;
    }
    
    function decrement() public {
        if (count > 0) {
            count -= 1;
        }
    }
    
    function reset() public {
        count = 0;
    }
}`,
  },
  STORAGE: {
    name: 'STORAGE',
    icon: '[▓▓]',
    description: 'Sayı saklama ve geri çağırma',
    bytecode: '0x608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100a1565b60405180910390f35b610073600480360381019061006e91906100ed565b61007e565b005b60008054905090565b8060008190555050565b6000819050919050565b61009b81610088565b82525050565b60006020820190506100b66000830184610092565b92915050565b600080fd5b6100ca81610088565b81146100d557600080fd5b50565b6000813590506100e7816100c1565b92915050565b600060208284031215610103576101026100bc565b5b6000610111848285016100d8565b9150509291505056fea2646970667358221220f4c1e9c3d5a7b6e8f2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a064736f6c63430008130033',
    gas: '0x2DC6C0',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}`,
  },
  TOKEN: {
    name: 'TOKEN',
    icon: '($)',
    description: 'ERC20 token transfer işlevi',
    bytecode: '0x608060405234801561000f575f80fd5b50620f42405f803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055506102e58061005f5f395ff3fe608060405234801561000f575f80fd5b506004361061003f575f3560e01c806318160ddd1461004357806370a0823114610061578063a9059cbb14610091575b5f80fd5b61004b6100c1565b60405161005891906101b3565b60405180910390f35b61007b600480360381019061007691906101fc565b6100c7565b60405161008891906101b3565b60405180910390f35b6100ab60048036038101906100a69190610227565b6100dc565b6040516100b89190610280565b60405180910390f35b620f424081565b5f6020528060525f20905f91509050505481565b5f815f803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205410156101295760059050610182565b815f803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546101749190610299565b92505081905550809150505b92915050565b5f819050919050565b6101ad81610188565b82525050565b5f6020820190506101c65f8301846101a4565b92915050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6101f9826101d0565b9050919050565b610209816101ef565b8114610213575f80fd5b50565b5f8135905061022481610200565b92915050565b5f806040838503121561024057610248016101cc565b5b5f61024d85828601610216565b925050602061025e85828601610216565b9150509250929050565b5f8115159050919050565b61027a81610268565b82525050565b5f6020820190506102935f830184610271565b92915050565b5f6102a382610188565b91506102ae83610188565b92508282039050818111156102c6576102c56102cc565b5b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffdfea2646970667358221220c8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a864736f6c63430008180033',
    gas: '0x2DC6C0',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SimpleToken {
    uint256 public constant totalSupply = 1000000;
    mapping(address => uint256) public balanceOf;
    
    constructor() {
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 amount) 
        public 
        returns (bool) 
    {
        if (balanceOf[msg.sender] < amount) {
            return false;
        }
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}`,
  },
  NFT: {
    name: 'NFT',
    icon: '[*]',
    description: 'ERC721 NFT mint işlevi',
    bytecode: '0x608060405234801561001057600080fd5b506102a9806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806306661abd146100465780636352211e14610064578063a0712d6814610094575b600080fd5b61004e6100b0565b60405161005b91906101ab565b60405180910390f35b61007e60048036038101906100799190610252565b6100b6565b60405161008b91906102cc565b60405180910390f35b6100ae60048036038101906100a99190610252565b6100e8565b005b60005481565b60016020528060005260406000206000915054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160008082825461011291906102e7565b92505081905550806001600083815260200190815260200160002060006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b6000819050919050565b6101a58161017e565b82525050565b60006020820190506101c0600083018461019c565b92915050565b600080fd5b6101d38161017e565b81146101de57600080fd5b50565b6000813590506101f0816101ca565b92915050565b60006020828403121561020c5761020b6101c6565b5b600061021a848285016101e1565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061024e82610223565b9050919050565b61025e81610243565b82525050565b60006020820190506102796000830184610255565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006102b98261017e565b91506102c48361017e565b9250828201905080821115610485576104846102de565b5b9291505056fea264697066735822122045d3e8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f064736f6c63430008130033',
    gas: '0x2DC6C0',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleNFT {
    uint256 public tokenCounter;
    mapping(uint256 => address) public ownerOf;
    
    function mint(address to) public {
        tokenCounter++;
        ownerOf[tokenCounter] = to;
    }
}`,
  },
  GREETER: {
    name: 'GREETER',
    icon: '(:)',
    description: 'Ziyaretçi sayacı - ziyaret sayısını takip eder',
    bytecode: '0x608060405234801561001057600080fd5b50610175806100206000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80630c49c36c1461004657806327810b6e146100645780633fa4f2451461006e575b600080fd5b61004e61008c565b60405161005b91906100e1565b60405180910390f35b61006c610092565b005b6100766100ce565b60405161008391906100e1565b60405180910390f35b60015481565b600160008082546100a39190610132565b92505081905550600160025f8282546100bc9190610132565b92505081905550565b60025481565b6000819050919050565b6100db816100d4565b82525050565b60006020820190506100f660008301846100d2565b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061013c826100d4565b9150610147836100d4565b925082820190508082111561015f5761015e6100fc565b5b92915050565bfea2646970667358221220abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345678964736f6c63430008130033',
    gas: '0x2DC6C0',
    sourceCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Greeter {
    uint256 public visitsToday;
    uint256 public totalVisits;
    
    function visit() public {
        visitsToday++;
        totalVisits++;
    }
    
    function getVisitsToday() 
        public 
        view 
        returns (uint256) 
    {
        return visitsToday;
    }
    
    function getTotalVisits() 
        public 
        view 
        returns (uint256) 
    {
        return totalVisits;
    }
}`,
  },
} as const

type ContractKey = keyof typeof CONTRACTS

interface ContractDeployerProps {
  onLog: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void
}

// 🔥 REACT.MEMO - Gereksiz re-render'ları önle
const ContractDeployerComponent = function ContractDeployer({ onLog }: ContractDeployerProps): ReactElement {
  const { address, isConnected } = useAccount()
  const { currentNetwork } = useNetwork()
  const [selectedContract, setSelectedContract] = useState<ContractKey>('COUNTER')
  const [loading, setLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [showTokenModal, setShowTokenModal] = useState(false)
  const [showNFTModal, setShowNFTModal] = useState(false)
  const [customBytecode, setCustomBytecode] = useState<string | null>(null)
  const [customContractName, setCustomContractName] = useState<string | null>(null)
  const [deployedTokenInfo, setDeployedTokenInfo] = useState<{name: string; symbol: string; supply: string} | null>(null)
  const [deployedNFTInfo, setDeployedNFTInfo] = useState<{name: string; symbol: string} | null>(null)
  
  const prevContractRef = useRef<ContractKey>('COUNTER')
  const prevNetworkRef = useRef<number>(currentNetwork.chainId)

  // Kontrat değiştiğinde ses çal
  useEffect(() => {
    if (prevContractRef.current !== selectedContract) {
      playRetroSound.switch()
      prevContractRef.current = selectedContract
    }
  }, [selectedContract])
  
  // 🌐 Network değiştiğinde deployed contract state'lerini temizle
  useEffect(() => {
    if (prevNetworkRef.current !== currentNetwork.chainId) {
      console.log('🌐 Network changed, clearing deployed contract states')
      setContractAddress(null)
      setTxHash(null)
      setDeployedTokenInfo(null)
      setDeployedNFTInfo(null)
      prevNetworkRef.current = currentNetwork.chainId
    }
  }, [currentNetwork.chainId])
  
  // 💥 WINDOW DEBUG - Manuel reset için
  useEffect(() => {
    (window as any).resetDeploy = () => {
      console.log('🔧 MANUAL RESET TRIGGERED FROM CONSOLE')
      setLoading(false)
      onLog('🔧 Manual reset executed', 'success')
    }
    
    return () => {
      delete (window as any).resetDeploy
    }
  }, [onLog])

  // 🎯 DEPLOY FUNCTION - Retry mekanizması ile geliştirilmiş
  const deployContract = async (customParams?: {
    bytecode: string
    contractName: string
    tokenInfo?: { name: string; symbol: string; supply: string }
    nftInfo?: { name: string; symbol: string }
    abi?: any[]
  }): Promise<void> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 DEPLOY BAŞLADI - RETRY MEKANIZMASI AKTİF')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 1️⃣ Ses efekti çal
    try {
      playRetroSound.coin()
      console.log('🔊 Coin sesi çalıyor')
    } catch (soundError) {
      console.log('🔇 Sound play failed:', soundError)
    }
    
    const contract = CONTRACTS[selectedContract]
    
    // 2️⃣ Terminal log'a kayıt
    onLog(`Initiating deployment: ${contract.name}`, 'info')
    
    // 3️⃣ State'leri başlat
    setLoading(true)
    setContractAddress(null) // Clear previous success
    setTxHash(null)
    setDeployedTokenInfo(null)
    setDeployedNFTInfo(null)
    
    // 🎯 STABLE NETWORK: No retry (single attempt only)
    // Other networks: Single attempt as well
    const isStableNetwork = currentNetwork.chainId === 2201
    
    try {
      console.log('🚀 Starting deployment (single attempt)')
      if (isStableNetwork) {
        onLog('🎯 Stable Network: Single deployment attempt', 'info')
      } else {
        onLog('🚀 Deploying contract...', 'info')
      }
        // 4️⃣ Wallet kontrolü - Wagmi'den address kullan
      if (!isConnected || !address) {
        const errorMsg = 'Please connect your wallet first using the Connect button'
        console.error('❌', errorMsg)
        onLog('❌ ' + errorMsg, 'error')
        throw new Error(errorMsg)
      }
      
      // window.ethereum kontrolü (transaction göndermek için gerekli)
      if (!window.ethereum) {
        const errorMsg = 'EVM Wallet provider not found. Please install MetaMask or another Web3 wallet.'
        console.error('❌', errorMsg)
        onLog('❌ ' + errorMsg, 'error')
        throw new Error(errorMsg)
      }
      
      console.log('✅ EVM Wallet bulundu')
      onLog('✅ EVM Wallet detected', 'success')

      // 5️⃣ Wagmi'den gelen address'i kullan (eth_requestAccounts GEREKSIZ!)
      const account = address // Wagmi'den gelen connected address
      
      console.log('✅ Account:', account)
      onLog(`✅ Wallet connected: ${account.slice(0, 6)}...${account.slice(-4)}`, 'success')
      onLog(`📍 Deploying from: ${account.slice(0, 6)}...${account.slice(-4)}`, 'info')
      
      // 6️⃣ BAKIYE KONTROLÜ - Deployment öncesi bakiye kontrolü
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💰 BAKİYE KONTROLÜ BAŞLIYOR...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      try {
        const balanceHex = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        }) as string
        
        const balanceWei = BigInt(balanceHex)
        const balanceEth = Number(balanceWei) / 1e18
        
        console.log('💰 Cüzdan Bakiyesi:', balanceEth.toFixed(6), currentNetwork.nativeCurrency.symbol)
        onLog(`💰 Balance: ${balanceEth.toFixed(6)} ${currentNetwork.nativeCurrency.symbol}`, 'info')
        
        // Minimum bakiye kontrolü - Estimated cost × 1.5 güvenlik marjı
        // Stable için: 5M gas × 2 Gwei × 1.5 = ~0.015 gUSDT minimum
        // BASE Mainnet için: 3M gas × 0.1 Gwei = ~0.0003 ETH minimum (BASE has very low fees)
        const estimatedCostWei = currentNetwork.chainId === 2201 
          ? BigInt(5000000) * BigInt(2000000000) // 5M gas × 2 Gwei
          : currentNetwork.chainId === 8453
          ? BigInt(3000000) * BigInt(100000000) // 3M gas × 0.1 Gwei (BASE low fees)
          : BigInt(3000000) * BigInt(1000000000) // 3M gas × 1 Gwei
        
        const minBalanceWei = (estimatedCostWei * BigInt(150)) / BigInt(100) // 1.5x buffer
        const minBalanceEth = Number(minBalanceWei) / 1e18
        
        console.log('💰 Minimum required balance:', minBalanceEth.toFixed(6), currentNetwork.nativeCurrency.symbol)
        
        if (balanceWei < minBalanceWei) {
          const errorMsg = `Insufficient balance! You have ${balanceEth.toFixed(6)} ${currentNetwork.nativeCurrency.symbol}, need at least ${minBalanceEth.toFixed(6)} ${currentNetwork.nativeCurrency.symbol}`
          console.error('❌', errorMsg)
          onLog(`❌ ${errorMsg}`, 'error')
          
          // Faucet link ver
          if (currentNetwork.chainId === 91342) {
            onLog('🔗 Get testnet tokens: https://faucet.lambda256.io', 'warning')
          } else if (currentNetwork.chainId === 5042002) {
            onLog('🔗 Get testnet tokens: https://faucet.testnet.arc.network', 'warning')
          } else if (currentNetwork.chainId === 2201) {
            onLog('🔗 Get gUSDT: https://faucet.stable.xyz', 'warning')
          }
          
          throw new Error(errorMsg)
        }
        
        console.log('✅ Bakiye yeterli!')
        onLog('✅ Balance check passed', 'success')
      } catch (balanceError: any) {
        console.error('❌ Bakiye kontrolü başarısız:', balanceError)
        if (balanceError.message.includes('Insufficient')) {
          throw balanceError // Re-throw insufficient balance error
        }
        // Diğer hatalarda devam et
        onLog('⚠️ Balance check failed, continuing...', 'warning')
      }
      
      // 7️⃣ Chain ID kontrolü ve gerekirse ağ değiştir - İYİLEŞTİRİLMİŞ!
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      }) as string
      
      console.log('🔍 Current chain ID:', chainId)
      
      const targetChainId = '0x' + currentNetwork.chainId.toString(16)
      console.log('🎯 Target chain ID:', targetChainId, `(${currentNetwork.name})`)

      if (chainId !== targetChainId) {
        console.log(`⚠️ Wrong network! Switching to ${currentNetwork.name}...`)
        onLog(`⚠️ Switching to ${currentNetwork.name} network...`, 'warning')
        
        // Önce switch dene, yoksa ekle - DİREKT EKLE KARIŞIKLIĞI ÖNLE!
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          })
          console.log('✅ Network switched successfully')
          onLog(`✅ Switched to ${currentNetwork.name}`, 'success')
        } catch (switchError: any) {
          console.log('⚠️ Switch failed, error code:', switchError.code)
          
          // Ağ yoksa ekle (code 4902 = Unrecognized chain ID)
          if (switchError.code === 4902) {
            console.log('📡 Network not found in wallet, adding automatically...')
            onLog(`📡 Adding ${currentNetwork.name} to your wallet...`, 'info')
            
            try {
              // Get chain parameters from centralized config
              const chainParams = getAddChainParameters(currentNetwork.chainId)
              
              if (!chainParams) {
                throw new Error(`Chain ${currentNetwork.chainId} not found in config`)
              }
              
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [chainParams],
              })
              
              console.log('✅ Network added and switched successfully')
              onLog(`✅ ${currentNetwork.name} added to wallet`, 'success')
              onLog(`✅ Switched to ${currentNetwork.name}`, 'success')
            } catch (addError: any) {
              console.error('❌ Failed to add network:', addError)
              onLog(`❌ Failed to add network: ${addError.message}`, 'error')
              throw new Error(`Cannot add network: ${addError.message}`)
            }
          } else if (switchError.code === 4001) {
            // User rejected request
            console.log('🚫 User rejected network switch')
            onLog('🚫 Network switch rejected by user', 'warning')
            throw new Error('User rejected network switch request')
          } else {
            // Other errors
            console.error('❌ Network switch failed:', switchError)
            onLog(`❌ Network switch failed: ${switchError.message}`, 'error')
            throw switchError
          }
        }
      } else {
        console.log(`✅ Already on ${currentNetwork.name}`)
        onLog(`✅ Connected to ${currentNetwork.name}`, 'success')
      }

      // 8️⃣ Deploy statusunu güncelle
      onLog('░▒▓ PREPARING DEPLOYMENT ▓▒░', 'info')
      
      // 9️⃣ Kontrat bilgilerini al
      const bytecode = customParams?.bytecode || customBytecode || contract.bytecode
      const contractName = customParams?.contractName || customContractName || contract.name
      
      console.log('📝 Bytecode length:', bytecode.length)
      onLog(`📝 Bytecode length: ${bytecode.length} chars`, 'info')
      
      // 🔟 NONCE KONTROLÜ - Transaction nonce'unu al (mempool için kritik)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔢 NONCE KONTROLÜ...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      let txNonce: string
      try {
        const nonceHex = await window.ethereum.request({
          method: 'eth_getTransactionCount',
          params: [account, 'latest']
        }) as string
        
        txNonce = nonceHex
        const nonceNum = parseInt(nonceHex, 16)
        console.log('✅ Current nonce:', nonceNum)
        onLog(`✅ Transaction nonce: ${nonceNum}`, 'success')
      } catch (nonceError: any) {
        console.error('❌ Nonce check failed:', nonceError)
        onLog('⚠️ Nonce check failed, continuing without explicit nonce', 'warning')
        txNonce = '0x0' // Fallback, let wallet handle it
      }
      
      // 1️⃣1️⃣ GAS ESTIMATION - Gerçek gas tahmin et
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⛽ GAS ESTIMATION BAŞLIYOR...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      let estimatedGas: string
      try {
        // estimateGas ile gerçek gas ihtiyacını hesapla
        const gasEstimateHex = await window.ethereum.request({
          method: 'eth_estimateGas',
          params: [{
            from: account,
            data: bytecode,
            nonce: txNonce, // Include nonce for accurate estimation
          }]
        }) as string
        
        const estimatedGasNum = parseInt(gasEstimateHex, 16)
        // Buffer ekle: Stable için %100 (2x total), diğerleri için %50
        const bufferMultiplier = currentNetwork.chainId === 2201 ? 2.0 : 1.5
        const gasWithBuffer = Math.floor(estimatedGasNum * bufferMultiplier)
        estimatedGas = '0x' + gasWithBuffer.toString(16)
        
        const bufferPercent = Math.floor((bufferMultiplier - 1) * 100)
        console.log('✅ Gas tahmini:', estimatedGasNum.toLocaleString())
        console.log(`✅ Buffer ile (+${bufferPercent}%):`, gasWithBuffer.toLocaleString())
        onLog(`✅ Estimated gas: ${estimatedGasNum.toLocaleString()} (with ${bufferPercent}% buffer: ${gasWithBuffer.toLocaleString()})`, 'success')
      } catch (gasError: any) {
        console.error('❌ Gas estimation failed:', gasError)
        console.error('   Error message:', gasError.message)
        console.error('   Error code:', gasError.code)
        console.error('   Error data:', gasError.data)
        
        // Gas estimation başarısız olursa default değer kullan
        estimatedGas = currentNetwork.chainId === 2201 ? '0x4C4B40' : '0x2DC6C0' // Stable: 5M, Others: 3M
        
        const defaultGas = parseInt(estimatedGas, 16)
        console.log('⚠️ Using default gas limit:', defaultGas.toLocaleString())
        onLog(`⚠️ Gas estimation failed, using default: ${defaultGas.toLocaleString()}`, 'warning')
        
        // Hata mesajını parse et
        if (gasError.message) {
          console.error('💡 Possible reason:', gasError.message)
          onLog(`💡 Gas error: ${gasError.message.slice(0, 100)}`, 'warning')
        }
      }
      
      // 1️⃣2️⃣ SIMULATION - Deploy'u simüle et (revert check)
      // TRY-CATCH: Simulation optional, always continue to deployment
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎮 SIMULATION BAŞLIYOR (OPTIONAL REVERT CHECK)...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      try {
        // eth_call ile deployment'ı simüle et (transaction göndermeden test et)
        await window.ethereum.request({
          method: 'eth_call',
          params: [{
            from: account,
            data: bytecode,
            gas: estimatedGas,
          }, 'latest']
        })
        
        console.log('✅ Simulation successful! No revert detected.')
        onLog('✅ Simulation passed - contract should deploy successfully', 'success')
      } catch (simError: any) {
        console.warn('⚠️ SIMULATION FAILED - But continuing to deployment...')
        console.warn('   Simulation error:', simError)
        console.warn('   Error message:', simError.message)
        console.warn('   Error code:', simError.code)
        console.warn('   Error data:', simError.data)
        
        onLog('⚠️ Simulation failed - attempting deployment anyway', 'warning')
        
        // Revert reason decode (basit)
        if (simError.data) {
          console.warn('🔍 Revert data:', simError.data)
        }
        
        if (simError.message) {
          onLog(`💡 Simulation reason: ${simError.message.slice(0, 80)}`, 'info')
        }
        
        // Note: Always continue to deployment even if simulation fails
        onLog('💡 Proceeding - MetaMask will open for confirmation', 'info')
      }
      
      onLog('⛽ Final gas limit: ' + parseInt(estimatedGas, 16).toLocaleString(), 'info')

      // 1️⃣3️⃣ Transaction gönder - ÖNEMLİ KISIM!
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 SENDING TRANSACTION...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      onLog('░▒▓ DEPLOYING CONTRACT ▓▒░', 'info')
      
      // 🚀 STABLE NETWORK: EIP-1559 transaction format (Type 2)
      // isStableNetwork already defined at line 237
      const transactionParams: any = {
        from: account,
        data: bytecode,
        nonce: txNonce, // CRITICAL: Include nonce to avoid mempool conflicts
      }
      
      // Stable için EIP-1559 FORMAT (Stable supports EIP-1559, seen in explorer)
      if (isStableNetwork) {
        // CRITICAL: Explicitly set transaction type to EIP-1559 (Type 2)
        transactionParams.type = '0x2' // EIP-1559 transaction type
        
        // Estimated gas'ı kullan (veya minimum 5M)
        const minGas = 0x4C4B40 // 5,000,000 (reasonable for Stable)
        const estimatedGasNum = parseInt(estimatedGas, 16)
        transactionParams.gas = estimatedGasNum > minGas ? estimatedGas : '0x4C4B40'
        
        // EIP-1559 FORMAT: Use maxFeePerGas and maxPriorityFeePerGas
        // SIGNIFICANTLY INCREASED FOR MEMPOOL ACCEPTANCE!
        // Max fee: 50 Gwei (very high for guaranteed acceptance), Priority: 5 Gwei (high priority)
        transactionParams.maxFeePerGas = '0xBA43B7400' // 50 Gwei = 50,000,000,000 wei (VERY HIGH for mempool)
        transactionParams.maxPriorityFeePerGas = '0x12A05F200' // 5 Gwei = 5,000,000,000 wei (HIGH PRIORITY for miners)
        
        // CRITICAL: Remove explicit nonce - let MetaMask handle it to avoid conflicts
        delete transactionParams.nonce
        
        // Total max cost: 50 Gwei × gas limit = cost in gUSDT
        const gasLimit = parseInt(transactionParams.gas, 16)
        const maxCostWei = gasLimit * 50000000000 // 50 Gwei in wei
        const maxCostUSDT = maxCostWei / 1e18
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('⚡ STABLE NETWORK: EIP-1559 VERY HIGH PRIORITY TRANSACTION')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('   - Transaction Type: 0x2 (EIP-1559)')
        console.log('   - Gas Limit:', gasLimit.toLocaleString(), '(2x buffered)')
        console.log('   - Max Fee Per Gas: 50 Gwei (VERY HIGH for guaranteed acceptance)')
        console.log('   - Max Priority Fee: 5 Gwei (VERY HIGH PRIORITY for miners)')
        console.log('   - Nonce: AUTO (managed by wallet)')
        console.log('   - Estimated Max Cost:', maxCostUSDT.toFixed(6), 'gUSDT ✅')
        console.log('   - Native Token: gUSDT (18 decimals)')
        console.log('   - Block Time: ~0.7 seconds')
        console.log('   - Fee Payment: gUSDT (native gas token)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        onLog('⚡ Stable: EIP-1559 VERY HIGH PRIORITY (50 Gwei max, 5 Gwei priority)', 'info')
        onLog(`📊 ${gasLimit.toLocaleString()} gas × 50 Gwei = ~${maxCostUSDT.toFixed(4)} gUSDT max ✅`, 'success')
        onLog('💰 Fee in gUSDT (native gas token)', 'info')
        onLog('🚀 Very high priority for guaranteed mempool acceptance', 'success')
        onLog('🔄 Nonce managed automatically by wallet', 'info')
      } else {
        // Diğer ağlar için estimated gas kullan
        transactionParams.gas = estimatedGas
        const gasLimit = parseInt(estimatedGas, 16)
        onLog(`⛽ Gas limit: ${gasLimit.toLocaleString()}`, 'info')
      }
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParams],
      }) as string

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ TRANSACTION SENT SUCCESSFULLY')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 TX HASH:', txHash)
      console.log('🔗 Explorer:', `${currentNetwork.explorerUrl}/tx/${txHash}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      onLog(`✅ Transaction sent successfully!`, 'success')
      onLog(`📤 TX: ${txHash.slice(0, 10)}...${txHash.slice(-8)}`, 'info')
      onLog(`🔗 Track: ${currentNetwork.explorerUrl}/tx/${txHash}`, 'info')
      
      // Set txHash immediately so user can check explorer even if polling fails
      setTxHash(txHash)

      // 1️⃣4️⃣ Konfirmasyon bekle - WALLET RPC POLLING (NO CORS!)
      onLog('░▒▓ CONFIRMING TRANSACTION ▓▒░', 'info')
      
      // 1️⃣5️⃣ WALLET RPC POLLING FUNCTION - Uses wallet provider (NO CORS!)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⏳ STARTING WALLET RPC POLLING (NO CORS!)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // ALL NETWORKS: Use wallet RPC (window.ethereum) - NO CORS issues!
      console.log('✅ Using wallet RPC provider (window.ethereum)')
      onLog('⏳ Polling for receipt via wallet RPC (NO CORS)...', 'info')
      
      // Network-specific timeouts - INCREASED for Stable (very slow testnet)
      const maxRetries = currentNetwork.chainId === 2201 ? 120 : 60 // Stable: 600s (10 min), Others: 300s (5 min)
      const pollInterval = 5000 // 5 seconds (as per user's example)
      const maxWaitTime = 6 * 60 * 1000 // 6 minutes max (as per user's example)
      const startTime = Date.now()
      
      console.log(`⏰ Max retries: ${maxRetries}`)
      console.log(`⏰ Poll interval: ${pollInterval}ms (5 seconds)`)
      console.log(`⏰ Max wait time: ${maxWaitTime / 1000}s (6 minutes)`)
      
      // Stable network - no warning log needed (user knows it's slow)
      
      let receipt = null
      let retries = 0
      
      // WALLET RPC POLLING LOOP - Uses window.ethereum (NO CORS!)
      while (retries < maxRetries) {
        try {
          // USE WALLET RPC: eth_getTransactionReceipt via window.ethereum
          // This works for ALL networks and avoids CORS issues!
          const receiptData = await window.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          }) as any
          
          receipt = receiptData // Can be null if not found yet
          
          if (receipt) {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('✅ RECEIPT FOUND VIA WALLET RPC!')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('Receipt:', receipt)
            console.log('Status:', receipt.status)
            console.log('Contract Address:', receipt.contractAddress)
            console.log('Block Number:', receipt.blockNumber)
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            
            // CHECK STATUS - receipt.status is 0x1 (success) or 0x0 (reverted)
            const statusHex = receipt.status
            const statusNum = typeof statusHex === 'string' ? parseInt(statusHex, 16) : statusHex
            
            if (statusNum === 1 || statusHex === '0x1') {
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('✅ TRANSACTION SUCCESSFUL!')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              console.log('Contract deployed at:', receipt.contractAddress)
              
              // CRITICAL: IMMEDIATELY UPDATE UI STATE - ALL AT ONCE!
              console.log('🔄 IMMEDIATELY updating UI state NOW (atomic update)')
              
              let finalContractAddress = receipt.contractAddress
              
              if (!finalContractAddress) {
                // Calculate contract address if not in receipt
                console.log('⚠️ No contract address in receipt, calculating...')
                const { getContractAddress } = await import('viem')
                const nonceNum = BigInt(parseInt(txNonce, 16))
                finalContractAddress = getContractAddress({
                  from: account as `0x${string}`,
                  nonce: nonceNum
                })
                console.log('✅ Calculated contract address:', finalContractAddress)
                receipt.contractAddress = finalContractAddress
              }
              
              // ATOMIC STATE UPDATE - All at once to avoid race conditions
              console.log('✅ Final contract address:', finalContractAddress)
              console.log('✅ Setting state: contractAddress =', finalContractAddress)
              console.log('✅ Setting state: txHash =', txHash)
              console.log('✅ Setting state: loading = false')
              
              setContractAddress(finalContractAddress)
              setTxHash(txHash)
              setLoading(false) // CRITICAL: Update UI immediately - turns off "DEPLOYING" state
              
              onLog('✅ Transaction confirmed! Contract deployed.', 'success')
              onLog(`📍 ${finalContractAddress}`, 'success')
              
              console.log('✅ UI state updated successfully!')
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
              
              // SUCCESS - Break out of polling loop
              break
            } else {
              // Transaction reverted (status = 0x0 or 0)
              console.log('❌ Transaction failed! Status:', statusHex)
              onLog('❌ Transaction reverted', 'error')
              setLoading(false)
              throw new Error('Transaction reverted')
            }
          }
          
          // No receipt yet - still pending
          if (retries % 10 === 0 || retries === 0) {
            console.log(`⏳ Waiting for confirmation... (attempt ${retries + 1}/${maxRetries})`)
          }
          
        } catch (error: any) {
          // Wallet RPC error handling
          // null response = transaction not found yet (expected while pending)
          if (!error.message) {
            // Silent - receipt is null, transaction still pending
            if (retries % 10 === 0) {
              console.log(`⏳ Transaction not found yet (attempt ${retries + 1}/${maxRetries})...`)
            }
          } else if (error.message && error.message.includes('not found')) {
            console.log(`⏳ Transaction not found yet (attempt ${retries + 1}/${maxRetries})...`)
          } else {
            console.error('Error checking receipt via wallet RPC:', error)
          }
        }
        
        // Wait 5 seconds before next attempt
        await new Promise(r => setTimeout(r, pollInterval))
        retries++
        
        // Check if 6 minutes passed
        if (Date.now() - startTime > maxWaitTime) {
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('⚠️ TIMEOUT: 6 minutes passed')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          onLog('⏰ Timeout: 6 minutes passed. Check explorer.', 'warning')
          onLog(`🔗 Check here: ${currentNetwork.explorerUrl}/tx/${txHash}`, 'info')
          break
        }
        
        // Progress updates
        if (retries % 10 === 0) {
          const elapsed = Math.round((Date.now() - startTime) / 1000)
          const remaining = Math.round((maxWaitTime - (Date.now() - startTime)) / 1000)
          onLog(`⏳ Still waiting... ${elapsed}s elapsed (max ${remaining}s remaining)`, 'info')
          
          if (currentNetwork.chainId === 2201) {
            onLog(`💡 Stable testnet is very slow. Your transaction is processing.`, 'warning')
          }
        }
      }

      // 1️⃣5️⃣ Receipt validation - Status kontrolü (state already set in polling loop)
      if (receipt) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📋 POST-POLLING VALIDATION (state already set)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('Receipt:', receipt)
        console.log('Contract Address:', receipt.contractAddress)
        console.log('Transaction status:', receipt.status)
        
        // NOTE: State already set in polling loop at line 661/677
        // This is just validation, NOT re-setting state
        
        // CRITICAL: Check receipt.status for failures only
        const status = receipt.status
        
        // Status check: 0x0 = reverted, 0x1 or 'success' = success
        if (status === '0x0' || status === 0 || status === 'reverted') {
          console.error('❌ TRANSACTION REVERTED (status = 0)')
          console.error('   Receipt:', JSON.stringify(receipt, null, 2))
          onLog('❌ Transaction reverted on-chain (status = 0)', 'error')
          
          // Logs'ları incele (eğer varsa revert reason)
          if (receipt.logs && receipt.logs.length > 0) {
            console.error('📋 Receipt logs:', receipt.logs)
            onLog('📋 Check logs for revert reason', 'warning')
          }
          
          onLog('💡 Constructor failed - check constructor logic', 'info')
          setLoading(false) // Ensure loading is false even on failure
          throw new Error('Transaction reverted: Constructor execution failed')
        }
        
        console.log('✅ Receipt validation passed')
        console.log('✅ State was already set in polling loop - no changes needed')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
      
      // 1️⃣6️⃣ Sonuç kontrolü
      if (receipt?.contractAddress) {
        console.log('🎉 DEPLOYMENT SUCCESSFUL!')
        console.log('📍 Contract Address:', receipt.contractAddress)
        console.log('⛽ Gas Used:', parseInt(receipt.gasUsed, 16).toLocaleString())
        
        // Gas cost hesapla (Stable network için)
        if (currentNetwork.chainId === 2201 && receipt.effectiveGasPrice) {
          const gasUsed = parseInt(receipt.gasUsed, 16)
          const gasPrice = parseInt(receipt.effectiveGasPrice, 16)
          const costWei = gasUsed * gasPrice
          const costUSDT = costWei / 1e18
          console.log('💰 Actual cost:', costUSDT.toFixed(6), 'gUSDT')
          onLog(`💰 Actual cost: ${costUSDT.toFixed(6)} gUSDT`, 'success')
        }
        
        // NOTE: State already set in polling loop (line 661/677)
        // No need to re-set state here - it would cause unnecessary re-renders
        console.log('ℹ️ State was already set in polling loop at line 661/677')
        console.log('ℹ️ Current state - TxHash:', txHash)
        console.log('ℹ️ Current state - ContractAddress:', receipt.contractAddress)
        
        // Save to localStorage for use in Transfer and Interact tabs
        const deployedContract = {
          address: receipt.contractAddress,
          type: selectedContract,
          name: contractName,
          network: currentNetwork.name,
          networkId: currentNetwork.chainId,
          timestamp: Date.now(),
          txHash: txHash
        }
        
        // Network-aware storage: each network has its own contract list
        const storageKey = `deployedContracts_${currentNetwork.chainId}`
        const existingContracts = JSON.parse(localStorage.getItem(storageKey) || '[]')
        existingContracts.push(deployedContract)
        localStorage.setItem(storageKey, JSON.stringify(existingContracts))
        console.log('💾 Contract saved to localStorage (network-specific):', deployedContract)
        
        onLog('✓ DEPLOYMENT SUCCESSFUL ✓', 'success')
        onLog(`📍 Contract Address: ${receipt.contractAddress}`, 'success')
        onLog(`⛽ Gas Used: ${parseInt(receipt.gasUsed, 16).toLocaleString()}`, 'info')
        onLog(`🔗 Explorer: ${currentNetwork.explorerUrl}/address/${receipt.contractAddress}`, 'info')
        
        // Set deployed info for success display
        if (customParams?.tokenInfo) {
          setDeployedTokenInfo(customParams.tokenInfo)
        }
        if (customParams?.nftInfo) {
          setDeployedNFTInfo(customParams.nftInfo)
        }
        
        // AUTO-MINT: Automatically mint first NFT to deployer
        if (customParams?.nftInfo && customParams?.abi) {
          try {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            console.log('🎨 AUTO-MINTING FIRST NFT...')
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
            onLog('🎨 Minting first NFT to your address...', 'info')
            
            // Find mint function in ABI
            const mintFunction = customParams.abi.find((fn: any) => fn.name === 'mint' && fn.type === 'function')
            
            if (!mintFunction) {
              console.warn('⚠️ Mint function not found in ABI - skipping auto-mint')
              onLog('💡 Use mint() function to create NFTs', 'info')
            } else {
              // Encode mint function call: mint(address to)
              const { encodeFunctionData } = await import('viem')
              const mintData = encodeFunctionData({
                abi: customParams.abi,
                functionName: 'mint',
                args: [account] // Mint to deployer
              })
              
              console.log('📤 Encoded mint call:', mintData.slice(0, 20) + '...')
              
              // Send mint transaction
              const mintTxHash = await window.ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: account,
                  to: receipt.contractAddress,
                  data: mintData,
                  gas: '0x186A0', // 100,000 gas
                }],
              }) as string
              
              console.log('✅ Mint transaction sent:', mintTxHash)
              onLog(`✅ First NFT minted! TX: ${mintTxHash.slice(0, 10)}...`, 'success')
              onLog(`🔗 View TX: ${currentNetwork.explorerUrl}/tx/${mintTxHash}`, 'info')
            }
          } catch (mintError: any) {
            console.error('❌ Auto-mint failed:', mintError)
            onLog('⚠️ Auto-mint failed. Use mint() function manually.', 'warning')
            onLog(`💡 Call mint(${account}) on contract`, 'info')
          }
        }
        
        // Auto-mint for tokens with constructor supply
        if (customParams?.abi && customParams?.tokenInfo) {
          onLog('✓ Tokens auto-minted to your address via constructor', 'success')
          onLog(`💰 Balance: ${Number(customParams.tokenInfo.supply).toLocaleString()} ${customParams.tokenInfo.symbol}`, 'info')
        }
      } else {
        // Calculate actual timeout duration
        const timeoutDuration = (maxRetries * pollInterval) / 1000 // FIX: Use maxRetries instead of undefined maxAttempts
        console.log(`⏰ Transaction timeout after ${timeoutDuration}s - still pending`)
        onLog(`⏰ Transaction still pending after ${timeoutDuration}s`, 'warning')
        onLog(`🔗 Check transaction status: ${currentNetwork.explorerUrl}/tx/${txHash}`, 'info')
        onLog('💡 The transaction may still be processing. Check the explorer link above.', 'info')
        throw new Error(`Transaction timeout after ${timeoutDuration}s`)
      }

        // ✅ DEPLOYMENT SUCCESSFUL
        console.log('✅ DEPLOYMENT COMPLETED SUCCESSFULLY')
    
  } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ DEPLOYMENT ERROR')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error type:', typeof error)
      console.error('Error constructor:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      console.error('Error data:', error?.data)
      console.error('Error reason:', error?.reason)
      console.error('Full error object:', JSON.stringify(error, null, 2))
      console.error('Error keys:', Object.keys(error || {}))
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Try to extract meaningful error message
      let errorMessage = 'Unknown deployment error'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.reason) {
        errorMessage = error.reason
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error?.code) {
        errorMessage = `Error code: ${error.code}`
      } else {
        // Try to stringify the error
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = 'Deploy failed - check console for details'
        }
      }
      
      console.log('📝 Extracted error message:', errorMessage)
      onLog('✗ ERROR: ' + errorMessage.toUpperCase(), 'error')
      
      // Hata türüne göre detaylı mesaj
      const errorLower = errorMessage.toLowerCase()
      
      if (errorLower.includes('user rejected') || errorLower.includes('denied') || errorLower.includes('user denied')) {
        onLog('🚫 Transaction rejected by user.', 'warning')
        onLog('💡 Please approve the transaction in your wallet to continue.', 'info')
      } else if (errorLower.includes('insufficient')) {
        onLog('💰 Insufficient balance! Get test tokens from faucet.', 'error')
        if (currentNetwork.chainId === 91342) {
          onLog('🔗 GIWA Faucet: https://faucet.lambda256.io', 'info')
        } else if (currentNetwork.chainId === 5042002) {
          onLog('🔗 ARC Faucet: https://faucet.testnet.arc.network', 'info')
        } else if (currentNetwork.chainId === 2201) {
          onLog('🔗 Stable Faucet: https://faucet.stable.xyz', 'info')
        }
      } else if (errorLower.includes('gas')) {
        onLog('⛽ Gas estimation failed. Check gas limit.', 'error')
        onLog('💡 Try increasing gas limit or check your balance.', 'info')
      } else if (error?.code === -32003 || error?.code === -3203) {
        onLog('❌ Error -3203: Execution reverted', 'error')
        onLog('💡 Possible causes:', 'info')
        onLog('   - Yetersiz bakiye (insufficient balance)', 'info')
        onLog('   - Gas limit çok düşük', 'info')
        onLog('   - Contract constructor başarısız oldu', 'info')
        onLog('   - Ağ hatası (network issue)', 'info')
        if (currentNetwork.chainId === 2201) {
          onLog('💡 Stable Network: Faucet\'ten gUSDT alın', 'warning')
          onLog('🔗 https://faucet.stable.xyz', 'info')
        }
      } else if (errorLower.includes('no accounts')) {
        onLog('🔐 Wallet is locked. Please unlock your wallet.', 'error')
      } else if (errorLower.includes('network')) {
        onLog('🌐 Network error. Please check your connection.', 'error')
      } else {
        // Generic error - show full message
        onLog(`💡 Error: ${errorMessage.slice(0, 200)}`, 'info')
        onLog('💡 Check browser console (F12) for full error details', 'info')
      }
    } finally {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🏁 DEPLOY BİTTİ - Cleanup')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // CRITICAL FIX: Always set loading to false (handles cancel/reject cases)
      console.log('✅ Finally block: Setting loading to false (ensures button returns to normal state)')
      setLoading(false)
      
      setCustomBytecode(null)
      setCustomContractName(null)
    }
  }
  
  const handleTokenCustomize = async (params: { name: string; symbol: string; initialSupply: string; bytecode: string; abi: any[] }): Promise<void> => {
    setSelectedContract('TOKEN')
    onLog(`📝 Custom token configured: ${params.name} (${params.symbol})`, 'info')
    onLog(`📊 Initial supply: ${params.initialSupply} tokens`, 'info')
    onLog(`⚙️ Contract compiled with ${params.abi.length} functions`, 'info')
    
    // CRITICAL: Encode constructor parameter (initialSupply) and append to bytecode
    try {
      const { encodeAbiParameters, parseAbiParameters } = await import('viem')
      
      // Convert initialSupply to proper format (token count, not wei)
      const supplyParam = BigInt(params.initialSupply)
      
      onLog(`🔧 Encoding constructor parameter: ${params.initialSupply}`, 'info')
      
      // Encode the constructor parameter (uint256 initialSupply)
      const encodedParams = encodeAbiParameters(
        parseAbiParameters('uint256'),
        [supplyParam]
      )
      
      onLog(`✅ Encoded: ${encodedParams}`, 'info')
      
      // Append encoded parameters to bytecode (remove 0x prefix from encoded params)
      const fullBytecode = params.bytecode + encodedParams.slice(2)
      
      onLog(`📦 Final bytecode length: ${fullBytecode.length} chars`, 'info')
      
      // Auto-deploy with constructor-encoded bytecode
      await deployContract({
        bytecode: fullBytecode,
        contractName: `${params.name} (${params.symbol})`,
        tokenInfo: { name: params.name, symbol: params.symbol, supply: params.initialSupply },
        abi: params.abi
      })
    } catch (error: any) {
      console.error('❌ Constructor encoding failed:', error)
      onLog(`❌ Failed to encode constructor: ${error.message}`, 'error')
    }
  }
  
  const handleNFTCustomize = async (params: { name: string; symbol: string; bytecode: string; abi: any[]; baseURI: string; imageUrl: string }): Promise<void> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 handleNFTCustomize CALLED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Params:', {
      name: params.name,
      symbol: params.symbol,
      baseURI: params.baseURI,
      imageUrl: params.imageUrl,
      bytecodeLength: params.bytecode.length,
      abiLength: params.abi.length
    })
    
    // CRITICAL VALIDATION: Check baseURI format BEFORE encoding
    console.log('🔍 Validating baseURI before deployment...')
    if (!params.baseURI || params.baseURI.trim() === '') {
      const error = new Error('baseURI is empty or null')
      console.error('❌ VALIDATION FAILED:', error.message)
      onLog('❌ baseURI validation failed: Empty or null', 'error')
      throw error
    }
    if (!params.baseURI.startsWith('ipfs://')) {
      const error = new Error(`baseURI must start with ipfs://, got: ${params.baseURI}`)
      console.error('❌ VALIDATION FAILED:', error.message)
      onLog(`❌ baseURI validation failed: Must start with ipfs://`, 'error')
      throw error
    }
    // Note: baseURI no longer needs to end with '/' since we use a single metadata file
    console.log('✅ baseURI validation passed')
    onLog('✅ baseURI format validated successfully', 'success')
    
    setSelectedContract('NFT')
    onLog(`📝 Custom NFT configured: ${params.name} (${params.symbol})`, 'info')
    onLog(`⚙️ Contract compiled with ${params.abi.length} functions`, 'info')
    onLog(`🖼️ Collection image uploaded to IPFS`, 'success')
    onLog(`🔗 Base URI: ${params.baseURI}`, 'info')
    
    // CRITICAL: Encode constructor parameter (baseURI) and append to bytecode
    try {
      console.log('🔧 Starting constructor encoding...')
      onLog(`🔧 Encoding constructor parameter (baseURI)...`, 'info')
      
      console.log('📦 Importing viem...')
      const { encodeAbiParameters, parseAbiParameters } = await import('viem')
      console.log('✅ Viem imported successfully')
      
      console.log('🔧 Encoding baseURI:', params.baseURI)
      // Encode the constructor parameter (string baseURI)
      const encodedParams = encodeAbiParameters(
        parseAbiParameters('string'),
        [params.baseURI]
      )
      
      console.log('✅ Parameters encoded:', encodedParams.slice(0, 66) + '...')
      onLog(`✅ Constructor parameter encoded`, 'success')
      
      // Append encoded parameters to bytecode (remove 0x prefix from encoded params)
      const fullBytecode = params.bytecode + encodedParams.slice(2)
      
      console.log('📦 Bytecode stats:')
      console.log('   - Original bytecode length:', params.bytecode.length)
      console.log('   - Encoded params length:', encodedParams.length - 2)
      console.log('   - Full bytecode length:', fullBytecode.length)
      onLog(`📦 Final bytecode: ${fullBytecode.length} chars (bytecode + constructor)`, 'info')
      
      // Terminal feedback BEFORE calling deployContract
      onLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      onLog('🚀 READY FOR BLOCKCHAIN DEPLOYMENT', 'success')
      onLog('⏳ Opening MetaMask...', 'warning')
      onLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 CALLING deployContract() NOW...')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      if (!window.ethereum) {
        console.error('❌ CRITICAL: window.ethereum is undefined!')
        console.error('   MetaMask or another Web3 wallet must be installed.')
        onLog('❌ MetaMask not found! Please install MetaMask extension.', 'error')
        return
      }
      console.log('✅ window.ethereum found:', !!window.ethereum)
      
      // Auto-deploy with constructor-encoded bytecode
      console.log('📤 Calling deployContract with params:', {
        bytecodeLength: fullBytecode.length,
        contractName: `${params.name} (${params.symbol})`,
        nftInfo: { name: params.name, symbol: params.symbol },
        abiLength: params.abi.length
      })
      
      await deployContract({
        bytecode: fullBytecode,
        contractName: `${params.name} (${params.symbol})`,
        nftInfo: { name: params.name, symbol: params.symbol },
        abi: params.abi
      })
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ deployContract() COMPLETED SUCCESSFULLY')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ handleNFTCustomize ERROR CAUGHT')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Error code:', error?.code)
      console.error('Error stack:', error?.stack)
      console.error('Full error object:', error)
      
      onLog(`❌ NFT deployment failed: ${error.message}`, 'error')
      throw error // Re-throw to propagate to modal
    }
  }

  return (
    <>
      {/* Modals */}
      <CustomizeTokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        onDeploy={handleTokenCustomize}
      />
      <CustomizeNFTModal
        isOpen={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        onDeploy={handleNFTCustomize}
      />
      
    <div className="retro-panel p-4 space-y-4">
      <div className="retro-text text-center mb-3">
        <span className="blink text-sm">╔═══════════════════╗</span>
        <div className="text-sm my-1">║ CONTRACT DEPLOYER ║</div>
        <span className="blink text-sm">╚═══════════════════╝</span>
      </div>

      {/* Contract Selection Grid */}
      <div className="space-y-3">
        <label className="block retro-text text-xs">
          <span className="blink">&gt;</span> SELECT CONTRACT:
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CONTRACTS).map(([key, contract]) => {
            const isSelected = selectedContract === key
            const isCustomizable = key === 'TOKEN' || key === 'NFT'
            
            return (
              <div key={key} className="relative">
                <button
                  onClick={() => setSelectedContract(key as ContractKey)}
                  disabled={loading}
                  className={`
                    w-full relative p-3 rounded border-2 font-mono text-xs transition-all
                    ${isSelected 
                      ? 'border-green-400 bg-green-900/40 text-green-300' 
                      : 'border-green-500/40 bg-black/60 text-green-400 hover:border-green-400 hover:bg-green-900/20'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    disabled:opacity-50
                  `}
                >
                  <div className="text-3xl mb-2 font-bold">{contract.icon}</div>
                  <div className="text-[10px] leading-tight opacity-80">
                    {contract.name}
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1">
                      <span className="text-green-400 animate-pulse">▶</span>
                    </div>
                  )}
                </button>
                
                {/* Customize Button for TOKEN and NFT - Network-specific styling */}
                {isCustomizable && (
                  <button
                    onClick={() => {
                      if (key === 'TOKEN') {
                        setShowTokenModal(true)
                        playRetroSound.coin()
                      } else if (key === 'NFT') {
                        setShowNFTModal(true)
                        playRetroSound.coin()
                      }
                    }}
                    disabled={loading}
                    className={`w-full mt-1 px-2 py-1 rounded font-mono text-[10px] font-bold transition-all disabled:opacity-50 ${
                      currentNetwork.chainId === 8453
                        ? 'bg-white hover:bg-gray-100 text-black' // Base Mainnet: White background, black text
                        : currentNetwork.chainId === 5042002
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' // ARC Network: Bright gray (darker)
                        : 'bg-green-500 hover:bg-green-400 text-white' // Stable and other networks: Bright green
                    }`}
                    style={currentNetwork.chainId !== 8453 ? { color: 'white' } : undefined}
                  >
                    CUSTOMIZE
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected Contract Info */}
        <div className="retro-panel p-3 text-xs space-y-2 border-2 border-green-500/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-green-400 font-bold mb-1">
                {CONTRACTS[selectedContract].icon} {CONTRACTS[selectedContract].name}
              </p>
              <p className="text-green-400/70 mt-1">
                &gt; Gas Limit: {parseInt(CONTRACTS[selectedContract].gas, 16).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Solidity Source Code - Always Visible */}
          <div className="pt-2 border-t border-green-700/50">
            <p className="text-green-400 text-xs mb-1 flex items-center gap-1">
              <span className="animate-pulse">▶</span> SOURCE:
            </p>
            <pre className="text-xs p-3 bg-black/80 border border-green-500/30 rounded overflow-x-auto text-green-400 max-h-64 overflow-y-auto font-mono leading-relaxed">
{CONTRACTS[selectedContract].sourceCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Deploy Button - Network-specific styling */}
      <button
        onClick={deployContract}
        disabled={!isConnected || loading}
        className={`w-full p-3 rounded font-mono font-bold text-sm transition-all ${
          loading
            ? currentNetwork.chainId === 8453
              ? 'bg-cyan-500 cursor-wait animate-pulse' // Base Mainnet: Turquoise
              : currentNetwork.chainId === 5042002
              ? 'bg-gray-700 cursor-wait animate-pulse' // ARC Network: Dark gray
              : 'bg-green-500 cursor-wait animate-pulse' // Other networks: Bright green
            : isConnected
            ? currentNetwork.chainId === 8453
              ? 'bg-cyan-500 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50' // Base Mainnet: Turquoise
              : currentNetwork.chainId === 5042002
              ? 'bg-gray-700 hover:bg-gray-600 hover:shadow-lg hover:shadow-gray-500/50' // ARC Network: Dark gray
              : 'bg-green-500 hover:bg-green-400 hover:shadow-lg hover:shadow-green-500/50' // Other networks: Bright green
            : 'bg-gray-600 cursor-not-allowed'
        }`}
        style={{ color: 'white' }}
      >
        {loading ? (
          <span className="blink" style={{ color: 'white' }}>⏳ DEPLOYING...</span>
        ) : !isConnected ? (
          <span style={{ color: 'white' }}>🔒 CONNECT WALLET FIRST</span>
        ) : (
          <span style={{ color: 'white' }}>{`[>>] DEPLOY ${CONTRACTS[selectedContract].icon}`}</span>
        )}
      </button>

      {!isConnected && (
        <p className="text-xs text-center text-yellow-400 retro-text">
          <span className="blink">!</span> Cüzdanınızı bağlayın
        </p>
      )}

      {/* Success Message - Efektli Terminal Görünümü */}
      {contractAddress && txHash && (
        <div className="retro-panel bg-green-900/20 border-2 border-green-400 p-4 space-y-3">
          {/* ASCII Art Success Banner */}
          <div className="text-center font-mono">
            <div className="text-green-400 text-xs leading-none">
              ╔═══════════════════════════════════════╗
            </div>
            <div className="text-green-300 font-bold text-sm py-2 blink">
              ✓ DEPLOYMENT SUCCESSFUL ✓
            </div>
            <div className="text-green-400 text-xs leading-none">
              ╚═══════════════════════════════════════╝
            </div>
          </div>

          {/* Contract Address */}
          <div className="space-y-1">
            <p className="text-green-400 text-xs font-mono">
              <span className="animate-pulse">▶</span> CONTRACT ADDRESS:
            </p>
            <div className="bg-black/60 border border-green-500/50 rounded p-2">
              <a
                href={`${currentNetwork.explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 text-xs font-mono break-all hover:text-green-100 transition-colors underline"
              >
                {contractAddress}
              </a>
            </div>
          </div>

          {/* Transaction Hash */}
          <div className="space-y-1">
            <p className="text-green-400 text-xs font-mono">
              <span className="animate-pulse">▶</span> TRANSACTION HASH:
            </p>
            <div className="bg-black/60 border border-green-500/50 rounded p-2">
              <a
                href={`${currentNetwork.explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-300 text-xs font-mono break-all hover:text-green-100 transition-colors underline"
              >
                {txHash}
              </a>
            </div>
          </div>

          {/* Token Details (if TOKEN deployed) */}
          {deployedTokenInfo && (
            <div className="space-y-2 pt-2 border-t border-green-700/50">
              <p className="text-green-400 text-xs font-mono font-bold">
                <span className="animate-pulse">▶</span> TOKEN DETAILS:
              </p>
              <div className="bg-black/60 border border-green-500/50 rounded p-3 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400/70">Name:</span>
                  <span className="text-green-300 font-bold">{deployedTokenInfo.name}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400/70">Symbol:</span>
                  <span className="text-green-300 font-bold">{deployedTokenInfo.symbol}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400/70">Initial Supply:</span>
                  <span className="text-green-300 font-bold">{Number(deployedTokenInfo.supply).toLocaleString()}</span>
                </div>
                <div className="text-xs text-green-400/60 pt-2 border-t border-green-700/30">
                  ✓ All tokens minted to your address
                </div>
              </div>
            </div>
          )}

          {/* NFT Details (if NFT deployed) */}
          {deployedNFTInfo && (
            <div className="space-y-2 pt-2 border-t border-green-700/50">
              <p className="text-green-400 text-xs font-mono font-bold">
                <span className="animate-pulse">▶</span> NFT COLLECTION DETAILS:
              </p>
              <div className="bg-black/60 border border-green-500/50 rounded p-3 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400/70">Collection:</span>
                  <span className="text-green-300 font-bold">{deployedNFTInfo.name}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-green-400/70">Symbol:</span>
                  <span className="text-green-300 font-bold">{deployedNFTInfo.symbol}</span>
                </div>
                <div className="text-xs text-green-400/60 pt-2 border-t border-green-700/30">
                  🎨 First NFT minted to your address
                </div>
              </div>
            </div>
          )}

          {/* Explorer Links + Twitter Share Button - Network-specific styling */}
          <div className="flex gap-2 pt-2">
            <a
              href={`${currentNetwork.explorerUrl}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 text-xs font-mono font-bold py-2 px-3 rounded transition-all text-center border-2 ${
                currentNetwork.chainId === 8453
                  ? 'bg-white hover:bg-gray-100 border-white text-black' // Base Mainnet: White
                  : 'bg-green-500 hover:bg-green-400 border-green-600 text-white' // Other networks: Bright green
              }`}
            >
              📍 VIEW CONTRACT →
            </a>
            <a
              href={`${currentNetwork.explorerUrl}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 text-xs font-mono font-bold py-2 px-3 rounded transition-all text-center border-2 ${
                currentNetwork.chainId === 8453
                  ? 'bg-white hover:bg-gray-100 border-white text-black' // Base Mainnet: White
                  : 'bg-green-500 hover:bg-green-400 border-green-600 text-white' // Other networks: Bright green
              }`}
            >
              🔗 VIEW TX →
            </a>
          </div>
          
          {/* Twitter Share Button - YENİ! */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `🚀 Just deployed a ${CONTRACTS[selectedContract].name} contract on ${currentNetwork.displayName}!\n\n` +
              `📍 Contract: ${contractAddress}\n` +
              `🔗 Explorer: ${currentNetwork.explorerUrl}/address/${contractAddress}\n\n` +
              `#Web3 #Blockchain #${currentNetwork.displayName.replace(/\s+/g, '')}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 text-xs font-mono font-bold py-2 px-3 rounded transition-all text-center flex items-center justify-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
            style={{ color: 'white' }}
          >
            <svg className="w-4 h-4" fill="white" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            <span style={{ color: 'white' }}>SHARE ON X</span>
          </a>

          {/* ASCII Art Bottom Decoration */}
          <div className="text-center text-green-400/50 text-xs font-mono pt-2">
            ░▒▓█ SUCCESS █▓▒░
          </div>
        </div>
      )}
    </div>
    </>
  )
}

// 🔥 EXPORT WITH REACT.MEMO
export const ContractDeployer = memo(ContractDeployerComponent, (prevProps, nextProps) => {
  // Only re-render if onLog reference changes (which it shouldn't)
  return prevProps.onLog === nextProps.onLog
})
