# GIWA Sepolia RPC Setup Guide - Rate Limit Çözümü

## ⚠️ SORUN: Rate-Limited RPC

GIWA Sepolia'nın resmi RPC'si (`https://sepolia-rpc.giwa.io`) **rate-limited**. Özellikle yoğun kullanımda:
- ❌ `eth_estimateGas` çağrıları bloklaniyor
- ❌ "Invalid parameters" hataları
- ❌ Transaction submission başarısız oluyor
- ❌ Production ortamı için uygun değil

---

## ✅ ÇÖZÜM: Alternatif RPC Providers

### **Önerilen Provider'lar:**

1. **Grove (POKT Network)** - Önerilen ✅
   - GIWA Sepolia için dedicated endpoint
   - Ücretsiz tier: 250,000 relay/gün
   - Website: https://grove.city

2. **Ankr** - Alternatif ✅
   - 75+ chain desteği
   - Ücretsiz tier mevcut
   - Website: https://www.ankr.com/rpc/

3. **QuickNode** - Premium ✅
   - Custom chain desteği (Chain ID: 91342)
   - Trial mevcut
   - Website: https://www.quicknode.com

---

## 📝 Setup: Grove (POKT Network)

### Adım 1: Signup
1. https://grove.city adresine git
2. Ücretsiz hesap oluştur
3. Dashboard'a giriş yap

### Adım 2: Endpoint Al
1. "Applications" → "Create Application"
2. Chain: **GIWA Sepolia** seç
3. Endpoint URL'ni kopyala:
   ```
   https://giwa-sepolia-rpc.gateway.pokt.network/v1/YOUR_APP_ID
   ```

### Adım 3: NextJS'te Kullan
`src/lib/chains.ts` dosyasını güncelle:

```typescript
export const GIWA_RPC_ENDPOINTS = {
  official: 'https://sepolia-rpc.giwa.io', // Fallback
  grove: 'https://giwa-sepolia-rpc.gateway.pokt.network/v1/YOUR_APP_ID', // ⭐ Buraya yapıştır
  // ... diğer RPC'ler
} as const

export const giwaSepolia = defineChain({
  id: 91342,
  name: 'GIWA Sepolia',
  rpcUrls: {
    default: {
      http: [
        GIWA_RPC_ENDPOINTS.grove, // ⭐ İlk sırada Grove
        GIWA_RPC_ENDPOINTS.official, // Fallback
      ],
    },
  },
  // ... diğer ayarlar
})
```

---

## 📝 Setup: Ankr

### Adım 1: API Key Al
1. https://www.ankr.com/rpc/ adresine git
2. "Sign Up" ile hesap oluştur
3. Dashboard'dan API key oluştur

### Adım 2: GIWA Sepolia Kontrol
1. Desteklenen chain'leri ara
2. Eğer GIWA Sepolia yoksa → "Add Custom Chain"
3. Chain ID: **91342** gir

### Adım 3: Endpoint URL
```
https://rpc.ankr.com/giwa_sepolia/YOUR_API_KEY
```

### Adım 4: NextJS'te Kullan
```typescript
export const GIWA_RPC_ENDPOINTS = {
  official: 'https://sepolia-rpc.giwa.io',
  ankr: 'https://rpc.ankr.com/giwa_sepolia/YOUR_API_KEY', // ⭐ Buraya
}
```

---

## 📝 Setup: QuickNode

### Adım 1: Trial Başlat
1. https://www.quicknode.com adresine git
2. "Start Free Trial" tıkla
3. Email ile signup

### Adım 2: Endpoint Oluştur
1. Dashboard → "Create Endpoint"
2. Chain Type: **Custom Chain** seç
3. Chain ID: **91342** gir
4. Network Name: **GIWA Sepolia**
5. "Create" butonuna bas

### Adım 3: Endpoint URL Al
```
https://YOUR_ENDPOINT.quiknode.pro/YOUR_TOKEN/
```

### Adım 4: NextJS'te Kullan
```typescript
export const GIWA_RPC_ENDPOINTS = {
  official: 'https://sepolia-rpc.giwa.io',
  quicknode: 'https://YOUR_ENDPOINT.quiknode.pro/YOUR_TOKEN/', // ⭐ Buraya
}
```

---

## 🧪 RPC Test Etme

### Browser Console'da Test:

```javascript
// RPC endpoint'i test et
const testRPC = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1
      })
    })
    const data = await response.json()
    console.log('✅ RPC Working:', data.result ? `Block ${parseInt(data.result, 16)}` : 'OK')
    return true
  } catch (err) {
    console.error('❌ RPC Failed:', err.message)
    return false
  }
}

// Test et
await testRPC('https://sepolia-rpc.giwa.io') // Resmi RPC
await testRPC('YOUR_GROVE_ENDPOINT') // Grove
await testRPC('YOUR_ANKR_ENDPOINT') // Ankr
```

### Chain ID Doğrula:

```javascript
const verifyChainId = async (url) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1
    })
  })
  const data = await response.json()
  const chainId = parseInt(data.result, 16)
  console.log('Chain ID:', chainId, chainId === 91342 ? '✅' : '❌')
}

await verifyChainId('YOUR_RPC_ENDPOINT')
```

---

## ⚡ Gas Estimation Fix

### Gas Price Parametresini Kaldır

Wagmi/viem'de gas estimation yaparken `gasPrice` parametresini **eklemeyin**:

```typescript
// ❌ YANLIŞ - gasPrice ekleme
const gasEstimate = await publicClient.estimateGas({
  account: address,
  to: contractAddress,
  data: encodedData,
  gasPrice: gasPriceFromRPC, // ❌ Bu hataya yol açıyor!
})

// ✅ DOĞRU - gasPrice yok
const gasEstimate = await publicClient.estimateGas({
  account: address,
  to: contractAddress,
  data: encodedData,
  // gasPrice parametresini tamamen kaldır
})
```

### Manuel Gas Limit Kullan

Rate limit hatalarını bypass etmek için:

```typescript
// Gas estimation'ı tamamen atla
const hash = await walletClient.sendTransaction({
  account: address,
  to: null, // Contract deployment
  data: deployData,
  gas: 8_000_000n, // ⭐ Manuel gas limit (8M)
  // gasPrice: undefined, // Otomatik hesaplansın
})
```

---

## 🐛 Hata Ayıklama

### 1. "Invalid Parameters" Hatası

**Sebep:** Rate limit veya yanlış gas parametreleri

**Çözüm:**
- ✅ Alternatif RPC kullan
- ✅ `gasPrice` parametresini kaldır
- ✅ Manuel gas limit ile dene

### 2. "Insufficient Funds" Hatası

**Sebep:** Cüzdanda ETH yok

**Çözüm:**
```javascript
// Bakiye kontrol et
const balance = await publicClient.getBalance({ address })
console.log('Balance:', (Number(balance) / 1e18).toFixed(4), 'ETH')

// Faucet'ten ETH al
// https://sepolia-faucet.giwa.io
```

### 3. "Nonce Too Low/High" Hatası

**Sebep:** Transaction nonce senkronizasyon sorunu

**Çözüm:**
```javascript
// MetaMask'te nonce'u sıfırla
// Settings → Advanced → Reset Account
```

### 4. Rate Limit Hatası

**Görünüş:**
```
429 Too Many Requests
Error: Rate limit exceeded
```

**Çözüm:**
- ✅ Grove/Ankr/QuickNode kullan
- ✅ Birden fazla RPC fallback'i ekle
- ✅ Request sayısını azalt

---

## 📊 RPC Karşılaştırması

| Provider | Ücretsiz Limit | Latency | Güvenilirlik | Önerilen |
|----------|----------------|---------|--------------|----------|
| **Grove** | 250K/gün | ~100ms | ⭐⭐⭐⭐⭐ | ✅ Evet |
| **Ankr** | 100K/gün | ~150ms | ⭐⭐⭐⭐ | ✅ Evet |
| **QuickNode** | Trial | ~80ms | ⭐⭐⭐⭐⭐ | ✅ Premium |
| **Resmi RPC** | Rate-limited | ~200ms | ⭐⭐ | ❌ Test only |

---

## ✅ Checklist

Deploy öncesi kontrol et:

- [ ] Alternatif RPC provider'a signup yaptım
- [ ] Endpoint URL'i `src/lib/chains.ts`'e ekledim
- [ ] RPC'yi browser console'da test ettim (block number)
- [ ] Chain ID doğru (91342)
- [ ] Cüzdanda yeterli ETH var (>0.01 ETH)
- [ ] `gasPrice` parametresini kaldırdım
- [ ] Manuel gas limit kullanıyorum
- [ ] MetaMask'te GIWA Sepolia ağı seçili

---

## 🆘 Hala Çalışmıyor?

1. **Remix'te Test Et:**
   - Remix IDE → Injected Provider
   - Aynı contract'ı deploy et
   - Çalışıyor mu? → Problem frontend'de

2. **Console Logları İncele:**
   - F12 → Console
   - Kırmızı hataları kopyala
   - Full error message'ı paylaş

3. **RPC Health Check:**
   - Yukarıdaki test script'lerini çalıştır
   - Hangi RPC yanıt veriyor?

4. **GitHub Issues:**
   - wagmi/viem GitHub'ında benzer sorunlar ara
   - GIWA Sepolia Discord'una katıl

---

## 📚 Kaynaklar

- Grove Documentation: https://docs.grove.city
- Ankr RPC Docs: https://www.ankr.com/docs/rpc-service
- QuickNode Guides: https://www.quicknode.com/guides
- Wagmi Chains: https://wagmi.sh/core/chains
- Viem Public Client: https://viem.sh/docs/clients/public

---

**🎯 Özet:** GIWA Sepolia'nın rate-limited RPC'si yerine **Grove, Ankr veya QuickNode** kullan. Gas estimation için `gasPrice` parametresini kaldır ve manuel gas limit ile deploy et. Frontend'de fallback RPC'ler tanımla!
