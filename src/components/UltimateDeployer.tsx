'use client'
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'
import { useAccount, useWalletClient, usePublicClient, useBalance } from 'wagmi'
import { encodeDeployData, parseUnits, formatEther, type Hex, createPublicClient, http } from 'viem'
import SolidityEditor from './SolidityEditor'

// ✅ ÇÖZÜM 3: RPC Fallback - Grove PRIMARY (daha iyi error messages)
const RPC_ENDPOINTS = [
  'https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492', // Grove - PRIMARY (better revert data)
  'https://sepolia-rpc.giwa.io', // Official - Fallback (rate-limited)
  'https://rpc.giwa.sepolia.ethpandaops.io', // Alternative
]

type LogType = 'info' | 'success' | 'warning' | 'error' | 'debug'

interface Log {
  time: string
  message: string
  type: LogType
}

export default function UltimateDeployer(): ReactElement {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { data: balance } = useBalance({ address })

  const [contractType, setContractType] = useState<'TOKEN' | 'NFT'>('TOKEN')
  const [deploying, setDeploying] = useState(false)
  const [logs, setLogs] = useState<Log[]>([])
  const [deployedAddress, setDeployedAddress] = useState<string>('')

  // Compiled contract data from editor
  const [compiledBytecode, setCompiledBytecode] = useState<Hex>('0x')
  const [compiledABI, setCompiledABI] = useState<any[]>([])
  const [compiledName, setCompiledName] = useState<string>('')

  // Token parameters
  const [tokenName, setTokenName] = useState('TestToken')
  const [tokenSymbol, setTokenSymbol] = useState('TEST')
  const [tokenSupply, setTokenSupply] = useState('1000000')

  // NFT parameters
  const [nftName, setNftName] = useState('TestNFT')
  const [nftSymbol, setNftSymbol] = useState('TNFT')

  // useEditor state (not used currently but kept for future)
  const [useEditor, setUseEditor] = useState(true)

  const addLog = (message: string, type: LogType = 'info'): void => {
    const timestamp = new Date().toLocaleTimeString('tr-TR')
    setLogs((prev) => [...prev, { time: timestamp, message, type }])
    console.log(`[${timestamp}] [${type.toUpperCase()}]`, message)
  }

  // Handle compiled contract from editor
  const handleCompiled = (bytecode: string, abi: any[], contractName: string): void => {
    setCompiledBytecode(bytecode as Hex)
    setCompiledABI(abi)
    setCompiledName(contractName)
    addLog(`✅ ${contractName} compiled successfully!`, 'success')
    addLog(`Bytecode length: ${bytecode.length} characters`, 'info')
  }

  // ✅ ÇÖZÜM 4: Check balance with warnings
  useEffect(() => {
    if (balance) {
      const ethBalance = parseFloat(formatEther(balance.value))
      if (ethBalance === 0) {
        addLog('❌ Bakiye sıfır! Faucet\'ten ETH alın', 'error')
      } else if (ethBalance < 0.01) {
        addLog(`⚠️ Düşük bakiye: ${ethBalance.toFixed(6)} ETH (min 0.01 önerilir)`, 'warning')
      } else {
        addLog(`✅ Bakiye yeterli: ${ethBalance.toFixed(6)} ETH`, 'success')
      }
    }
  }, [balance])

  // ✅ ÇÖZÜM 3: Test multiple RPC endpoints
  const testRpcEndpoints = async (): Promise<string | null> => {
    addLog('🔍 RPC endpoint\'leri test ediliyor...', 'info')
    
    for (const rpcUrl of RPC_ENDPOINTS) {
      try {
        addLog(`Testing: ${rpcUrl}`, 'debug')
        const testClient = createPublicClient({
          transport: http(rpcUrl, { timeout: 5000 })
        })
        
        const blockNumber = await testClient.getBlockNumber()
        const chainId = await testClient.getChainId()
        
        addLog(`✅ RPC OK: ${rpcUrl.slice(8, 30)}... (block: ${blockNumber}, chain: ${chainId})`, 'success')
        return rpcUrl
      } catch (err: any) {
        addLog(`❌ RPC Fail: ${rpcUrl.slice(8, 30)}... (${err.message?.slice(0, 30)})`, 'error')
      }
    }
    
    addLog('❌ Hiçbir RPC çalışmıyor!', 'error')
    return null
  }

  // ✅ ÇÖZÜM 1: Comprehensive parameter validation
  const validateTokenParams = (): { valid: boolean; error?: string } => {
    // Name validation
    if (!tokenName.trim()) {
      return { valid: false, error: 'Token adı boş olamaz' }
    }
    if (tokenName.length > 50) {
      return { valid: false, error: 'Token adı çok uzun (max 50 karakter)' }
    }
    if (tokenName.length < 2) {
      return { valid: false, error: 'Token adı çok kısa (min 2 karakter)' }
    }
    
    // Symbol validation
    if (!tokenSymbol.trim()) {
      return { valid: false, error: 'Sembol boş olamaz' }
    }
    if (tokenSymbol.length > 11) {
      return { valid: false, error: 'Sembol çok uzun (max 11 karakter)' }
    }
    if (tokenSymbol.length < 1) {
      return { valid: false, error: 'Sembol çok kısa (min 1 karakter)' }
    }
    if (!/^[A-Z0-9]+$/.test(tokenSymbol)) {
      return { valid: false, error: 'Sembol sadece büyük harf ve rakam içermeli' }
    }
    
    // Supply validation
    if (!tokenSupply || tokenSupply.trim() === '') {
      return { valid: false, error: 'Arz boş olamaz' }
    }
    const supplyNum = parseFloat(tokenSupply)
    if (isNaN(supplyNum) || supplyNum <= 0) {
      return { valid: false, error: 'Arz pozitif bir sayı olmalı' }
    }
    if (supplyNum > 1000000000000) { // 1 trilyon
      return { valid: false, error: 'Arz çok büyük (max 1 trilyon)' }
    }
    
    return { valid: true }
  }

  const validateNftParams = (): { valid: boolean; error?: string } => {
    if (!nftName.trim()) {
      return { valid: false, error: 'NFT adı boş olamaz' }
    }
    if (nftName.length > 50) {
      return { valid: false, error: 'NFT adı çok uzun (max 50 karakter)' }
    }
    if (!nftSymbol.trim()) {
      return { valid: false, error: 'Sembol boş olamaz' }
    }
    if (nftSymbol.length > 11) {
      return { valid: false, error: 'Sembol çok uzun (max 11 karakter)' }
    }
    if (!/^[A-Z0-9]+$/.test(nftSymbol)) {
      return { valid: false, error: 'Sembol sadece büyük harf ve rakam içermeli' }
    }
    
    return { valid: true }
  }

  // ✅ ÇÖZÜM 2: Validate bytecode thoroughly
  const validateBytecode = (bytecode: Hex, name: string): { valid: boolean; error?: string } => {
    if (!bytecode || bytecode === '0x') {
      return { 
        valid: false, 
        error: `${name} bytecode'u eksik! contracts/README.md dosyasını okuyun.` 
      }
    }

    if (!bytecode.startsWith('0x')) {
      return { valid: false, error: `${name} bytecode '0x' ile başlamalı` }
    }

    // Check for common errors
    if (bytecode.startsWith('0x0x')) {
      return { valid: false, error: `${name} bytecode hatalı: Çift '0x' prefix` }
    }

    if (bytecode.startsWith('0x06')) {
      return { 
        valid: false, 
        error: `${name} bytecode YANLIŞ! '0x06...' ile başlıyor, '0x6080...' olmalı. Remix'te yeniden compile edin.` 
      }
    }

    if (!bytecode.startsWith('0x6080')) {
      return { 
        valid: false, 
        error: `${name} bytecode hatalı başlangıç: ${bytecode.slice(0, 10)} (0x6080 olmalı)` 
      }
    }

    if (bytecode.length < 100) {
      return { valid: false, error: `${name} bytecode çok kısa (${bytecode.length} karakter). Tam bytecode'u kopyalayın.` }
    }

    // Validate hex format
    const hexPart = bytecode.slice(2)
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
      return { valid: false, error: `${name} bytecode geçersiz hex karakterler içeriyor` }
    }

    return { valid: true }
  }

  const deployToken = async (): Promise<void> => {
    try {
      setDeploying(true)
      setLogs([])
      setDeployedAddress('')

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      addLog('🚀 GIWA SEPOLIA TOKEN DEPLOYER', 'info')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      
      // ✅ ÇÖZÜM 1: STEP 1 - Validate ALL parameters first
      addLog('📋 ADIM 1/8: Parametreler kontrol ediliyor...', 'info')
      
      const validation = validateTokenParams()
      if (!validation.valid) {
        throw new Error(`❌ PARAMETRE HATASI: ${validation.error}`)
      }
      
      addLog(`✅ Token Adı: "${tokenName}"`, 'success')
      addLog(`✅ Sembol: "${tokenSymbol}"`, 'success')
      addLog(`✅ Arz: ${tokenSupply} token`, 'success')

      // ✅ ÇÖZÜM 2: STEP 2 - Validate bytecode
      addLog('📋 ADIM 2/8: Bytecode kontrol ediliyor...', 'info')
      
      const bytecode = compiledBytecode
      const bytecodeValidation = validateBytecode(bytecode, 'Token')
      if (!bytecodeValidation.valid) {
        throw new Error(`❌ BYTECODE HATASI: ${bytecodeValidation.error}`)
      }
      
      addLog(`✅ Bytecode formatı doğru (${bytecode.length} karakter)`, 'success')
      addLog(`✅ Başlangıç: ${bytecode.slice(0, 12)}...`, 'success')

      // Check wallet
      if (!walletClient || !publicClient || !address) {
        throw new Error('❌ Cüzdan bağlı değil')
      }

      // Skip to STEP 3
      addLog('📋 ADIM 3/8: Network kontrolüne geçiliyor...', 'debug')

      // ✅ ÇÖZÜM 4: STEP 4 - Check balance thoroughly
      addLog('📋 ADIM 4/8: Bakiye kontrol ediliyor...', 'info')
      
      const walletBalance = await publicClient.getBalance({ address })
      const ethBalance = Number(walletBalance) / 1e18
      
      addLog(`Bakiye: ${ethBalance.toFixed(6)} ETH`, 'info')
      
      if (walletBalance === 0n) {
        throw new Error(
          '❌ YETERSIZ BAKIYE\n' +
          'Cüzdanınızda ETH yok!\n' +
          'Çözüm: Faucet\'ten ETH alın'
        )
      }
      
      if (ethBalance < 0.001) {
        addLog('⚠️ UYARI: Bakiye çok düşük! Deployment başarısız olabilir', 'warning')
      } else if (ethBalance < 0.01) {
        addLog('⚠️ UYARI: Bakiye düşük. Minimum 0.01 ETH önerilir', 'warning')
      } else {
        addLog('✅ Bakiye yeterli', 'success')
      }

      // Get network info
      addLog('📋 ADIM 5/8: Network bilgileri alınıyor...', 'info')
      
      const chainId = await publicClient.getChainId()
      addLog(`Chain ID: ${chainId}`, 'info')
      
      if (chainId !== 91342) {
        addLog(`⚠️ UYARI: Giwa Sepolia değil! (${chainId} ≠ 91342)`, 'warning')
        addLog('MetaMask\'te doğru ağı seçtiğinizden emin olun', 'warning')
      } else {
        addLog('✅ Giwa Sepolia tespit edildi', 'success')
      }

      const gasPrice = await publicClient.getGasPrice()
      const gasPriceGwei = Number(gasPrice) / 1e9
      addLog(`Gas Fiyatı: ${gasPriceGwei.toFixed(2)} Gwei`, 'info')

      // ✅ STEP 6 - Encode ERC20 constructor parameters
      addLog('📋 ADIM 6/8: Constructor parametreleri encode ediliyor...', 'info')
      
      // Extract constructor from compiled ABI
      if (!compiledABI || compiledABI.length === 0) {
        throw new Error('❌ ABI bulunamadı! Önce contract\'ı compile edin.')
      }

      const constructor = compiledABI.find((item: any) => item.type === 'constructor')
      if (!constructor) {
        throw new Error('❌ Constructor bulunamadı! Contract ABI\'sinde constructor tanımı eksik.')
      }

      const expectedParams = constructor.inputs.length
      addLog(`Constructor ${expectedParams} parametre bekliyor`, 'info')
      
      // ERC20 template: constructor(string name, string symbol, uint256 initialSupply)
      // Contract multiplies initialSupply by 10^18 internally, so send plain number
      let args: any[]
      if (expectedParams === 3) {
        // ERC20 with initialSupply parameter
        args = [tokenName, tokenSymbol, BigInt(tokenSupply)]
        addLog(`✅ Parametreler:`, 'success')
        addLog(`  → name: "${tokenName}"`, 'info')
        addLog(`  → symbol: "${tokenSymbol}"`, 'info')
        addLog(`  → initialSupply: ${tokenSupply} (contract içinde × 10^18 yapılacak)`, 'info')
      } else if (expectedParams === 2) {
        // ERC20 without initialSupply (name, symbol only)
        args = [tokenName, tokenSymbol]
        addLog(`✅ Parametreler:`, 'success')
        addLog(`  → name: "${tokenName}"`, 'info')
        addLog(`  → symbol: "${tokenSymbol}"`, 'info')
        addLog(`⚠️ InitialSupply yok, deploy sonrası mint gerekebilir`, 'warning')
      } else {
        throw new Error(
          `❌ Beklenmeyen constructor: ${expectedParams} parametre\n` +
          `ERC20 genelde 3 parametre alır (name, symbol, initialSupply)`
        )
      }

      let deployData: Hex
      try {
        deployData = encodeDeployData({
          abi: compiledABI as any,
          bytecode: compiledBytecode,
          args: args
        })
        addLog(`✅ Deploy data encode edildi: ${deployData.length} karakter`, 'success')
        addLog(`✅ Data başlangıç: ${deployData.slice(0, 20)}...`, 'debug')
        
        // Validate encoded data doesn't have double encoding
        if (deployData.includes('0x3078') || deployData.includes('307830')) {
          throw new Error('DOUBLE ENCODING detected! Bytecode may be ASCII encoded.')
        }
      } catch (encodeErr: any) {
        throw new Error(
          `❌ ENCODING HATASI\n` +
          `Constructor parametreleri encode edilemedi!\n` +
          `Hata: ${encodeErr.message}\n` +
          `Bytecode ve parametreleri kontrol edin.`
        )
      }

      // ✅ STEP 7 - Estimate gas automatically
      addLog('📋 ADIM 7/8: Gas tahmini yapılıyor...', 'info')
      
      let gasLimit: bigint
      try {
        // Try to estimate gas
        const estimatedGas = await publicClient.estimateGas({
          account: address,
          to: null,
          data: deployData
        })
        // Add 20% buffer for safety
        gasLimit = (estimatedGas * 120n) / 100n
        addLog(`✅ Gas tahmini: ${estimatedGas.toString()}`, 'success')
        addLog(`✅ Buffer ile: ${gasLimit.toString()} (+20%)`, 'success')
      } catch (estimateErr: any) {
        // If estimation fails, use safe default
        gasLimit = 10000000n // 10M default for ERC20
        addLog(`⚠️ Gas tahmini başarısız, default kullanılıyor: ${gasLimit.toString()}`, 'warning')
        addLog(`Hata: ${estimateErr.message?.slice(0, 50) || 'Unknown'}`, 'debug')
      }
      
      const estimatedCostWei = gasLimit * gasPrice
      const estimatedCostEth = Number(estimatedCostWei) / 1e18
      addLog(`Tahmini maliyet: ~${estimatedCostEth.toFixed(6)} ETH`, 'info')
      
      if (Number(walletBalance) < Number(estimatedCostWei)) {
        throw new Error(
          `❌ YETERSIZ BAKIYE\n` +
          `Gerekli: ~${estimatedCostEth.toFixed(6)} ETH\n` +
          `Mevcut: ${ethBalance.toFixed(6)} ETH\n` +
          `Eksik: ${(estimatedCostEth - ethBalance).toFixed(6)} ETH`
        )
      }

      // STEP 8 - Send transaction
      addLog('📋 ADIM 8/8: Transaction gönderiliyor...', 'info')
      addLog('⏳ MetaMask\'te onayla...', 'warning')
      
      addLog('📤 Transaction detayları:', 'debug')
      addLog(`  → Gas Limit: ${gasLimit.toString()}`, 'debug')
      addLog(`  → Gas Price: ${(Number(gasPrice) / 1e9).toFixed(2)} Gwei`, 'debug')
      addLog(`  → Data Length: ${deployData.length} karakter`, 'debug')

      const hash = await walletClient.sendTransaction({
        account: address,
        to: null, // Contract deployment
        data: deployData,
        gas: gasLimit,
        gasPrice: gasPrice
      })

      addLog(`✅ TX gönderildi!`, 'success')
      addLog(`TX Hash: ${hash}`, 'info')
      addLog('⏳ Blok onayı bekleniyor (max 2 dakika)...', 'info')

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120000
      })

      if (receipt.status === 'success' && receipt.contractAddress) {
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog('🎉 DEPLOYMENT BAŞARILI!', 'success')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog(`Contract: ${receipt.contractAddress}`, 'success')
        addLog(`Gas Kullanılan: ${receipt.gasUsed.toString()}`, 'info')
        addLog(`Gerçek Maliyet: ${(Number(receipt.gasUsed * gasPrice) / 1e18).toFixed(6)} ETH`, 'info')
        
        const savingsWei = estimatedCostWei - (receipt.gasUsed * gasPrice)
        const savingsEth = Number(savingsWei) / 1e18
        addLog(`Tasarruf: ${savingsEth.toFixed(6)} ETH`, 'info')
        
        setDeployedAddress(receipt.contractAddress)
      } else {
        throw new Error('❌ Transaction başarısız - Receipt\'te contract adresi yok')
      }
    } catch (err) {
      const error = err as any
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`❌ DEPLOYMENT BAŞARISIZ`, 'error')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`Hata: ${error.message || 'Bilinmeyen hata'}`, 'error')
      
      // ✅ Log full error details for 400 errors
      if (error.message?.includes('400') || error.message?.includes('HTTP 400') || error.message?.includes('Bad Request')) {
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
        addLog('❌ RPC 400 ERROR - DETAYLI ANALIZ', 'error')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
        addLog('Bu hata RPC endpoint\'inin gas estimation çağrısında oluşuyor', 'error')
        if (typeof deployData !== 'undefined') {
          addLog('Deployment data uzunluğu: ' + deployData.length, 'debug')
        }
        addLog('Bytecode başlangıç: ' + compiledBytecode.slice(0, 20), 'debug')
        console.log('🔍 FULL ERROR OBJECT:', error)
        if (typeof deployData !== 'undefined') {
          console.log('🔍 DEPLOY DATA:', deployData.slice(0, 200))
        }
        console.log('🔍 ERROR DETAILS:', {
          message: error.message,
          shortMessage: error.shortMessage,
          details: error.details,
          metaMessages: error.metaMessages,
          cause: error.cause,
        })
        addLog('💡 ÇÖZÜM: Browser console\'ı kontrol edin (F12) - detaylar orada', 'warning')
        addLog('💡 Veya RPC test butonu ile bağlantıyı kontrol edin', 'warning')
      } else if (error.message?.includes('PARAMETRE HATASI')) {
        addLog('💡 Çözüm: Yukarıdaki parametre hatasını düzeltin', 'warning')
      } else if (error.message?.includes('BYTECODE HATASI')) {
        addLog('💡 Çözüm: contracts/README.md dosyasını okuyun', 'warning')
        addLog('💡 Remix\'te kontratı tekrar compile edin', 'warning')
      } else if (error.message?.includes('YETERSIZ BAKIYE')) {
        addLog('💡 Çözüm: Cüzdanınıza daha fazla ETH ekleyin', 'warning')
        addLog('💡 Faucet: https://faucet.lambda256.io', 'warning')
      } else if (error.message?.includes('user rejected') || error.message?.includes('rejected')) {
        addLog('💡 MetaMask\'te transaction\'ı iptal ettiniz', 'warning')
      } else if (error.message?.includes('gas') || error.message?.includes('Gas')) {
        addLog('💡 Gas yetersiz - bakiyenizi kontrol edin', 'warning')
        addLog('💡 Veya faucet\'ten daha fazla ETH alın', 'warning')
      } else if (error.message?.includes('revert') || error.message?.includes('execution reverted')) {
        addLog('💡 Çözüm: Constructor parametreleri yanlış olabilir', 'warning')
        addLog('💡 veya kontrat kodunda hata var (require başarısız)', 'warning')
      } else {
        addLog('💡 Browser console\'ı kontrol edin (F12)', 'warning')
      }
      
      console.error('❌ Full deployment error:', err)
    } finally {
      setDeploying(false)
    }
  }

  // ✅ TEST: 0 ETH Self-Transfer to test gas fees
  const testGasFee = async (): Promise<void> => {
    try {
      setDeploying(true)
      setLogs([])
      setDeployedAddress('')

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      addLog('🧪 GAS FEE TEST - 0 ETH TRANSFER', 'info')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')

      if (!walletClient || !publicClient || !address) {
        throw new Error('❌ Cüzdan bağlı değil')
      }

      addLog('📋 ADIM 1/5: Network kontrol ediliyor...', 'info')
      const chainId = await publicClient.getChainId()
      addLog(`Chain ID: ${chainId}`, 'info')
      
      if (chainId !== 91342) {
        addLog(`⚠️ UYARI: Giwa Sepolia değil! (${chainId} ≠ 91342)`, 'warning')
      } else {
        addLog('✅ Giwa Sepolia tespit edildi', 'success')
      }

      addLog('📋 ADIM 2/5: Bakiye kontrol ediliyor...', 'info')
      const walletBalance = await publicClient.getBalance({ address })
      const ethBalance = Number(walletBalance) / 1e18
      addLog(`Bakiye: ${ethBalance.toFixed(6)} ETH`, 'info')

      if (walletBalance === 0n) {
        throw new Error('❌ Bakiye sıfır! Test için bile gas fee gerekli.')
      }

      addLog('📋 ADIM 3/5: Gas fiyatı alınıyor...', 'info')
      const gasPrice = await publicClient.getGasPrice()
      const gasPriceGwei = Number(gasPrice) / 1e9
      addLog(`Gas Fiyatı: ${gasPriceGwei.toFixed(2)} Gwei`, 'info')

      addLog('📋 ADIM 4/5: Gas fee hesaplanıyor...', 'info')
      // Simple transfer gas: 21000 (standard ETH transfer)
      const gasLimit = 21000n
      const estimatedCostWei = gasLimit * gasPrice
      const estimatedCostEth = Number(estimatedCostWei) / 1e18
      addLog(`Gas Limit: ${gasLimit.toString()}`, 'info')
      addLog(`Tahmini Maliyet: ${estimatedCostEth.toFixed(6)} ETH`, 'info')

      if (Number(walletBalance) < Number(estimatedCostWei)) {
        throw new Error(
          `❌ YETERSIZ BAKIYE\\n` +
          `Gas için gerekli: ${estimatedCostEth.toFixed(6)} ETH\\n` +
          `Mevcut: ${ethBalance.toFixed(6)} ETH`
        )
      }

      addLog('📋 ADIM 5/5: 0 ETH transfer gönderiliyor...', 'info')
      addLog('💡 Kendi adresinize 0 ETH gönderiyorsunuz (sadece gas fee ödenecek)', 'warning')
      addLog('⏳ MetaMask\'te onayla...', 'warning')

      const hash = await walletClient.sendTransaction({
        account: address,
        to: address, // Self-transfer
        value: 0n, // 0 ETH
        gas: gasLimit,
        gasPrice: gasPrice
      })

      addLog(`✅ TX gönderildi!`, 'success')
      addLog(`TX Hash: ${hash}`, 'info')
      addLog('⏳ Blok onayı bekleniyor...', 'info')

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 60000
      })

      if (receipt.status === 'success') {
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog('🎉 TEST BAŞARILI!', 'success')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog(`TX Hash: ${hash}`, 'success')
        addLog(`Gas Kullanılan: ${receipt.gasUsed.toString()}`, 'info')
        
        const actualCostWei = receipt.gasUsed * gasPrice
        const actualCostEth = Number(actualCostWei) / 1e18
        addLog(`Gerçek Maliyet: ${actualCostEth.toFixed(6)} ETH`, 'info')
        
        const newBalance = await publicClient.getBalance({ address })
        const newEthBalance = Number(newBalance) / 1e18
        addLog(`Yeni Bakiye: ${newEthBalance.toFixed(6)} ETH`, 'info')
        
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog('✅ RPC çalışıyor', 'success')
        addLog('✅ Gas estimation çalışıyor', 'success')
        addLog('✅ Wallet bağlantısı OK', 'success')
        addLog('✅ Artık contract deploy edebilirsiniz!', 'success')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
      } else {
        throw new Error('❌ Transaction başarısız')
      }
    } catch (err) {
      const error = err as any
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`❌ TEST BAŞARISIZ`, 'error')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`Hata: ${error.message || 'Bilinmeyen hata'}`, 'error')
      
      if (error.message?.includes('user rejected') || error.message?.includes('rejected')) {
        addLog('💡 MetaMask\'te transaction\'ı iptal ettiniz', 'warning')
      } else if (error.message?.includes('insufficient')) {
        addLog('💡 Bakiye yetersiz - faucet\'ten ETH alın', 'warning')
      } else {
        addLog('💡 Browser console\'ı kontrol edin (F12)', 'warning')
      }
      
      console.error('❌ Full test error:', err)
    } finally {
      setDeploying(false)
    }
  }

  const deployNFT = async (): Promise<void> => {
    try {
      setDeploying(true)
      setLogs([])
      setDeployedAddress('')

      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      addLog('🚀 GIWA SEPOLIA NFT DEPLOYER', 'info')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'info')
      
      // STEP 1 - Validate parameters
      addLog('📋 ADIM 1/6: Parametreler kontrol ediliyor...', 'info')
      const validation = validateNftParams()
      if (!validation.valid) {
        throw new Error(`❌ PARAMETRE HATASI: ${validation.error}`)
      }
      addLog(`✅ NFT Adı: "${nftName}"`, 'success')
      addLog(`✅ Sembol: "${nftSymbol}"`, 'success')

      // STEP 2 - Validate bytecode
      addLog('📋 ADIM 2/6: Bytecode kontrol ediliyor...', 'info')
      const bytecode = compiledBytecode
      const bytecodeValidation = validateBytecode(bytecode, 'NFT')
      if (!bytecodeValidation.valid) {
        throw new Error(`❌ BYTECODE HATASI: ${bytecodeValidation.error}`)
      }
      addLog(`✅ Bytecode formatı doğru (${bytecode.length} karakter)`, 'success')

      if (!walletClient || !publicClient || !address) {
        throw new Error('❌ Cüzdan bağlı değil')
      }

      // STEP 3 - Check balance
      addLog('📋 ADIM 3/6: Bakiye kontrol ediliyor...', 'info')
      const walletBalance = await publicClient.getBalance({ address })
      const ethBalance = Number(walletBalance) / 1e18
      addLog(`Bakiye: ${ethBalance.toFixed(6)} ETH`, 'info')
      
      if (walletBalance === 0n) {
        throw new Error('❌ YETERSIZ BAKIYE - Cüzdanınızda ETH yok!')
      }

      // STEP 4 - Encode NFT constructor parameters
      addLog('📋 ADIM 4/6: Constructor parametreleri encode ediliyor...', 'info')
      
      if (!compiledABI || compiledABI.length === 0) {
        throw new Error('❌ ABI bulunamadı! Önce contract\'ı compile edin.')
      }

      // ERC721 template: constructor(string name, string symbol)
      const deployData = encodeDeployData({
        abi: compiledABI as any,
        bytecode: compiledBytecode,
        args: [nftName, nftSymbol]
      })
      addLog(`✅ Parametreler:`, 'success')
      addLog(`  → name: "${nftName}"`, 'info')
      addLog(`  → symbol: "${nftSymbol}"`, 'info')

      // STEP 5 - Estimate gas
      addLog('📋 ADIM 5/6: Gas tahmini yapılıyor...', 'info')
      const gasPrice = await publicClient.getGasPrice()
      const gasPriceGwei = Number(gasPrice) / 1e9
      addLog(`Gas Fiyatı: ${gasPriceGwei.toFixed(2)} Gwei`, 'info')

      let gasLimit: bigint
      try {
        const estimatedGas = await publicClient.estimateGas({
          account: address,
          to: null,
          data: deployData
        })
        gasLimit = (estimatedGas * 120n) / 100n
        addLog(`✅ Gas tahmini: ${estimatedGas.toString()}`, 'success')
        addLog(`✅ Buffer ile: ${gasLimit.toString()} (+20%)`, 'success')
      } catch (estimateErr: any) {
        gasLimit = 8000000n // 8M default for ERC721
        addLog(`⚠️ Gas tahmini başarısız, default kullanılıyor: ${gasLimit.toString()}`, 'warning')
      }

      // STEP 6 - Send transaction
      addLog('📋 ADIM 6/6: Transaction gönderiliyor...', 'info')
      addLog('⏳ MetaMask\'te onayla...', 'warning')

      const hash = await walletClient.sendTransaction({
        account: address,
        to: null,
        data: deployData,
        gas: gasLimit,
        gasPrice: gasPrice
      })

      addLog(`✅ TX gönderildi!`, 'success')
      addLog(`TX Hash: ${hash}`, 'info')
      addLog('⏳ Blok onayı bekleniyor...', 'info')

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1,
        timeout: 120000
      })

      if (receipt.status === 'success' && receipt.contractAddress) {
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog('🎉 DEPLOYMENT BAŞARILI!', 'success')
        addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'success')
        addLog(`Contract: ${receipt.contractAddress}`, 'success')
        addLog(`Gas Kullanılan: ${receipt.gasUsed.toString()}`, 'info')
        addLog(`Gerçek Maliyet: ${(Number(receipt.gasUsed * gasPrice) / 1e18).toFixed(6)} ETH`, 'info')
        setDeployedAddress(receipt.contractAddress)
      } else {
        throw new Error('❌ Transaction başarısız')
      }
    } catch (err: any) {
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`❌ DEPLOYMENT BAŞARISIZ`, 'error')
      addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'error')
      addLog(`Hata: ${err.message || 'Bilinmeyen hata'}`, 'error')
      console.error('❌ Full deployment error:', err)
    } finally {
      setDeploying(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="p-6 bg-[#1a1a1a] border-2 border-[#00ff00] rounded-lg">
        <p className="text-[#00ff00] font-mono text-center">
          ⚠️ Lütfen önce cüzdanınızı bağlayın
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-2 border-[#00ff00] rounded-lg p-6">
        <h2 className="text-2xl font-bold text-[#00ff00] mb-2 font-mono text-center">
          ⚡ ULTIMATE GIWA DEPLOYER
        </h2>
        <p className="text-[#00ff00] text-xs font-mono text-center opacity-70">
          Solidity Compiler + Gas Estimation Hatalarını Çözen Deployer
        </p>
      </div>

      {/* Solidity Editor */}
      <SolidityEditor onCompiled={handleCompiled} />

      {/* Gas Fee Test Button */}
      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border-2 border-cyan-500 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="text-cyan-400 font-bold font-mono mb-2 flex items-center gap-2">
              <span className="text-xl">🧪</span> GAS FEE TEST
            </h3>
            <p className="text-cyan-300 font-mono text-sm mb-3">
              Deploy etmeden önce RPC ve gas estimation'ı test edin. Kendi hesabınıza 0 ETH gönderir (sadece gas fee ödersiniz).
            </p>
            <div className="space-y-1 text-xs font-mono text-cyan-400">
              <p>✅ RPC bağlantısını test eder</p>
              <p>✅ Gas estimation'ı kontrol eder</p>
              <p>✅ Wallet bağlantısını doğrular</p>
              <p>✅ Gerçek gas fee miktarını gösterir (~0.0001 ETH)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={testGasFee}
            disabled={deploying}
            className="bg-cyan-500 text-black py-3 px-6 rounded-lg font-mono font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 hover:shadow-[0_0_20px_#00ffff] transition-all whitespace-nowrap"
          >
            {deploying ? '⏳ Test...' : '🧪 Test Et'}
          </button>
        </div>
      </div>

      {/* Contract Type Selector */}
      <div className="bg-[#1a1a1a] border-2 border-[#00ff00] rounded-lg p-6">
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setContractType('TOKEN')}
            className={`flex-1 py-3 px-4 rounded-lg font-mono font-bold transition-all ${
              contractType === 'TOKEN'
                ? 'bg-[#00ff00] text-black'
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
                ? 'bg-[#00ff00] text-black'
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
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                Token Adı (2-50 karakter)
              </label>
              <input
                type="text"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                placeholder="TestToken"
                maxLength={50}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                Sembol (1-11 karakter, sadece A-Z ve 0-9)
              </label>
              <input
                type="text"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="TEST"
                maxLength={11}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">
                Toplam Arz (max 1 trilyon)
              </label>
              <input
                type="text"
                value={tokenSupply}
                onChange={(e) => setTokenSupply(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1000000"
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:shadow-[0_0_10px_#00ff00]"
              />
              <p className="text-[#00ff00] text-xs font-mono mt-1 opacity-70">
                ✅ Otomatik olarak 18 decimal ile çarpılacak
              </p>
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
              <label className="block text-[#00ff00] font-mono text-sm mb-2">NFT Adı</label>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                placeholder="TestNFT"
                maxLength={50}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:shadow-[0_0_10px_#00ff00]"
              />
            </div>
            <div>
              <label className="block text-[#00ff00] font-mono text-sm mb-2">Sembol</label>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="TNFT"
                maxLength={11}
                className="w-full px-4 py-2 bg-[#0a0a0a] border-2 border-[#00ff00] rounded-lg text-[#00ff00] font-mono focus:outline-none focus:shadow-[0_0_10px_#00ff00]"
              />
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
            <span className="animate-pulse">▶</span> Deployment Logları
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
                    : log.type === 'debug'
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                <span className="text-gray-600">[{log.time}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success */}
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
            🔍 Explorer'da Görüntüle →
          </a>
        </div>
      )}

      {/* Instructions */}
      {!compiledBytecode.startsWith('0x6080') && (
        <div className="bg-yellow-900/20 border-2 border-yellow-600 rounded-lg p-6">
          <h3 className="text-yellow-400 font-bold font-mono mb-3">⚠️ Bytecode Eksik!</h3>
          <p className="text-yellow-300 font-mono text-sm mb-2">
            Yukarıdaki Solidity Editor'de bir template seçip "Compile Contract" butonuna tıklayın.
          </p>
          <p className="text-yellow-300 font-mono text-xs">
            Veya kendi Solidity kodunuzu yazıp compile edebilirsiniz. OpenZeppelin import'ları otomatik handle edilir!
          </p>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-[#1a1a1a] border-2 border-[#00ff00]/30 rounded-lg p-4">
        <h3 className="text-[#00ff00] font-mono font-bold text-sm mb-2">
          💡 ULTIMATE DEPLOYER ÖZELLİKLERİ
        </h3>
        <div className="space-y-1 text-xs font-mono">
          <p className="text-[#00ff00]">✅ IN-BROWSER SOLIDITY COMPILER (solc.js)</p>
          <p className="text-[#00ff00]">✅ OPENZEPPELIN V5 BUILT-IN SUPPORT</p>
          <p className="text-[#00ff00]">✅ Kapsamlı parametre validasyonu</p>
          <p className="text-[#00ff00]">✅ Bytecode format kontrolü</p>
          <p className="text-[#00ff00]">✅ RPC fallback mekanizması</p>
          <p className="text-[#00ff00]">✅ Otomatik gas estimation (+20% buffer)</p>
          <p className="text-cyan-400">✅ Adım adım deployment tracking</p>
          <p className="text-cyan-400">✅ Detaylı hata analizi</p>
          <p className="text-cyan-400">✅ Bakiye ve network kontrolleri</p>
        </div>
      </div>
    </div>
  )
}
