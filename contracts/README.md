# GIWA Sepolia Smart Contract Deployment Guide

## 📋 Kontratlar

Bu klasörde GIWA Sepolia testnet'i için hazırlanmış 3 smart contract bulunmaktadır:

### 1. SimpleContract.sol ✅
- **Tür:** Basic Storage Contract
- **Constructor Parametreleri:** Yok
- **Kullanım:** Basit veri saklama ve okuma

### 2. MyERC20.sol 🪙
- **Tür:** OpenZeppelin ERC20 Token
- **Constructor Parametreleri:**
  - `name` (string): Token adı, örn: "My Token"
  - `symbol` (string): Token sembolü, örn: "MTK"
  - `initialSupply` (uint256): Token sayısı (ONDALIK OLMADAN), örn: 1000000
- **Önemli:** Initial supply otomatik olarak 18 decimal ile çarpılır!
  - Girdiğiniz: `1000000` 
  - Gerçek supply: `1000000 * 10^18` wei
- **Özellikler:** Transfer, approve, transferFrom (standart ERC20)

### 3. MyNFT.sol 🎨
- **Tür:** OpenZeppelin ERC721 NFT (with Ownable)
- **Constructor Parametreleri:**
  - `name` (string): NFT koleksiyonu adı, örn: "My NFT Collection"
  - `symbol` (string): NFT sembolü, örn: "MNFT"
- **Özellikler:**
  - `mint(address to)`: Owner'ın NFT mint etmesi (onlyOwner)
  - `publicMint(address to, uint256 quantity)`: Public mint (herkes)
  - Token ID'ler otomatik artar (0'dan başlar)

---

## 🔧 Remix IDE ile Compile & Deploy

### Adım 1: Remix'e Git
https://remix.ethereum.org

### Adım 2: OpenZeppelin Kurulumu
Remix'te dosya oluşturduğunuzda, import'lar otomatik çözülür. Manuel yükleme gerekmez!

### Adım 3: Kontratları Oluştur

#### SimpleContract.sol
```solidity
// contracts/SimpleContract.sol dosyasından kopyala
```

#### MyERC20.sol
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

#### MyNFT.sol
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

### Adım 4: Compile
1. Sol menüden **Solidity Compiler** seç
2. Compiler version: **0.8.20** (veya üstü)
3. **Compile** butonuna bas
4. ✅ Yeşil onay işareti görmeli (hata olmamalı)

### Adım 5: Bytecode Al

**ÖNEMLİ:** NextJS deployer'da kullanmak için bytecode gerekli!

1. Compile ettikten sonra, **Compilation Details** butonuna tıkla
2. Açılan popup'ta **"BYTECODE"** bölümünü bul
3. **"object"** kısmındaki uzun hex string'i TAMAMEN kopyala
4. **Mutlaka `0x6080...` ile başlamalı!**

#### Bytecode Doğrulama:
```
✅ Doğru: 0x6080604052348015600e575f80fd5b50604051...
❌ Yanlış: 0x0608060405... (eski/hatalı)
❌ Yanlış: 0x6080 (eksik, tamamı lazım)
```

### Adım 6: ABI Al (Opsiyonel)

1. Compilation Details'te **"ABI"** bölümünü bul
2. **Copy** butonuna bas
3. Frontend'de kontratla etkileşim için kullan

---

## 🧪 Remix'te Test Deploy

Deploy etmeden önce Remix'te test edin:

### 1. Deploy & Run Transactions Seç
Sol menüden **Deploy & Run Transactions**

### 2. Environment Ayarla
- **Environment:** Injected Provider - MetaMask
- MetaMask'i GIWA Sepolia ağına bağla:
  - Network Name: GIWA Sepolia
  - RPC URL: https://sepolia-rpc.giwa.io
  - Chain ID: 91342
  - Currency Symbol: ETH
  - Explorer: https://sepolia-explorer.giwa.io

### 3. Test ETH Al
https://sepolia-faucet.giwa.io (veya Sepolia faucet'lerden)

### 4. Deploy Parametreleri

