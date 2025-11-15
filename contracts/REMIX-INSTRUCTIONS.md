# 🔥 Remix ile Bytecode Alma Rehberi

## Adım 1: Remix'e Git
https://remix.ethereum.org

---

## Adım 2: Kontratları Oluştur

### MinimalToken.sol
1. Sol menüden **"contracts"** klasörüne sağ tıkla
2. **"New File"** seç
3. Dosya adı: `MinimalToken.sol`
4. Bu repodan `contracts/MinimalToken.sol` içeriğini kopyala-yapıştır

### MinimalNFT.sol
1. Aynı şekilde `MinimalNFT.sol` oluştur
2. Bu repodan `contracts/MinimalNFT.sol` içeriğini kopyala-yapıştır

---

## Adım 3: Compile Et

### Token için:
1. Sol menüden **Solidity Compiler** (🔨) ikonuna tıkla
2. **Compiler version:** `0.8.19` seç
3. **MinimalToken.sol** dosyasını seç
4. **Compile MinimalToken.sol** butonuna bas
5. ✅ Yeşil onay işareti görmeli

### NFT için:
1. **MinimalNFT.sol** dosyasını seç
2. **Compile MinimalNFT.sol** butonuna bas
3. ✅ Yeşil onay işareti görmeli

---

## Adım 4: Bytecode'u Al

### Token Bytecode:
1. Compile butonunun altında **"Compilation Details"** butonuna tıkla
2. Açılan popup pencerede **"BYTECODE"** bölümünü bul
3. **"object"** kısmındaki uzun hex string'i kopyala
4. **KONTROL:** Mutlaka `0x6080604052...` ile başlamalı! ✅

### NFT Bytecode:
1. MinimalNFT için aynı işlemi tekrarla
2. Bytecode'u kopyala
3. **KONTROL:** `0x6080604052...` ile başlamalı! ✅

---

## Adım 5: Test Deploy (İsteğe Bağlı)

### Remix'te Deneme Deploy:
1. Sol menüden **Deploy & Run Transactions** (▶️) seç
2. **Environment:** `Injected Provider - MetaMask` seç
3. MetaMask'te **Giwa Sepolia** ağını seç
4. **CONTRACT:** `MinimalToken` seç
5. **Constructor parametreleri:**
   - `_name`: "Test Token"
   - `_symbol`: "TEST"
   - `_supply`: `1000000000000000000000000` (1M token with 18 decimals)
6. **Deploy** butonuna bas
7. MetaMask'te işlemi onayla

✅ **Başarılı oldu mu?**
- **EVET** → Bytecode doğru çalışıyor! NextJS'e kopyalayabilirsin
- **HAYIR** → Network ayarlarını kontrol et

---

## Adım 6: NextJS'e Kopyala

### Token Bytecode:
```javascript
// src/components/WorkingDeployer.tsx içinde
const TOKEN_BYTECODE = '0x6080604052348015600e575f80fd5b50604051610...'
// Buraya Remix'ten kopyaladığın bytecode'u yapıştır
```

### NFT Bytecode:
```javascript
const NFT_BYTECODE = '0x6080604052348015600e575f80fd5b50604051610...'
// Buraya Remix'ten kopyaladığın bytecode'u yapıştır
```

---

## ✅ Bytecode Kontrol Listesi

Bytecode'u kopyalamadan önce:

- [ ] `0x6080604052` ile başlıyor (0x06 değil!)
- [ ] En az 1000 karakter uzunluğunda
- [ ] Sadece hex karakterler içeriyor (0-9, a-f)
- [ ] Remix'te başarıyla compile oldu
- [ ] (İsteğe bağlı) Remix'te test deploy çalıştı

---

## 🐛 Yaygın Hatalar

### ❌ Bytecode `0x06080604` ile başlıyor
**Sorun:** Yanlış bytecode formatı  
**Çözüm:** Compilation Details → BYTECODE → object'i kopyala

### ❌ "Invalid bytecode" hatası
**Sorun:** Bytecode eksik veya hatalı  
**Çözüm:** Remix'te tekrar compile et ve tam bytecode'u kopyala

### ❌ "Contract creation failed" hatası
**Sorun:** Constructor parametreleri yanlış  
**Çözüm:** Supply'ı wei cinsinden gir (18 sıfır ekle)

---

## 📋 Örnek Bytecode Formatı

### ✅ Doğru:
```
0x6080604052348015600e575f80fd5b5060405161084a38038061084a833981016040819052602a91606e565b600061003683826101...
```

### ❌ Yanlış:
```
0x0608060405234801561001057600080fd5b506040516107e58039806107e5833981810160405281019061003291906103...
```

---

## 🆘 Yardım

Sorun yaşıyorsan:
1. Remix console'da hata var mı kontrol et
2. MetaMask'te doğru network seçili mi kontrol et
3. Cüzdanda yeterli ETH var mı kontrol et
4. Bytecode'un ilk 10 karakterini paylaş: `console.log(TOKEN_BYTECODE.slice(0, 10))`

---

## 🎯 Sonraki Adım

Bytecode'u aldıktan sonra:
1. `src/components/WorkingDeployer.tsx` dosyasını aç
2. `TOKEN_BYTECODE` ve `NFT_BYTECODE` değişkenlerine yapıştır
3. Uygulamayı test et
4. Deploy et! 🚀
