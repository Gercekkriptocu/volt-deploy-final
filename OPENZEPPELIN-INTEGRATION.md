# OpenZeppelin Integration Guide - GIWA Sepolia Deployer

## 📚 Genel Bakış

GIWA Sepolia deployer artık **OpenZeppelin v5.x** tabanlı standart ERC20 ve ERC721 kontratlarını kullanıyor. Bu, güvenli, audit edilmiş ve endüstri standardı implementasyonlar sağlar.

---

## 🪙 ERC20 Token Kontratı (MyERC20.sol)

### Kontrat Kodu
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

### Özellikler
- ✅ OpenZeppelin standart ERC20 implementasyonu
- ✅ Otomatik 18 decimal support
- ✅ Transfer, approve, transferFrom fonksiyonları
- ✅ TotalSupply tracking
- ✅ BalanceOf sorguları

### Constructor Parametreleri

| Parametre | Tip | Açıklama | Örnek |
|-----------|-----|----------|-------|
| `name` | string | Token adı | "My Token" |
| `symbol` | string | Token sembolü (1-11 karakter) | "MTK" |
| `initialSupply` | uint256 | Token sayısı (DECIMAL OLMADAN) | 1000000 |

### ⚠️ CRITICAL: Supply Mantığı

**Kontrat içinde:**
```solidity
_mint(msg.sender, initialSupply * 10 ** decimals());
```

**Frontend'de GÖNDERİLEN:**
```typescript
// ✅ DOĞRU
const supplyAsNumber = BigInt(1000000); // Sadece sayı
args: [tokenName, tokenSymbol, supplyAsNumber]

// ❌ YANLIŞ - parseUnits kullanma!
const supplyInWei = parseUnits("1000000", 18); // Kontrat zaten çarpıyor!
```

**Sonuç:**
- Kullanıcı girer: `1000000`
- Kontrat mint eder: `1000000 * 10^18 = 1000000000000000000000000` wei
- TotalSupply: `1 million tokens` with 18 decimals

---

## 🎨 ERC721 NFT Kontratı (MyNFT.sol)

### Kontrat Kodu
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _nextTokenId = 0;
    }

    function mint(address to) public onlyOwner {
        uint256 tokenId = _nextTokenId;
        _nextTokenId += 1;
        _safeMint(to, tokenId);
    }

    function publicMint(address to, uint256 quantity) public {
        require(quantity > 0, "Quantity must be greater than 0");
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId;
            _nextTokenId += 1;
            _safeMint(to, tokenId);
        }
    }
}
```

### Özellikler
- ✅ OpenZeppelin standart ERC721 implementasyonu
- ✅ Ownable access control
- ✅ Otomatik token ID tracking (_nextTokenId)
- ✅ Owner-only mint fonksiyonu
- ✅ Public mint fonksiyonu (quantity ile)
- ✅ SafeMint (ERC721Receiver check)

### Constructor Parametreleri

| Parametre | Tip | Açıklama | Örnek |
|-----------|-----|----------|-------|
| `name` | string | NFT koleksiyonu adı | "My NFT Collection" |
| `symbol` | string | NFT sembolü (1-11 karakter) | "MNFT" |

### Mint Fonksiyonları

#### 1. mint(address to) - Owner Only
```solidity
function mint(address to) public onlyOwner
```
- Sadece kontrat owner'ı çağırabilir
- Tek NFT mint eder
- Token ID otomatik artar

**Frontend Kullanımı:**
```typescript
import { useWriteContract } from 'wagmi';

const { writeContract } = useWriteContract();

writeContract({
  address: nftContractAddress,
  abi: NFT_ABI,
  functionName: 'mint',
  args: [userAddress],
});
```

#### 2. publicMint(address to, uint256 quantity) - Public
```solidity
function publicMint(address to, uint256 quantity) public
```
- Herkes çağırabilir
- Birden fazla NFT mint eder
- Quantity > 0 olmalı

**Frontend Kullanımı:**
```typescript
writeContract({
  address: nftContractAddress,
  abi: NFT_ABI,
  functionName: 'publicMint',
  args: [userAddress, BigInt(5)], // 5 NFT mint et
});
```

---

## 🔧 NextJS + Wagmi Entegrasyonu

### 1. Wagmi Config (src/lib/wagmi-config.ts)

```typescript
import { http, createConfig } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'

