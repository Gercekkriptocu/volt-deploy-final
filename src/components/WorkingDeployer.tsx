'use client'
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useAccount, useWalletClient, usePublicClient, useBalance } from 'wagmi'
import { encodeDeployData, parseUnits, formatEther, type Hex } from 'viem'

// ⚠️ ÖNEMLI: Bu bytecode'ları Remix'ten almanız gerekiyor!
// Talimatlar: contracts/REMIX-INSTRUCTIONS.md
const TOKEN_BYTECODE: Hex = '0x' // Remix'ten MinimalToken bytecode'u buraya
const NFT_BYTECODE: Hex = '0x' // Remix'ten MinimalNFT bytecode'u buraya

const TOKEN_ABI = [
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_symbol', type: 'string' },
      { internalType: 'uint256', name: '_supply', type: 'uint256' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  }
] as const

const NFT_ABI = [
  {
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_symbol', type: 'string' }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  }
] as const

type LogType = 'info' | 'success' | 'warning' | 'error'

interface Log {
  time: string
  message: string
  type: LogType
}

export default function WorkingDeployer(): ReactElement {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { data: balance } = useBalance({ address })

  const [contractType, setContractType] = useState<'TOKEN' | 'NFT'>('TOKEN')
  const [deploying, setDeploying] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [deployedAddress, setDeployedAddress] = useState<string>('')

  // Token parameters
  const [tokenName, setTokenName] = useState('My Token')
  const [tokenSymbol, setTokenSymbol] = useState('MTK')
  const [tokenSupply, setTokenSupply] = useState('1000000')

  // NFT parameters
  const [nftName, setNftName] = useState('My NFT')
  const [nftSymbol, setNftSymbol] = useState('MNFT')

  // Advanced settings
  const [skipGasEstimation, setSkipGasEstimation] = useState(true)
  const [manualGasLimit, setManualGasLimit] = useState('8000000')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addLog = (message: string, type: LogType = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString('tr-TR')
    setLogs((prev) => [...prev, { time: timestamp, message, type }])
    console.log(`[${timestamp}] [${type.toUpperCase()}]`, message)
  }

  // Check balance on load
  useEffect(() => {
    if (balance) {
      const ethBalance = parseFloat(formatEther(balance.value))
      if (ethBalance < 0.001 && ethBalance > 0) {
        addLog(`⚠️ Düşük bakiye: ${ethBalance.toFixed(6)} ETH`, 'warning')
      }
    }
  }, [balance])

  // Test current RPC connection
  const testRpcConnection = async (): Promise<void> => {
    if (!publicClient) return
    
    try {
      const blockNumber = await publicClient.getBlockNumber()
      addLog(`✅ RPC bağlantısı aktif (block: ${blockNumber})`, 'success')
    } catch (err) {
      addLog(`⚠️ RPC bağlantı testi başarısız`, 'warning')
    }
  }

  // Validate token parameters
  const validateTokenParams = (): boolean => {
    if (!tokenName.trim()) {
      addLog('❌ Token adı boş olamaz', 'error')
      return false
    }
    if (!tokenSymbol.trim() || tokenSymbol.length > 11) {
      addLog('❌ Token sembolü 1-11 karakter olmalı', 'error')
      return false
    }
    if (!tokenSupply || parseFloat(tokenSupply) <= 0) {
      addLog('❌ Token arzı 0\'dan büyük olmalı', 'error')
      return false
    }
    return true
  }

  // Validate NFT parameters
  const validateNftParams = (): boolean => {
    if (!nftName.trim()) {
      addLog('❌ NFT adı boş olamaz', 'error')
      return false
    }
    if (!nftSymbol.trim() || nftSymbol.length > 11) {
      addLog('❌ NFT sembolü 1-11 karakter olmalı', 'error')
      return false
    }
    return true
  }

  const validateBytecode = (bytecode: Hex, name: string): boolean => {
    if (!bytecode || bytecode === '0x') {
      addLog(`❌ ${name} bytecode'u boş! Remix'ten bytecode almanız gerekiyor.`, 'error')
      addLog('📖 Talimatlar: contracts/REMIX-INSTRUCTIONS.md', 'info')
      return false
    }

    if (!bytecode.startsWith('0x6080')) {
      addLog(`⚠️ ${name} bytecode hatalı format!`, 'error')
      addLog(`Başlangıç: ${bytecode.slice(0, 10)}`, 'error')
      addLog('Doğru format: 0x6080604052...', 'info')
      return false
    }

    if (bytecode.length < 100) {
      addLog(`❌ ${name} bytecode çok kısa! Tam bytecode'u kopyalayın.`, 'error')
      return false
    }

    addLog(`✅ ${name} bytecode formatı doğru`, 'success')
    return true
  }

  const deployToken = async (): Promise<void> => {
    try {
      setDeploying(true)
      setLogs([])
      setDeployedAddress('')

      addLog('🚀 ERC20 Token Deployment Başlatılıyor...', 'info')
      addLog(`Token: "${tokenName}" (${tokenSymbol})`, 'info')
      addLog(`Arz: ${tokenSupply} token`, 'info')

      // Validate parameters
      if (!validateTokenParams()) {
        return
      }

      // Validate bytecode
      if (!validateBytecode(TOKEN_BYTECODE, 'Token')) {
        return
      }

      // Check wallet
      if (!walletClient || !publicClient || !address) {
        throw new Error('Cüzdan bağlı değil')
      }

      addLog(`Cüzdan: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success')

      // Test RPC connection
      await testRpcConnection()

      // Step 1: Balance check with minimum requirement
      const walletBalance = await publicClient.getBalance({ address })
      const ethBalance = Number(walletBalance) / 1e18
      addLog(`✅ Bakiye Kontrolü: ${ethBalance.toFixed(6)} ETH`, 'success')

      const minimumBalance = 0.001 // 0.001 ETH minimum
      if (ethBalance < minimumBalance) {
        throw new Error(`❌ Yetersiz bakiye: ${ethBalance.toFixed(6)} ETH\n💡 Minimum ${minimumBalance} ETH gerekli`)
      }

      if (ethBalance < 0.01) {
        addLog('⚠️ Bakiye düşük ama yeterli olabilir', 'warning')
      }

      // Get network info
      const chainId = await publicClient.getChainId()
      addLog(`Chain ID: ${chainId}`, 'info')

      if (chainId !== 91342) {
        addLog('⚠️ UYARI: Giwa Sepolia (91342) değil!', 'warning')
      }

      // Step 2: Get fee data (gas price)
      addLog('⚙️ Gas ücret bilgileri alınıyor...', 'info')
      const gasPrice = await publicClient.getGasPrice()
      const gasPriceGwei = Number(gasPrice) / 1e9
      addLog(`✅ Gas Fiyatı: ${gasPriceGwei.toFixed(2)} Gwei`, 'success')

      // Step 3: Prepare constructor parameters with detailed logging
      addLog('📝 Constructor parametreleri hazırlanıyor...', 'info')
      const supplyInWei = parseUnits(tokenSupply, 18)
      
      // Log each parameter separately for debugging
      addLog(`  ├─ name (string): "${tokenName}"`, 'info')
      addLog(`  ├─ symbol (string): "${tokenSymbol}"`, 'info')
      addLog(`  └─ totalSupply (uint256): ${supplyInWei.toString()}`, 'info')
      addLog(`     (${tokenSupply} tokens × 10^18 decimals)`, 'info')

      // Validate parameter types before encoding
      if (typeof tokenName !== 'string' || tokenName.length === 0) {
        throw new Error('Token adı geçerli bir string olmalı')
      }
      if (typeof tokenSymbol !== 'string' || tokenSymbol.length === 0) {
        throw new Error('Token sembolü geçerli bir string olmalı')
      }
      if (supplyInWei <= 0n) {
        throw new Error('Token arzı 0\'dan büyük olmalı')
      }

      addLog('✅ Tüm parametreler geçerli', 'success')

      // Step 4: Encode deployment data with error handling
      addLog('🔧 Deployment data encode ediliyor...', 'info')
      let deployData: Hex
      
      try {
        deployData = encodeDeployData({
          abi: TOKEN_ABI,
          bytecode: TOKEN_BYTECODE,
          args: [tokenName, tokenSymbol, supplyInWei]
        })
        
        addLog(`✅ Encoding başarılı: ${deployData.length} karakter`, 'success')
        addLog(`  ├─ Bytecode başlangıcı: ${deployData.slice(0, 12)}...`, 'info')
        addLog(`  ├─ Bytecode uzunluğu: ${TOKEN_BYTECODE.length} karakter`, 'info')
        addLog(`  └─ Constructor data uzunluğu: ${deployData.length - TOKEN_BYTECODE.length} karakter`, 'info')
      } catch (encodeError: any) {
        addLog(`❌ Encoding hatası: ${encodeError.message}`, 'error')
        throw new Error(`Constructor parametreleri encode edilemedi: ${encodeError.message}`)
      }

      // Step 5: Gas estimation with fallback
      let gasLimit = BigInt(manualGasLimit)
      let gasEstimationSuccess = false

      if (!skipGasEstimation) {
        try {
          addLog('⛽ Gas tahmini yapılıyor...', 'info')
          const estimated = await publicClient.estimateGas({
            account: address,
            to: null,
            data: deployData,
          })
          gasLimit = (estimated * 150n) / 100n // 50% safety buffer
          gasEstimationSuccess = true
          addLog(`✅ Gas tahmin edildi: ${estimated.toString()}`, 'success')
          addLog(`  └─ Buffer ile: ${gasLimit.toString()} (+ %50 güvenlik)`, 'info')
        } catch (err: any) {
          addLog(`⚠️ Gas tahmini başarısız: ${err.shortMessage || err.message}`, 'warning')
          
          // Check for specific gas estimation errors
          if (err.message?.includes('revert') || err.message?.includes('execution reverted')) {
            addLog('⚠️ Constructor revert hatası algılandı!', 'error')
            addLog('💡 Bu genellikle şunları gösterir:', 'warning')
            addLog('   1. Constructor parametreleri hatalı', 'warning')
            addLog('   2. Bytecode ve parametreler uyumsuz', 'warning')
            addLog('   3. Contract içinde validation hatası', 'warning')
            throw new Error('Constructor parametreleri reddedildi - değerleri kontrol edin')
          }
          
          addLog(`  └─ Manuel gas limiti kullanılıyor: ${manualGasLimit}`, 'info')
          gasLimit = BigInt(manualGasLimit)
        }
      } else {
        addLog(`⚠️ Gas tahmini atlanıyor (manuel: ${manualGasLimit})`, 'warning')
      }

      // Calculate estimated cost
      const estimatedCostWei = gasLimit * gasPrice
      const estimatedCostEth = Number(estimatedCostWei) / 1e18
      addLog(`💰 Tahmini maliyet: ~${estimatedCostEth.toFixed(6)} ETH`, 'info')

      // Check if balance is sufficient for estimated cost
      if (estimatedCostWei > walletBalance) {
        throw new Error(`❌ Yetersiz bakiye!\n💰 Gerekli: ~${estimatedCostEth.toFixed(6)} ETH\n💳 Mevcut: ${ethBalance.toFixed(6)} ETH`)
      }

      // Step 6: Send deployment transaction
      addLog('📤 Deployment transaction gönderiliyor...', 'info')
      addLog(`  ├─ Gas Limit: ${gasLimit.toString()}`, 'info')
      addLog(`  ├─ Gas Price: ${gasPriceGwei.toFixed(2)} Gwei`, 'info')
      addLog(`  └─ Max Cost: ${estimatedCostEth.toFixed(6)} ETH`, 'info')

      let hash: Hex
      try {
        hash = await walletClient.sendTransaction({
          account: address,
          to: null,
          data: deployData,
          gas: gasLimit,
          gasPrice: gasPrice
        })
        addLog(`✅ TX gönderildi: ${hash}`, 'success')
      } catch (txError: any) {
        if (txError.message?.includes('user rejected')) {
          throw new Error('❌ Transaction kullanıcı tarafından reddedildi')
        }
        throw txError
      }

      // Step 7: Wait for confirmation
      addLog('⏳ Onay bekleniyor (max 2 dakika)...', 'info')
      addLog(`  └─ TX Hash: ${hash.slice(0, 10)}...${hash.slice(-8)}`, 'info')

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120000
      })

      // Step 8: Verify deployment
      if (receipt.status === 'success' && receipt.contractAddress) {
        const actualCostWei = receipt.gasUsed * gasPrice
        const actualCostEth = Number(actualCostWei) / 1e18
        
        addLog('═══════════════════════════════', 'success')
        addLog('🎉 TOKEN CONTRACT BAŞARIYLA DEPLOY EDİLDİ!', 'success')
        addLog('═══════════════════════════════', 'success')
        addLog(`📍 Contract Adresi: ${receipt.contractAddress}`, 'success')
        addLog(`⛽ Kullanılan Gas: ${receipt.gasUsed.toString()}`, 'info')
        addLog(`💰 Gerçek Maliyet: ${actualCostEth.toFixed(6)} ETH`, 'info')
        
        if (gasEstimationSuccess) {
          const efficiency = (Number(receipt.gasUsed) / Number(gasLimit)) * 100
          addLog(`📊 Gas Verimliliği: ${efficiency.toFixed(1)}%`, 'info')
        }
        
        setDeployedAddress(receipt.contractAddress)
      } else {
        throw new Error(`Transaction başarısız oldu\nStatus: ${receipt.status}\nTX: ${hash}`)
      }
    } catch (err) {
      const error = err as any
      addLog('═══════════════════════════════', 'error')
      addLog(`❌ DEPLOYMENT HATASI`, 'error')
      addLog('═══════════════════════════════', 'error')
      addLog(`Hata: ${error.message || error.shortMessage || 'Bilinmeyen hata'}`, 'error')
      
      // Enhanced error analysis
      if (error.message?.includes('insufficient funds')) {
        addLog('', 'error')
        addLog('💡 ÇÖZÜM:', 'warning')
        addLog('  1. Cüzdanınıza daha fazla ETH ekleyin', 'warning')
        addLog('  2. Faucet: https://faucet.lambda256.io', 'warning')
      } else if (error.message?.includes('gas')) {
        addLog('', 'error')
        addLog('💡 ÇÖZÜM:', 'warning')
        addLog('  1. Manuel gas limitini artırın (ör: 10000000)', 'warning')
        addLog('  2. Veya azaltın (ör: 5000000)', 'warning')
        addLog('  3. Gas tahminini açıp tekrar deneyin', 'warning')
      } else if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
        addLog('', 'error')
        addLog('💡 ÇÖZÜM:', 'warning')
        addLog('  1. Constructor parametrelerini kontrol edin:', 'warning')
        addLog(`     - Name: "${tokenName}"`, 'warning')
        addLog(`     - Symbol: "${tokenSymbol}"`, 'warning')
        addLog(`     - Supply: ${tokenSupply}`, 'warning')
        addLog('  2. Bytecode doğru compile edilmiş mi kontrol edin', 'warning')
        addLog('  3. Solidity versiyonu 0.8.20 olmalı', 'warning')
      } else if (error.message?.includes('nonce')) {
        addLog('', 'error')
        addLog('💡 ÇÖZÜM:', 'warning')
        addLog('  1. Sayfayı yenileyin', 'warning')
        addLog('  2. Cüzdanı tekrar bağlayın', 'warning')
      }
      
      console.error('━━━ Deployment Error Details ━━━')
      console.error('Error:', err)
      console.error('Token Name:', tokenName)
      console.error('Token Symbol:', tokenSymbol)
      console.error('Token Supply:', tokenSupply)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } finally {
      setDeploying(false)
    }
  }

  const deployNFT = async (): Promise<void> => {
    try {
      setDeploying(true)
      setLogs([])
      setDeployedAddress('')

      addLog('🚀 ERC721 NFT Deployment Başlatılıyor...', 'info')
      addLog(`NFT: "${nftName}" (${nftSymbol})`, 'info')

      // Validate parameters
      if (!validateNftParams()) {
        return
      }

      // Validate bytecode
      if (!validateBytecode(NFT_BYTECODE, 'NFT')) {
        return
      }

      // Check wallet
      if (!walletClient || !publicClient || !address) {
        throw new Error('Cüzdan bağlı değil')
      }

      addLog(`Cüzdan: ${address.slice(0, 6)}...${address.slice(-4)}`, 'success')

      // Test RPC connection
      await testRpcConnection()

      // Check balance
      const walletBalance = await publicClient.getBalance({ address })
      const ethBalance = Number(walletBalance) / 1e18
      addLog(`Bakiye: ${ethBalance.toFixed(6)} ETH`, 'info')

      if (walletBalance === 0n) {
        throw new Error('❌ Yetersiz bakiye - Faucet\'ten ETH alın')
      }

      if (ethBalance < 0.01) {
        addLog('⚠️ Bakiye çok düşük - Deployment için yeterli olmayabilir', 'warning')
      }

      // Get network info
      const chainId = await publicClient.getChainId()
      addLog(`Chain ID: ${chainId}`, 'info')

      if (chainId !== 91342) {
        addLog('⚠️ UYARI: Giwa Sepolia (91342) değil!', 'warning')
      }

      // Get gas price
      const gasPrice = await publicClient.getGasPrice()
      const gasPriceGwei = Number(gasPrice) / 1e9
      addLog(`Gas Fiyatı: ${gasPriceGwei.toFixed(2)} Gwei`, 'info')

      // Encode constructor parameters
      addLog('Constructor parametreleri encode ediliyor...', 'info')
      addLog(`  → name: "${nftName}"`, 'info')
      addLog(`  → symbol: "${nftSymbol}"`, 'info')

      // Encode deployment data
      const deployData = encodeDeployData({
        abi: NFT_ABI,
        bytecode: NFT_BYTECODE,
        args: [nftName, nftSymbol]
      })

      addLog(`✅ Deploy data encode edildi: ${deployData.length} karakter`, 'info')
      addLog(`Bytecode başlangıcı: ${deployData.slice(0, 12)}...`, 'info')

      // Gas estimation or manual gas
      let gasLimit = BigInt(manualGasLimit)

      if (!skipGasEstimation) {
        try {
          addLog('Gas tahmin ediliyor...', 'info')
          const estimated = await publicClient.estimateGas({
            account: address,
            to: null,
            data: deployData,
          })
          gasLimit = (estimated * 120n) / 100n
          addLog(`✅ Gas tahmin edildi: ${gasLimit.toString()}`, 'success')
        } catch (err: any) {
          addLog(`⚠️ Gas tahmini başarısız: ${err.shortMessage || err.message}`, 'warning')
          addLog(`Manuel gas limiti kullanılıyor: ${manualGasLimit}`, 'info')
          gasLimit = BigInt(manualGasLimit)
        }
      } else {
        addLog(`Gas tahmini atlanıyor (manuel: ${manualGasLimit})`, 'warning')
      }

      const estimatedCostWei = gasLimit * gasPrice
      const estimatedCostEth = Number(estimatedCostWei) / 1e18
      addLog(`Tahmini maliyet: ~${estimatedCostEth.toFixed(6)} ETH`, 'info')

      // Send transaction
      addLog('📤 Deployment transaction gönderiliyor...', 'info')

      const hash = await walletClient.sendTransaction({
        account: address,
        to: null,
        data: deployData,
        gas: gasLimit,
        gasPrice: gasPrice
      })

      addLog(`✅ TX gönderildi: ${hash}`, 'success')
      addLog('⏳ Onay bekleniyor (max 2 dakika)...', 'info')

      // Wait for receipt
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120000
      })

      if (receipt.status === 'success' && receipt.contractAddress) {
        addLog('🎉 NFT contract başarıyla deploy edildi!', 'success')
        addLog(`📍 Contract Adresi: ${receipt.contractAddress}`, 'success')
        addLog(`⛽ Kullanılan Gas: ${receipt.gasUsed.toString()}`, 'info')
        addLog(`💰 Gerçek Maliyet: ${(Number(receipt.gasUsed * gasPrice) / 1e18).toFixed(6)} ETH`, 'info')
        setDeployedAddress(receipt.contractAddress)
      } else {
        throw new Error('Transaction başarısız oldu')
      }
    } catch (err) {
      const error = err as any
      addLog(`❌ Hata: ${error.shortMessage || error.message}`, 'error')
      
      // Common error messages
      if (error.message?.includes('insufficient funds')) {
        addLog('💡 Çözüm: Cüzdanınıza daha fazla ETH ekleyin', 'warning')
      } else if (error.message?.includes('gas')) {
        addLog('💡 Çözüm: Manuel gas limitini artırın veya azaltın', 'warning')
      } else if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
        addLog('💡 Çözüm: Constructor parametrelerini kontrol edin', 'warning')
        addLog('💡 veya bytecode doğru compile edilmiş mi kontrol edin', 'warning')
      }
      
      console.error('Deployment hatası:', err)
    } finally {
      setDeploying(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-[#1a1a1a] border-2 border-[#00ff00] rounded-lg">
        <p className="text-[#00ff00] font-mono">⚠️ Lütfen önce cüzdanınızı bağlayın</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Contract Type Selector */}
      <div className="bg-[#1a1a1a] border-2 border-[#00ff00] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#00ff00] mb-4 font-mono">
          ⚡ Çalışan Contract Deployer
        </h2>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setContractType('TOKEN')}
            className={`flex-1 py-3 px-4 rounded-lg font-mono font-bold transition-all ${
              contractType === 'TOKEN'
                ? 'bg-[#00ff00] text-black border-2 border-[#00ff00]'
                : 'bg-[#0a0a0a] text-[#00ff00] border-2 border-[#004400] hover:border-[#00ff00]'
            }`}
          >
            💰 ERC20 Token
          </button>
          <button
            type="button"
            onClick={() => setContractType('NFT')}
            className={`flex-1 py-3 px-4 rounded-lg font-mono font-bold transition-all ${
              contractType === 'NFT'
                ? 'bg-[#00ff00] text-black border-2 border-[#00ff00]'
                : 'bg-[#0a0a0a] text-[#00ff00] border-2 border-[#004400] hover:border-[#00ff00]'
            }`}
          >
            🖼️ ERC721 NFT
          </button>
        </div>

        {/* Token Form */}
        {contractType === 'TOKEN' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">Token Adı</label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="My Token"
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:border-[#00ff00] focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">Sembol</label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                placeholder="MTK"
                maxLength={11}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:border-[#00ff00] focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                Toplam Arz (token sayısı)
              </label>
              <input
                type="text"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1000000"
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:border-[#00ff00] focus:shadow-[0_0_10px_#00ff00]"
              />
              <p className="text-[#00ff00] text-xs font-mono mt-1 opacity-70">
                ✅ Otomatik olarak 18 decimal ile çarpılacak (parseUnits)
              </p>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-[#004400] pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[#00ff00] font-mono text-sm hover:text-white transition-colors"
              >
                {showAdvanced ? '▼' : '▶'} Gelişmiş Ayarlar
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-3 p-4 bg-[#0a0a0a] rounded-lg border border-[#004400]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="skipGas"
                      checked={skipGasEstimation}
                      onChange={(e) => setSkipGasEstimation(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="skipGas" className="text-[#00ff00] font-mono text-sm">
                      Gas tahminini atla (önerilen ✅)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#00ff00] font-mono text-xs mb-1">
                      Manuel Gas Limit
                    </label>
                    <input
                      type="text"
                      value={manualGasLimit}
                      onChange={(e) => setManualGasLimit(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="8000000"
                      className="w-full px-3 py-1 bg-[#1a1a1a] border border-[#00ff00] rounded text-[#00ff00] font-mono text-sm"
                    />
                    <p className="text-gray-500 text-xs mt-1 font-mono">
                      Token için 5-10M, NFT için 3-5M önerilir
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={deployToken}
              disabled={deploying}
              className="w-full bg-[#00ff00] text-black py-3 px-4 rounded-lg font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_#00ff00] transition-all"
            >
              {deploying ? '⏳ Deploy Ediliyor...' : '🚀 Token Deploy Et'}
            </button>
          </div>
        )}

        {/* NFT Form */}
        {contractType === 'NFT' && (
          <div className="space-y-4">
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">NFT Koleksiyon Adı</label>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="My NFT Collection"
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:border-[#00ff00] focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">Sembol</label>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value.toUpperCase())}
                placeholder="MNFT"
                maxLength={11}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:border-[#00ff00] focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-[#004400] pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[#00ff00] font-mono text-sm hover:text-white transition-colors"
              >
                {showAdvanced ? '▼' : '▶'} Gelişmiş Ayarlar
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-3 p-4 bg-[#0a0a0a] rounded-lg border border-[#004400]">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="skipGasNft"
                      checked={skipGasEstimation}
                      onChange={(e) => setSkipGasEstimation(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="skipGasNft" className="text-[#00ff00] font-mono text-sm">
                      Gas tahminini atla (önerilen ✅)
                    </label>
                  </div>

                  <div>
                    <label className="block text-[#00ff00] font-mono text-xs mb-1">
                      Manuel Gas Limit
                    </label>
                    <input
                      type="text"
                      value={manualGasLimit}
                      onChange={(e) => setManualGasLimit(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="8000000"
                      className="w-full px-3 py-1 bg-[#1a1a1a] border border-[#00ff00] rounded text-[#00ff00] font-mono text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={deployNFT}
              disabled={deploying}
              className="w-full bg-[#00ff00] text-black py-3 px-4 rounded-lg font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_#00ff00] transition-all"
            >
              {deploying ? '⏳ Deploy Ediliyor...' : '🚀 NFT Deploy Et'}
            </button>
          </div>
        )}
      </div>

      {/* Debug Logs */}
      {logs.length > 0 && (
        <div className="bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-[#00ff00] font-mono font-bold mb-3 flex items-center gap-2">
            <span className="animate-pulse">▶</span> Debug Logları
          </h3>
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`font-mono text-xs ${
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'success'
                    ? 'text-[#00ff00]'
                    : log.type === 'warning'
                    ? 'text-yellow-400'
                    : 'text-gray-400'
                }`}
              >
                <span className="text-gray-600">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Message */}
      {deployedAddress && (
        <div className="bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg p-6">
          <h3 className="text-[#00ff00] font-bold font-mono mb-2 flex items-center gap-2">
            <span className="text-2xl">🎉</span> Deployment Başarılı!
          </h3>
          <p className="text-sm text-[#00ff00] font-mono break-all bg-[#1a1a1a] p-3 rounded border border-[#004400]">
            {deployedAddress}
          </p>
          <a
            href={`https://sepolia-explorer.giwa.io/address/${deployedAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-sm text-[#00ff00] hover:text-white font-mono hover:underline transition-colors"
          >
            🔍 Explorer&apos;da Görüntüle →
          </a>
        </div>
      )}

      {/* Instructions */}
      {!TOKEN_BYTECODE.startsWith('0x6080') && (
        <div className="bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-6">
          <h3 className="text-yellow-400 font-bold font-mono mb-3">⚠️ Bytecode Eksik!</h3>
          <p className="text-yellow-300 font-mono text-sm mb-2">
            Bu deployer&apos;ı kullanabilmek için önce Remix&apos;te kontratları compile etmeniz gerekiyor.
          </p>
          <ol className="text-yellow-300 font-mono text-xs space-y-1 list-decimal list-inside">
            <li>contracts/REMIX-INSTRUCTIONS.md dosyasını açın</li>
            <li>Talimatları takip ederek bytecode&apos;ları alın</li>
            <li>src/components/WorkingDeployer.tsx dosyasına yapıştırın</li>
            <li>Deploy etmeye hazırsınız! 🚀</li>
          </ol>
        </div>
      )}
    </div>
  )
}