#### SimpleContract:
- Parametre yok, direkt **Deploy**

#### MyERC20:
- `name`: "Test Token"
- `symbol`: "TEST"
- `initialSupply`: **1000000** (1M token, decimals otomatik eklenir)

⚠️ **ÖNEMLİ:** `initialSupply` olarak sadece token sayısını gir (1000000), kontrat otomatik olarak `* 10^18` çarpacak!

#### MyNFT:
- `name`: "Test NFT Collection"
- `symbol`: "TNFT"

### 5. Deploy Butonuna Bas
- MetaMask popup'ı gelecek
- Gas fee'yi onayla
- ✅ Deploy başarılı!

### 6. Deployed Contracts
Deployed Contracts bölümünde kontratınız görünecek. Fonksiyonları test edebilirsiniz:

**MyERC20:**
- `balanceOf(address)`: Bakiye kontrol
- `transfer(address, amount)`: Transfer
- `totalSupply()`: Toplam arz

**MyNFT:**
- `mint(address)`: NFT mint (sadece owner)
- `publicMint(address, quantity)`: Public mint
- `ownerOf(tokenId)`: NFT sahibini kontrol
- `balanceOf(address)`: Kaç NFT sahip

---

## 📦 Hardhat ile Compile (Alternatif)

Eğer Hardhat kullanmak isterseniz:

### 1. Hardhat Kurulumu
```bash
npm install --save-dev hardhat @openzeppelin/contracts
npx hardhat init
```

### 2. Kontratları Kopyala
`contracts/` klasörüne SimpleContract.sol, MyERC20.sol, MyNFT.sol dosyalarını kopyala

### 3. Compile
```bash
npx hardhat compile
```

### 4. Bytecode Al
```bash
node scripts/get-bytecode.js
```

Veya manuel:
```bash
cat artifacts/contracts/MyERC20.sol/MyERC20.json | jq .bytecode
cat artifacts/contracts/MyNFT.sol/MyNFT.json | jq .bytecode
```

### 5. Deploy Script (Opsiyonel)
```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // ERC20 Deploy
  const Token = await hre.ethers.getContractFactory("MyERC20");
  const token = await Token.deploy("My Token", "MTK", 1000000);
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());

  // NFT Deploy
  const NFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy("My NFT", "MNFT");
  await nft.waitForDeployment();
  console.log("NFT deployed to:", await nft.getAddress());
}

main().catch(console.error);
```

---

## 🔍 Foundry ile Compile (Alternatif)

