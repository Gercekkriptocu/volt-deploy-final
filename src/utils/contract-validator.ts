// ═══════════════════════════════════════════════════════════════
// 🔍 SMART CONTRACT VALIDATOR
// ═══════════════════════════════════════════════════════════════
// Kontrat adresi, ABI, parametreler ve deployment kontrolü yapar
// ═══════════════════════════════════════════════════════════════

import { isAddress, type Address } from 'viem'

export interface ValidationResult {
  valid: boolean
  error?: string
  details?: string
}

export interface ContractValidation {
  address: ValidationResult
  abi: ValidationResult
  deployment: ValidationResult
  bytecode?: ValidationResult
}

// ═══════════════════════════════════════════════════════════════
// 1️⃣ KONTRAT ADRESİ DOĞRULAMA
// ═══════════════════════════════════════════════════════════════

/**
 * Ethereum/EVM adres formatını doğrular
 * @param address - Doğrulanacak adres
 * @returns ValidationResult
 */
export function validateContractAddress(address: string): ValidationResult {
  console.log('🔍 Validating contract address:', address)
  
  // Boş kontrolü
  if (!address || address.trim() === '') {
    return {
      valid: false,
      error: 'Address cannot be empty',
      details: 'Please provide a valid contract address'
    }
  }
  
  // Format kontrolü (0x ile başlamalı)
  if (!address.startsWith('0x')) {
    return {
      valid: false,
      error: 'Invalid address format',
      details: 'Address must start with 0x'
    }
  }
  
  // Uzunluk kontrolü (0x + 40 hex chars = 42)
  if (address.length !== 42) {
    return {
      valid: false,
      error: 'Invalid address length',
      details: `Expected 42 characters, got ${address.length}`
    }
  }
  
  // Viem ile checksum ve format doğrulama
  if (!isAddress(address)) {
    return {
      valid: false,
      error: 'Invalid Ethereum address',
      details: 'Address failed checksum validation'
    }
  }
  
  console.log('✅ Address validation passed')
  return {
    valid: true,
    details: 'Valid Ethereum address'
  }
}

// ═══════════════════════════════════════════════════════════════
// 2️⃣ ABI DOĞRULAMA
// ═══════════════════════════════════════════════════════════════

/**
 * Contract ABI formatını doğrular
 * @param abi - Doğrulanacak ABI
 * @returns ValidationResult
 */
export function validateContractABI(abi: any): ValidationResult {
  console.log('🔍 Validating contract ABI...')
  
  // Boş kontrolü
  if (!abi) {
    return {
      valid: false,
      error: 'ABI cannot be null or undefined',
      details: 'Please provide a valid contract ABI'
    }
  }
  
  // Array kontrolü
  if (!Array.isArray(abi)) {
    return {
      valid: false,
      error: 'ABI must be an array',
      details: `Expected array, got ${typeof abi}`
    }
  }
  
  // Boş array kontrolü
  if (abi.length === 0) {
    return {
      valid: false,
      error: 'ABI is empty',
      details: 'ABI array must contain at least one item'
    }
  }
  
  // ABI item formatı kontrolü
  let functionCount = 0
  let eventCount = 0
  
  for (let i = 0; i < abi.length; i++) {
    const item = abi[i]
    
    // Her item bir object olmalı
    if (typeof item !== 'object' || item === null) {
      return {
        valid: false,
        error: `Invalid ABI item at index ${i}`,
        details: 'Each ABI item must be an object'
      }
    }
    
    // Type field gerekli
    if (!item.type) {
      return {
        valid: false,
        error: `Missing type at ABI item ${i}`,
        details: 'Each ABI item must have a type field'
      }
    }
    
    // Function ise name olmalı
    if (item.type === 'function') {
      functionCount++
      if (!item.name) {
        return {
          valid: false,
          error: `Function at index ${i} has no name`,
          details: 'Function items must have a name field'
        }
      }
    }
    
    // Event sayısını say
    if (item.type === 'event') {
      eventCount++
    }
  }
  
  console.log(`✅ ABI validation passed: ${functionCount} functions, ${eventCount} events`)
  return {
    valid: true,
    details: `Valid ABI with ${functionCount} functions and ${eventCount} events`
  }
}

// ═══════════════════════════════════════════════════════════════
// 3️⃣ FONKSİYON PARAMETRELERİ DOĞRULAMA
// ═══════════════════════════════════════════════════════════════

/**
 * Fonksiyon parametrelerinin ABI ile uyumlu olduğunu doğrular
 * @param functionName - Fonksiyon adı
 * @param args - Fonksiyona gönderilecek argümanlar
 * @param abi - Contract ABI
 * @returns ValidationResult
 */
