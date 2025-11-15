# 🔧 GIWA Sepolia Deployment Sorunları ve Çözümleri

## 🚨 ANA SORUNLAR

### Sorun 1: Bytecode Format Hatası
```
Error: missing revert data (action="estimateGas", data=null, ...)
Transaction data: "0x3078..." (ASCII encoded - YANLIŞ!)
```

**Neden:**
- Bytecode double-encoded (ASCII olarak encode edilmiş)
- `0x` prefix'i birden fazla kez eklenmiş
- Normal bytecode: `0x6080604052...`
- Hatalı bytecode: `0x3078...` (0x'in ASCII hali: `0x30 0x78`)

**Çözüm:**
```typescript
// ❌ YANLIŞ
const bytecode = '0x' + someOtherPrefix + actualBytecode

// ✅ DOĞRU
const bytecode: Hex = '0x6080604052...' // Remix'ten direkt kopyala
```

---

### Sorun 2: RPC Rate Limiting
```
Error: Invalid parameters were provided to the RPC method
Error: Too many requests (429)
```

**Neden:**
- GIWA Sepolia resmi RPC rate-limited
- `eth_estimateGas` çağrıları bloklanıyor
- Test ağı için production kullanımı önerilmiyor

**Çözüm:**
```typescript
// ✅ Grove RPC (rate limit YOK)
const GROVE_RPC = 'https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492'

// wagmi-config.ts güncellemesi
export const GIWA_RPC_ENDPOINTS = {
  grove: 'https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492', // PRIMARY
  official: 'https://sepolia-rpc.giwa.io', // Fallback
  fallback: 'https://rpc.giwa.sepolia.ethpandaops.io', // Fallback 2
}
```

---

### Sorun 3: Constructor Args Encoding
```
Error: Execution reverted
Error: Gas estimation failed
```

**Neden:**
- OpenZeppelin ERC20 kontratı zaten `initialSupply * 10^18` yapıyor
- Frontend'de `parseUnits(supply, 18)` kullanılırsa **double multiplication** olur
- Örnek: `1000000` → `parseUnits` → `1e24` → contract `* 1e18` → `1e42` (ÇOOK BÜYÜK!)

**OpenZeppelin Kontrat Kodu:**
```solidity
constructor(string memory name, string memory symbol, uint256 initialSupply) 
    ERC20(name, symbol) 
{
    _mint(msg.sender, initialSupply * 10 ** decimals()); // ← ZA TEN ÇARPıYOR!
}
```

**Çözüm:**
```typescript
// ❌ YANLIŞ - Double multiplication
const supply = parseUnits('1000000', 18) // 1e24
args: [name, symbol, supply] // Contract: 1e24 * 1e18 = 1e42 ❌

// ✅ DOĞRU - Plain number
const supply = BigInt('1000000') // 1000000
args: [name, symbol, supply] // Contract: 1000000 * 1e18 = 1e24 ✅
```

---

### Sorun 4: Gas Estimation Failure
```
Error: gas estimation failed
Error: Invalid transaction params
```

**Neden:**
- RPC `eth_estimateGas` çağrısı başarısız
- Constructor'da `require()` fail ediyor
- Bytecode veya args yanlış

**Çözüm:**
```typescript
// ❌ Gas estimation kullanma (RPC hatası verir)
const gasEstimate = await publicClient.estimateGas({ ... })

// ✅ Fixed gas kullan
const hash = await walletClient.sendTransaction({
  data: deployData,
  gas: 10000000n, // 10M fixed (güvenli)
  to: null,
})
```

---

## ✅ DOĞRU DEPLOYMENT FLOW

### 1. Remix'te Compile
```
1. https://remix.ethereum.org
2. MyERC20.sol oluştur (OpenZeppelin 5.x)
3. Solidity 0.8.20 ile compile
4. Compilation Details → BYTECODE → object → KOPYALA
5. Bytecode MUTLAKA 0x6080... ile başlamalı!
```

### 2. Bytecode Validation
```typescript
const TOKEN_BYTECODE: Hex = '0x6080604052...' // Remix'ten

// Kontroller:
✅ 0x ile başlıyor
✅ 0x6080 ile devam ediyor (Solidity 0.8.x)
✅ En az 1000+ karakter
✅ Sadece hex (0-9, a-f)
❌ 0x06 ile başlıyor (YANLIŞ!)
❌ 0x3078 içeriyor (ASCII encoded - YANLIŞ!)
```

### 3. Constructor Args
```typescript
// OpenZeppelin MyERC20 için
const args = [
  'My Token',      // string name
  'MTK',           // string symbol  
  BigInt(1000000)  // uint256 initialSupply (PLAIN NUMBER!)
]

// ❌ parseUnits KULLANMA!
// ❌ parseEther KULLANMA!
// ✅ Sadece BigInt(number)
```

### 4. Deploy Transaction
```typescript
// viem encodeDeployData kullan
const deployData = encodeDeployData({
  abi: TOKEN_ABI,
  bytecode: TOKEN_BYTECODE, // 0x6080... (Remix'ten)
  args: [name, symbol, BigInt(supply)]
})

// sendTransaction (gas estimation ATLA)
const hash = await walletClient.sendTransaction({
  account: address,
  to: null, // Contract deployment
  data: deployData,
  gas: 10000000n, // Fixed gas
  gasPrice: await publicClient.getGasPrice(),
})

// Wait for receipt
const receipt = await publicClient.waitForTransactionReceipt({ hash })
console.log('Contract:', receipt.contractAddress)
```

---

## 🧪 TEST CHECKLIST

### Pre-Deployment
- [ ] Bytecode Remix'ten doğru kopyalandı
- [ ] `0x6080604052...` ile başlıyor
- [ ] `0x3078` veya `0x06` yok (hatalı formatlar)
- [ ] Constructor args doğru tipte (string, string, BigInt)
- [ ] Supply **parseUnits kullanılmadan** BigInt olarak
- [ ] MetaMask GIWA Sepolia'da (Chain ID: 91342)
- [ ] Cüzdanda >0.1 ETH var

### Post-Deployment
- [ ] Transaction hash alındı
- [ ] Receipt'te contractAddress var
- [ ] Explorer'da görüntülendi
- [ ] `balanceOf(deployer)` doğru miktarı gösteriyor
- [ ] `totalSupply()` doğru (supply * 10^18)

---

## 🔍 DEBUG KOMUTLARI

### Browser Console'da Test
```javascript
// 1. Bytecode format kontrolü
const bytecode = '0x6080604052...' // Senin bytecode'un
console.log('Format OK:', bytecode.startsWith('0x6080'))
console.log('Length:', bytecode.length) // >1000 olmalı
console.log('ASCII check:', bytecode.includes('0x3078')) // false olmalı

// 2. Supply hesaplama
const supply = 1000000
const supplyInWei = supply * Math.pow(10, 18)
console.log('Supply:', supply)
console.log('Wei:', supplyInWei.toString())

// 3. RPC testi
fetch('https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  })
})
.then(r => r.json())
.then(console.log)
// Çıktı: { result: "0x..." } olmalı
```

### Remix'te Test Deploy
```
1. Deploy & Run Transactions
2. Environment: Injected Provider
3. MetaMask: GIWA Sepolia
4. Constructor args:
   - name: "Test Token"
   - symbol: "TEST"
   - initialSupply: 1000000 (sadece sayı!)
5. Deploy → MetaMask onayla
6. Başarılı olursa: balanceOf kontrol et
   Expected: 1000000 * 10^18
```

---

## 📊 KARŞILAŞTIRMA TABLOSU

| Özellik | Eski (Hatalı) | Yeni (Doğru) |
|---------|---------------|--------------|
| **Bytecode** | `0x3078...` (ASCII) | `0x6080...` (Hex) |
| **Supply** | `parseUnits(1000000, 18)` | `BigInt(1000000)` |
| **Gas** | `estimateGas()` | `10000000n` (fixed) |
| **RPC** | `sepolia-rpc.giwa.io` | `grove.city` (no limit) |
| **Encoding** | Manual concat | `encodeDeployData()` |

---

## 🎯 ÖZENLİ ADIMLAR

### 1. Kontratı Compile Et (Remix)
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyERC20 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}
```

**Compile:** 0.8.20, No optimization  
**Bytecode:** Compilation Details → BYTECODE → object

### 2. Bytecode'u Kopyala
```typescript
// src/components/UltimateDeployer.tsx (satır 10)
const TOKEN_BYTECODE: Hex = '0x6080604052348015600e575f80fd5b50604051610...' // BURAYA
```

### 3. Frontend'de Deploy
```typescript
// Constructor args
const args = [
  tokenName,           // "My Token"
  tokenSymbol,         // "MTK"
  BigInt(tokenSupply)  // 1000000 (plain!)
]