### 1. Foundry Kurulumu
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
forge init my-project
```

### 2. OpenZeppelin Kur
```bash
forge install OpenZeppelin/openzeppelin-contracts
```

### 3. Kontratları Ekle
```bash
# src/ klasörüne kopyala
cp contracts/*.sol src/
```

### 4. Compile
```bash
forge build
```

### 5. Bytecode Al
```bash
cat out/MyERC20.sol/MyERC20.json | jq .bytecode.object
cat out/MyNFT.sol/MyNFT.json | jq .bytecode.object
```

### 6. Test (Opsiyonel)
```solidity
// test/MyERC20.t.sol
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MyERC20.sol";

contract MyERC20Test is Test {
    MyERC20 token;

    function setUp() public {
        token = new MyERC20("Test", "TST", 1000000);
    }

    function testInitialSupply() public {
        assertEq(token.totalSupply(), 1000000 * 10**18);
    }

    function testTransfer() public {
        token.transfer(address(1), 100 * 10**18);
        assertEq(token.balanceOf(address(1)), 100 * 10**18);
    }
}
```

```bash
forge test -vvv
```

---

## 📝 NextJS Deployer'a Bytecode Ekleme

### 1. Bytecode'u Kopyala
Remix veya Hardhat'tan aldığınız bytecode'u kopyalayın.

### 2. UltimateDeployer.tsx'i Aç
```bash
# src/components/UltimateDeployer.tsx
```

### 3. Bytecode Değişkenlerini Güncelle
```typescript
// Satır 9-10
const TOKEN_BYTECODE: Hex = '0x6080604052...' // Buraya MyERC20 bytecode
const NFT_BYTECODE: Hex = '0x6080604052...'  // Buraya MyNFT bytecode
```

### 4. Format Kontrolü
```typescript
// Browser console'da test et
console.log(TOKEN_BYTECODE.slice(0, 10))
// Output: "0x60806040" olmalı ✅
```

### 5. Deploy Et!
- Cüzdanı bağla
- GIWA Sepolia seç
- Parametreleri gir:
  - ERC20: Name, Symbol, Supply (örn: 1000000)
  - NFT: Name, Symbol
- **Deploy** butonuna bas!

---

## ⚠️ Önemli Notlar

### ERC20 Supply Mantığı
```solidity
// Kontrat kodu:
_mint(msg.sender, initialSupply * 10 ** decimals());

// Frontend'de girilen:
initialSupply = 1000000

// Gerçek mint edilen:
1000000 * 10^18 = 1000000000000000000000000 wei
```

**Frontend'de parseUnits KULLANMAYIN!** Kontrat zaten çarpıyor.

### NFT Mint Fonksiyonları
- `mint(address to)`: Sadece owner kullanabilir
- `publicMint(address to, uint256 quantity)`: Herkes kullanabilir

### Gas Limits
- SimpleContract: ~500K gas
- MyERC20: ~1.5M gas
- MyNFT: ~2.5M gas
- Deployer'da fixed limits: 10M (güvenli)

### Explorer'da Verify
```bash
# Flatten kontratı
forge flatten src/MyERC20.sol > MyERC20-flat.sol

# Explorer'da verify:
# https://sepolia-explorer.giwa.io/verifyContract
# - Compiler: 0.8.20
# - Optimization: No
# - Constructor args: ABI-encoded
```

---

## 🐛 Sorun Giderme

### "Failed to compile" Hatası
- OpenZeppelin version: `^5.0.0` (package.json'da)
- Solidity version: `^0.8.20` minimum
- Remix'te auto-import çalışır, manuel npm install gerekmez

### "Gas estimation failed" Hatası
- Deployer'da "Skip Gas Estimation" aktif
- Manuel gas: 10M (varsayılan)
- RPC fallback aktif (alternatif RPC'ler dener)

### "Invalid bytecode" Hatası
- Bytecode `0x6080` ile başlamalı
- Tam bytecode kopyalandı mı? (3000-10000+ karakter)
- `0x0608` veya `0x0x` hatalı formatlar

### "Insufficient funds" Hatası
- GIWA Sepolia faucet'ten ETH al
- En az 0.1 ETH tavsiye edilir
- Balance check deployer'da otomatik

---

## 📚 Ek Kaynaklar

- **OpenZeppelin Docs:** https://docs.openzeppelin.com/contracts/5.x/
- **GIWA Sepolia Docs:** (resmi dokümantasyon)
- **Remix IDE:** https://remix.ethereum.org
- **Hardhat:** https://hardhat.org/docs
- **Foundry Book:** https://book.getfoundry.sh/

---

## ✅ Kontrol Listesi

Deploy öncesi kontrol edin:

- [ ] Kontratlar Remix'te compile edildi (0.8.20+)
- [ ] Bytecode `0x6080` ile başlıyor
- [ ] Bytecode UltimateDeployer.tsx'e eklendi
- [ ] MetaMask GIWA Sepolia'da (Chain ID: 91342)
- [ ] Cüzdanda yeterli ETH var (>0.1 ETH)
- [ ] Constructor parametreleri hazır
- [ ] ERC20 supply sadece sayı (1000000, parseUnits yok!)
- [ ] Deployer'da "Skip Gas Estimation" aktif

Deploy sonrası:

- [ ] Transaction hash alındı
- [ ] Explorer'da görüntülendi
- [ ] Contract address kaydedildi
- [ ] Fonksiyonlar test edildi (balanceOf, mint vb.)
- [ ] (Opsiyonel) Verify edildi

**🎉 Başarıyla deploy edildi!**