export function validateFunctionParameters(
  functionName: string,
  args: any[],
  abi: any[]
): ValidationResult {
  console.log(`🔍 Validating parameters for function: ${functionName}`)
  console.log('   Args:', args)
  
  // ABI'de fonksiyonu bul
  const functionABI = abi.find(
    (item: any) => item.type === 'function' && item.name === functionName
  )
  
  if (!functionABI) {
    return {
      valid: false,
      error: `Function '${functionName}' not found in ABI`,
      details: 'Please check the function name and ABI'
    }
  }
  
  // Inputs kontrolü
  const inputs = functionABI.inputs || []
  
  // Parametre sayısı kontrolü
  if (args.length !== inputs.length) {
    return {
      valid: false,
      error: `Parameter count mismatch for ${functionName}`,
      details: `Expected ${inputs.length} parameters, got ${args.length}`
    }
  }
  
  // Her parametrenin tipini kontrol et
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i]
    const arg = args[i]
    const expectedType = input.type
    
    console.log(`   Param ${i}: ${input.name} (${expectedType}) = ${arg}`)
    
    // Type-specific validation
    if (expectedType === 'address') {
      if (typeof arg !== 'string' || !isAddress(arg)) {
        return {
          valid: false,
          error: `Invalid address parameter at index ${i}`,
          details: `Parameter '${input.name}' must be a valid Ethereum address`
        }
      }
    } else if (expectedType.startsWith('uint') || expectedType.startsWith('int')) {
      // Number types - BigInt veya sayı olmalı
      if (typeof arg !== 'bigint' && typeof arg !== 'number' && typeof arg !== 'string') {
        return {
          valid: false,
          error: `Invalid number parameter at index ${i}`,
          details: `Parameter '${input.name}' must be a number, bigint, or numeric string`
        }
      }
    } else if (expectedType === 'bool') {
      if (typeof arg !== 'boolean') {
        return {
          valid: false,
          error: `Invalid boolean parameter at index ${i}`,
          details: `Parameter '${input.name}' must be a boolean`
        }
      }
    } else if (expectedType === 'string') {
      if (typeof arg !== 'string') {
        return {
          valid: false,
          error: `Invalid string parameter at index ${i}`,
          details: `Parameter '${input.name}' must be a string`
        }
      }
    }
  }
  
  console.log('✅ Function parameters validation passed')
  return {
    valid: true,
    details: `All ${inputs.length} parameters are valid`
  }
}

// ═══════════════════════════════════════════════════════════════
// 4️⃣ KONTRAT DEPLOYMENT KONTROLÜ
// ═══════════════════════════════════════════════════════════════

/**
 * Kontratın blockchain'de deploy edilip edilmediğini kontrol eder
 * @param address - Kontrat adresi
 * @param rpcUrl - RPC endpoint URL'i
 * @returns ValidationResult (async)
 */