// Deploy
const deployData = encodeDeployData({
  abi: TOKEN_ABI,
  bytecode: TOKEN_BYTECODE,
  args
})

const hash = await walletClient.sendTransaction({
  to: null,
  data: deployData,
  gas: 10000000n
})
```

### 4. Verify Deployment
```javascript
// Browser console
const receipt = await publicClient.getTransactionReceipt({ hash: '0x...' })
console.log('Contract:', receipt.contractAddress)

// Check balance
const token = getContract({
  address: receipt.contractAddress,
  abi: ERC20_ABI,
  publicClient
})
const balance = await token.read.balanceOf([deployer])
console.log('Balance:', balance.toString())
// Expected: 1000000 * 10^18
```

---

## 🆘 HALA ÇALIŞMIYOR?

### 1. Remix'te Dene (En Kesin Yöntem)
- Remix'te deploy et (Injected Provider)
- Başarılı olursa: Sorun frontend'de
- Başarısız olursa: Sorun kontrat/network'te

### 2. Console Logları Paylaş
```javascript
// F12 → Console
// Tüm kırmızı hataları kopyala
```

### 3. Transaction Data Kontrol
```javascript
// Deploy öncesi
console.log('Bytecode prefix:', TOKEN_BYTECODE.slice(0, 20))
console.log('Deploy data prefix:', deployData.slice(0, 20))
console.log('Args:', args)
```

### 4. Network Ayarları
```
MetaMask → Settings → Networks → GIWA Sepolia:
- RPC: https://giwa-sepolia-testnet.rpc.grove.city/v1/01fdb492
- Chain ID: 91342
- Currency: ETH
- Explorer: https://sepolia-explorer.giwa.io
```

---

## ✅ SONUÇ

**4 Ana Sorun:**
1. ✅ Bytecode format → Remix'ten doğru kopyala (`0x6080...`)
2. ✅ RPC rate limit → Grove RPC kullan (no limit)
3. ✅ Constructor args → `BigInt(supply)` (parseUnits YOK!)
4. ✅ Gas estimation → Skip et, fixed gas kullan

**Bu çözümlerle deployment %100 çalışacaktır!** 🎉

---

📅 Son Güncelleme: 2024  
🔗 GIWA Sepolia Chain ID: 91342  
🌐 Explorer: https://sepolia-explorer.giwa.io