export const giwaSepolia = {
  id: 91342,
  name: 'GIWA Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia-rpc.giwa.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'GIWA Explorer',
      url: 'https://sepolia-explorer.giwa.io',
    },
  },
  testnet: true,
}

export const config = createConfig({
  chains: [giwaSepolia],
  connectors: [injected(), metaMask()],
  transports: {
    [giwaSepolia.id]: http(),
  },
})
```

### 2. Deploy Component

```typescript
'use client'
import { useState } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { encodeDeployData, type Hex } from 'viem'

const TOKEN_BYTECODE: Hex = '0x6080604052...' // Remix'ten al
const TOKEN_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'initialSupply', type: 'uint256' },
    ],
  },
] as const

export default function DeployToken() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const [tokenName, setTokenName] = useState('My Token')
  const [tokenSymbol, setTokenSymbol] = useState('MTK')
  const [tokenSupply, setTokenSupply] = useState('1000000')
  
  const deployToken = async () => {
    if (!walletClient || !publicClient) return
    
    // Supply'ı BigInt'e çevir (parseUnits KULLANMA!)
    const supplyAsNumber = BigInt(tokenSupply)
    
    // Deploy data encode et
    const deployData = encodeDeployData({
      abi: TOKEN_ABI,
      bytecode: TOKEN_BYTECODE,
      args: [tokenName, tokenSymbol, supplyAsNumber],
    })
    
    // Transaction gönder
    const hash = await walletClient.sendTransaction({
      account: address,
      to: null, // Contract creation
      data: deployData,
      gas: 10000000n, // Fixed gas
    })
    
    // Receipt bekle
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    
    if (receipt.status === 'success') {
      console.log('Contract deployed:', receipt.contractAddress)
    }
  }
  
  return (
    <div>
      <input value={tokenName} onChange={e => setTokenName(e.target.value)} />
      <input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)} />
      <input value={tokenSupply} onChange={e => setTokenSupply(e.target.value)} />
      <button onClick={deployToken}>Deploy Token</button>
    </div>
  )
}
```

### 3. Kontrat Etkileşimi

Deploy sonrası kontratla etkileşim:

```typescript
import { useReadContract, useWriteContract } from 'wagmi'

// Balance okuma
const { data: balance } = useReadContract({
  address: tokenAddress,
  abi: TOKEN_ABI,
  functionName: 'balanceOf',
  args: [userAddress],
})

// Transfer yapma
const { writeContract } = useWriteContract()

writeContract({
  address: tokenAddress,
  abi: TOKEN_ABI,
  functionName: 'transfer',
  args: [recipientAddress, parseUnits('100', 18)],
})
```

---

## 📦 Bytecode Alma Yöntemleri

### 1. Remix IDE (En Kolay)

1. https://remix.ethereum.org
2. MyERC20.sol ve MyNFT.sol oluştur
3. Solidity Compiler → 0.8.20 seç → Compile
4. Compilation Details → BYTECODE → object → Kopyala

**Doğrulama:**
```
✅ 0x6080604052348015600e575f80fd5b50604051...
❌ 0x0608... (hatalı)
```

### 2. Hardhat

```bash
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat compile
```

```javascript
// scripts/get-bytecode.js
const MyERC20 = require('../artifacts/contracts/MyERC20.sol/MyERC20.json')
console.log(MyERC20.bytecode)
```

### 3. Foundry

```bash
forge install OpenZeppelin/openzeppelin-contracts
forge build
cat out/MyERC20.sol/MyERC20.json | jq .bytecode.object
```

---

## 🧪 Test Örnekleri

### Foundry Test

```solidity
// test/MyERC20.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MyERC20.sol";