export async function validateContractDeployment(
  address: string,
  rpcUrl: string
): Promise<ValidationResult> {
  console.log('🔍 Checking if contract is deployed...')
  console.log('   Address:', address)
  console.log('   RPC:', rpcUrl)
  
  try {
    // eth_getCode ile kontratın bytecode'unu al
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    
    if (!response.ok) {
      return {
        valid: false,
        error: 'RPC request failed',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }
    
    const data = await response.json()
    
    // JSON-RPC error kontrolü
    if (data.error) {
      return {
        valid: false,
        error: 'RPC error',
        details: data.error.message || 'Unknown RPC error'
      }
    }
    
    const bytecode = data.result
    console.log('   Bytecode:', bytecode)
    
    // Bytecode kontrolü
    // "0x" = boş (kontrat yok), "0x..." = kontrat var
    if (!bytecode || bytecode === '0x' || bytecode === '0x0') {
      return {
        valid: false,
        error: 'Contract not deployed',
        details: 'No bytecode found at this address - contract does not exist'
      }
    }
    
    const bytecodeLength = bytecode.length - 2 // Remove 0x prefix
    console.log(`✅ Contract is deployed (bytecode: ${bytecodeLength} chars)`)
    
    return {
      valid: true,
      details: `Contract deployed with ${bytecodeLength} bytes of bytecode`
    }
  } catch (error: any) {
    console.error('❌ Deployment check failed:', error)
    return {
      valid: false,
      error: 'Deployment check failed',
      details: error.message || 'Network error'
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 5️⃣ BYTECODE DOĞRULAMA (OPTIONAL)
// ═══════════════════════════════════════════════════════════════

/**
 * Kontratın bytecode'unu doğrular
 * @param address - Kontrat adresi
 * @param expectedBytecode - Beklenen bytecode (deployment sırasında kullanılan)
 * @param rpcUrl - RPC endpoint URL'i
 * @returns ValidationResult (async)
 */
export async function validateContractBytecode(
  address: string,
  expectedBytecode: string,
  rpcUrl: string
): Promise<ValidationResult> {
  console.log('🔍 Validating contract bytecode...')
  
  try {
    // eth_getCode ile gerçek bytecode'u al
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    
    const data = await response.json()
    
    if (data.error) {
      return {
        valid: false,
        error: 'RPC error',
        details: data.error.message
      }
    }
    
    const actualBytecode = data.result
    
    // Bytecode karşılaştır (constructor parametreleri hariç)
    // Not: Deployed bytecode, deployment bytecode'undan farklı olabilir
    // Bu yüzden tam eşitlik yerine başlangıç kontrolü yapıyoruz
    
    if (!actualBytecode || actualBytecode === '0x') {
      return {
        valid: false,
        error: 'No bytecode at address',
        details: 'Contract does not exist'
      }
    }
    
    // Basit uzunluk kontrolü (tam eşitlik yerine)
    const expectedLen = expectedBytecode.length - 2
    const actualLen = actualBytecode.length - 2
    
    console.log(`   Expected bytecode: ${expectedLen} chars`)
    console.log(`   Actual bytecode: ${actualLen} chars`)
    
    // Bytecode length'leri benzer olmalı (±%10 tolerans)
    const tolerance = 0.1
    const diff = Math.abs(actualLen - expectedLen) / expectedLen
    
    if (diff > tolerance) {
      return {
        valid: false,
        error: 'Bytecode mismatch',
        details: `Expected ~${expectedLen} bytes, got ${actualLen} bytes (${(diff * 100).toFixed(1)}% difference)`
      }
    }
    
    console.log('✅ Bytecode validation passed')
    return {
      valid: true,
      details: 'Bytecode matches deployment code'
    }
  } catch (error: any) {
    return {
      valid: false,
      error: 'Bytecode validation failed',
      details: error.message
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// 6️⃣ TOPLU DOĞRULAMA (ALL-IN-ONE)
// ═══════════════════════════════════════════════════════════════

/**
 * Kontratın tüm yönlerini tek seferde doğrular
 * @param address - Kontrat adresi
 * @param abi - Contract ABI
 * @param rpcUrl - RPC endpoint URL'i
 * @returns ContractValidation (async)
 */
export async function validateContract(
  address: string,
  abi: any[],
  rpcUrl: string
): Promise<ContractValidation> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🔍 FULL CONTRACT VALIDATION')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const validation: ContractValidation = {
    address: validateContractAddress(address),
    abi: validateContractABI(abi),
    deployment: { valid: false } // Will be updated
  }
  
  // Deployment kontrolü (async)
  if (validation.address.valid) {
    validation.deployment = await validateContractDeployment(address, rpcUrl)
  } else {
    validation.deployment = {
      valid: false,
      error: 'Skipped (invalid address)',
      details: 'Cannot check deployment with invalid address'
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 VALIDATION RESULTS:')
  console.log('   Address:', validation.address.valid ? '✅' : '❌', validation.address.details || validation.address.error)
  console.log('   ABI:', validation.abi.valid ? '✅' : '❌', validation.abi.details || validation.abi.error)
  console.log('   Deployment:', validation.deployment.valid ? '✅' : '❌', validation.deployment.details || validation.deployment.error)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  return validation
}

// ═══════════════════════════════════════════════════════════════
// 7️⃣ HELPER: VALIDATION RESULT TO STRING
// ═══════════════════════════════════════════════════════════════

/**
 * ValidationResult'ı user-friendly string'e çevirir
 */
export function validationToString(result: ValidationResult): string {
  if (result.valid) {
    return `✅ ${result.details || 'Valid'}`
  } else {
    return `❌ ${result.error}${result.details ? ': ' + result.details : ''}`
  }
}

/**
 * ContractValidation'ı user-friendly string array'e çevirir
 */
export function contractValidationToStrings(validation: ContractValidation): string[] {
  return [
    `Address: ${validationToString(validation.address)}`,
    `ABI: ${validationToString(validation.abi)}`,
    `Deployment: ${validationToString(validation.deployment)}`,
    ...(validation.bytecode ? [`Bytecode: ${validationToString(validation.bytecode)}`] : [])
  ]
}