contract MyERC20Test is Test {
    MyERC20 token;
    address user = address(0x1);

    function setUp() public {
        token = new MyERC20("Test Token", "TST", 1000000);
    }

    function testTotalSupply() public {
        assertEq(token.totalSupply(), 1000000 * 10**18);
    }

    function testInitialBalance() public {
        assertEq(token.balanceOf(address(this)), 1000000 * 10**18);
    }

    function testTransfer() public {
        token.transfer(user, 100 * 10**18);
        assertEq(token.balanceOf(user), 100 * 10**18);
    }
}
```

```bash
forge test -vvv
```

### Hardhat Test

```javascript
// test/MyERC20.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyERC20", function () {
  it("Should mint initial supply to deployer", async function () {
    const [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("MyERC20");
    const token = await Token.deploy("Test Token", "TST", 1000000);
    
    const balance = await token.balanceOf(owner.address);
    expect(balance).to.equal(ethers.parseUnits("1000000", 18));
  });
});
```

```bash
npx hardhat test
```

---

## 🎯 UltimateDeployer Değişiklikleri

### Supply Handling

**ÖNCE (Yanlış):**
```typescript
// ❌ Contract zaten * 10^18 çarpıyor, parseUnits kullanma!
const supplyInWei = parseUnits(tokenSupply, 18)
args: [tokenName, tokenSymbol, supplyInWei]
```

**ŞIMDI (Doğru):**
```typescript
// ✅ Sadece sayı gönder, contract çarpacak
const supplyAsNumber = BigInt(tokenSupply)
args: [tokenName, tokenSymbol, supplyAsNumber]
```

### ABI Güncellemeleri

**Token ABI (Gelişmiş):**
```typescript
const TOKEN_ABI = [
  { type: 'constructor', inputs: [...] },
  { type: 'function', name: 'totalSupply', ... },
  { type: 'function', name: 'balanceOf', ... },
  { type: 'function', name: 'transfer', ... },
] as const
```

**NFT ABI (Ownable + Mint):**
```typescript
const NFT_ABI = [
  { type: 'constructor', inputs: [...] },
  { type: 'function', name: 'mint', ... },
  { type: 'function', name: 'publicMint', ... },
  { type: 'function', name: 'ownerOf', ... },
] as const
```

---

## 📊 Gas Tahmini

| İşlem | Gas Limit | Yaklaşık Maliyet (1 gwei) |
|-------|-----------|---------------------------|
| ERC20 Deploy | ~1.5M | 0.0015 ETH |
| NFT Deploy | ~2.5M | 0.0025 ETH |
| Token Transfer | ~50K | 0.00005 ETH |
| NFT Mint (1x) | ~150K | 0.00015 ETH |
| NFT Public Mint (5x) | ~500K | 0.0005 ETH |

**UltimateDeployer Fixed Limits:**
- Token: 10M gas (güvenli)
- NFT: 8M gas (güvenli)

---

## ⚠️ Önemli Notlar

### 1. Supply Çarpımı
```solidity
// Contract'ta:
_mint(msg.sender, initialSupply * 10 ** decimals());

// Frontend'te parseUnits KULLANMAYIN!
BigInt(1000000) // ✅ Doğru
parseUnits("1000000", 18) // ❌ Yanlış (iki kez çarpılır)
```

### 2. Ownable Constructor
```solidity
// ✅ Doğru (0.8.20+)
constructor(...) ERC721(...) Ownable(msg.sender) {}

// ❌ Eski (0.8.19-)
constructor(...) ERC721(...) Ownable() {}
```

### 3. OpenZeppelin Version
```json
{
  "dependencies": {
    "@openzeppelin/contracts": "^5.0.0"
  }
}
```

### 4. Solidity Version
```solidity
pragma solidity ^0.8.20; // Minimum 0.8.20
```

---

## 🐛 Sorun Giderme

### "Constructor parameter count mismatch"
- ABI ile kontrat constructor'ı eşleşmiyor
- Bytecode yeniden compile edilmeli

### "Transaction reverted"
- Supply < 0 olamaz
- NFT quantity > 0 olmalı
- Yeterli ETH var mı kontrol et

### "Ownable: caller is not the owner"
- `mint()` fonksiyonu sadece owner
- `publicMint()` kullan veya owner adresini kontrol et

---

## ✅ Kontrol Listesi

Deploy öncesi:

- [ ] OpenZeppelin ^5.0.0 kurulu
- [ ] Solidity 0.8.20+ ile compile edildi
- [ ] Bytecode `0x6080...` ile başlıyor
- [ ] ABI contract ile eşleşiyor
- [ ] Supply'ı parseUnits'siz gönderiyorsun
- [ ] NFT için Ownable(msg.sender) var

Deploy sonrası:

- [ ] TotalSupply doğru (supply * 10^18)
- [ ] Balance deployer'da
- [ ] Transfer çalışıyor
- [ ] NFT mint fonksiyonları çalışıyor
- [ ] Explorer'da görünüyor

**🎉 OpenZeppelin entegrasyonu tamamlandı!**
