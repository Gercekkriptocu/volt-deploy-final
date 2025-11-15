'use client'
import { useState, useRef } from 'react'
import type { ReactElement, ChangeEvent, DragEvent } from 'react'

interface CustomizeNFTModalProps {
  isOpen: boolean
  onClose: () => void
  onDeploy: (params: {
    name: string
    symbol: string
    bytecode: string
    abi: any[]
    baseURI: string
    imageUrl: string
  }) => Promise<void>
}

export function CustomizeNFTModal({ isOpen, onClose, onDeploy }: CustomizeNFTModalProps): ReactElement | null {
  const [name, setName] = useState<string>('')
  const [symbol, setSymbol] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [collectionImage, setCollectionImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [compiling, setCompiling] = useState<boolean>(false)
  const [uploading, setUploading] = useState<boolean>(false)
  const [ipfsData, setIpfsData] = useState<{baseURI: string; imageUrl: string} | null>(null)
  const [dragActive, setDragActive] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Handle file selection
  const handleFileSelect = (file: File): void => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, GIF, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB')
      return
    }

    setCollectionImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    
    console.log('🖼️ Image selected:', file.name, file.type, file.size, 'bytes')
  }

  // Handle drag and drop
  const handleDrag = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleDeploy = async (): Promise<void> => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 DEPLOY BUTTON CLICKED - Starting NFT deployment')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Current state:', { 
      name, 
      symbol, 
      description: description || '(empty)', 
      hasImage: !!collectionImage,
      imageName: collectionImage?.name || 'none',
      imageSize: collectionImage?.size || 0
    })
    
    // Show immediate visual feedback
    alert('✅ DEPLOY butonu tıklandı! Browser console\'u (F12) açık tutun ve MetaMask transaction\'ını onaylayın.')
    
    // Validation
    if (!name || name.trim() === '') {
      console.error('❌ Validation failed: Name is empty')
      alert('⚠️ Please enter a collection name')
      return
    }

    if (!symbol || symbol.trim() === '') {
      console.error('❌ Validation failed: Symbol is empty')
      alert('⚠️ Please enter a collection symbol')
      return
    }

    if (!collectionImage) {
      console.error('❌ Validation failed: No image selected')
      alert('⚠️ Please select a collection image')
      return
    }

    console.log('✅ Validation passed - proceeding with deployment')

    setLoading(true)
    setUploading(false)
    setCompiling(false)
    setIpfsData(null)

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 STEP 1/3: IPFS Upload (Pinata)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📝 Collection:', name)
      console.log('📝 Symbol:', symbol)
      console.log('📝 Description:', description || '(none)')
      console.log('🖼️ Image:', collectionImage.name, collectionImage.type, (collectionImage.size / 1024).toFixed(2), 'KB')

      setUploading(true)

      const formData = new FormData()
      formData.append('file', collectionImage)
      formData.append('name', name)
      formData.append('symbol', symbol)
      formData.append('description', description)

      console.log('📤 Uploading to /api/upload-to-ipfs...')
      
      const uploadResponse = await fetch('/api/upload-to-ipfs', {
        method: 'POST',
        body: formData,
      })

      console.log('📥 Response:', uploadResponse.status, uploadResponse.statusText)

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('❌ Upload HTTP error:', errorText)
        throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`)
      }

      const uploadResult = await uploadResponse.json()
      console.log('📥 Upload result:', JSON.stringify(uploadResult, null, 2))

      if (!uploadResult.success) {
        console.error('❌ IPFS upload failed:', uploadResult.error)
        throw new Error(`IPFS: ${uploadResult.error || 'Unknown error'}`)
      }

      console.log('✅ IPFS Upload successful!')
      console.log('   🔗 Image CID:', uploadResult.imageCid)
      console.log('   🔗 Image URL:', uploadResult.imageUrl)
      console.log('   🔗 Base URI:', uploadResult.baseURI)
      console.log('   🌐 Gateway:', uploadResult.imageGateway)
      
      // CRITICAL: Validate baseURI format
      console.log('🔍 Validating baseURI format...')
      if (!uploadResult.baseURI || uploadResult.baseURI.trim() === '') {
        console.error('❌ baseURI is empty or null!')
        throw new Error('IPFS: Base URI is empty. Upload may have failed.')
      }
      if (!uploadResult.baseURI.startsWith('ipfs://')) {
        console.error('❌ baseURI does not start with ipfs://!', uploadResult.baseURI)
        throw new Error('IPFS: Base URI format is invalid. Expected ipfs://, got: ' + uploadResult.baseURI)
      }
      // Note: baseURI no longer needs to end with '/' since we use a single metadata file
      console.log('✅ baseURI format validated successfully!')
      
      setIpfsData({
        baseURI: uploadResult.baseURI,
        imageUrl: uploadResult.imageUrl
      })
      setUploading(false)

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 STEP 2/3: Contract Compilation')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      setCompiling(true)
      
      const compilePayload = { 
        name, 
        symbol,
        baseURI: uploadResult.baseURI
      }
      console.log('📤 Compiling with params:', compilePayload)
      
      const compileResponse = await fetch('/api/compile/nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compilePayload),
      })

      console.log('📥 Response:', compileResponse.status, compileResponse.statusText)

      if (!compileResponse.ok) {
        const errorText = await compileResponse.text()
        console.error('❌ Compile HTTP error:', errorText)
        throw new Error(`Compilation failed: ${compileResponse.status} - ${errorText}`)
      }

      const compileResult = await compileResponse.json()
      console.log('📥 Compile result:', { 
        success: compileResult.success, 
        contractName: compileResult.contractName,
        bytecodeLength: compileResult.bytecode?.length || 0,
        abiLength: compileResult.abi?.length || 0,
        hasBaseURI: compileResult.hasBaseURI
      })

      if (!compileResult.success) {
        console.error('❌ Compilation error:', compileResult.error)
        throw new Error(`Compilation: ${compileResult.error || 'Unknown error'}`)
      }

      console.log('✅ Compilation successful!')
      console.log('   📦 Bytecode:', compileResult.bytecode.substring(0, 20) + '...')
      console.log('   🔢 ABI:', compileResult.abi.length, 'functions')
      console.log('   📜 Contract:', compileResult.contractName)

      setCompiling(false)

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 STEP 3/3: Blockchain Deployment')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 Calling onDeploy callback...')
      
      // CRITICAL DEBUG ALERT
      alert('✅ STEP 3/3: Starting blockchain deployment...\n\nIPFS: ✅ Done\nCompile: ✅ Done\nNext: Calling deployment function\n\nClick OK to continue')
      
      const deployParams = {
        name,
        symbol,
        bytecode: compileResult.bytecode,
        abi: compileResult.abi,
        baseURI: uploadResult.baseURI,
        imageUrl: uploadResult.imageUrl,
      }
      console.log('📦 Deploy params:', {
        name: deployParams.name,
        symbol: deployParams.symbol,
        bytecodeLength: deployParams.bytecode.length,
        abiLength: deployParams.abi.length,
        baseURI: deployParams.baseURI,
        imageUrl: deployParams.imageUrl
      })
      
      console.log('⏳ Waiting for blockchain deployment to complete...')
      console.log('🔄 About to call onDeploy with params:', deployParams)
      alert('🚀 Calling onDeploy now...\n\nIf MetaMask doesn\'t open in 5 seconds, check:\n1. Pop-up blocker\n2. MetaMask extension is unlocked\n3. Browser console (F12) for errors')
      
      await onDeploy(deployParams)
      
      alert('✅ onDeploy completed successfully!')

      console.log('✅ Blockchain deployment completed successfully!')
      console.log('🔄 Closing modal and resetting form...')

      // Reset form only after successful deployment
      setName('')
      setSymbol('')
      setDescription('')
      setCollectionImage(null)
      setImagePreview(null)
      setIpfsData(null)
      onClose()
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 NFT DEPLOYMENT COMPLETE!')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    } catch (error: any) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ NFT DEPLOYMENT FAILED')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error type:', error?.constructor?.name)
      console.error('Error message:', error?.message)
      console.error('Error stack:', error?.stack)
      console.error('Full error object:', error)
      
      const errorMessage = error?.message || 'Unknown error occurred'
      
      let userMessage = '❌ NFT Deployment Failed\n\n'
      
      if (errorMessage.includes('IPFS')) {
        userMessage += '📤 IPFS Upload Error\n'
        userMessage += errorMessage + '\n\n'
        userMessage += '💡 Possible solutions:\n'
        userMessage += '- Check your internet connection\n'
        userMessage += '- Try a smaller image file\n'
        userMessage += '- Wait a moment and try again'
      } else if (errorMessage.includes('Compilation')) {
        userMessage += '⚙️ Contract Compilation Error\n'
        userMessage += errorMessage + '\n\n'
        userMessage += '💡 Possible solutions:\n'
        userMessage += '- Check collection name and symbol\n'
        userMessage += '- Try simpler names (letters only)\n'
        userMessage += '- Refresh the page and try again'
      } else {
        userMessage += errorMessage + '\n\n'
        userMessage += '💡 Check browser console (F12) for details'
      }
      
      alert(userMessage)
    } finally {
      console.log('🏁 Cleaning up state...')
      setLoading(false)
      setCompiling(false)
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="retro-panel max-w-lg w-full my-8 p-4 md:p-6 space-y-3 border-2 border-green-400 shadow-lg shadow-green-500/50 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center retro-text">
          <span className="blink text-sm">╔═══════════════════════╗</span>
          <div className="text-sm my-1">║ CUSTOMIZE ERC721 NFT  ║</div>
          <span className="blink text-sm">╚═══════════════════════╝</span>
        </div>

        {/* Form */}
        <div className="space-y-2">
          {/* Name Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> COLLECTION NAME:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My NFT Collection"
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-2 py-1.5 rounded font-mono text-sm focus:border-green-400 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Symbol Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> SYMBOL:
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MNFT"
              maxLength={10}
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-2 py-1.5 rounded font-mono text-sm focus:border-green-400 focus:outline-none"
              disabled={loading}
            />
            <p className="text-[10px] text-green-400/60 mt-0.5 retro-text">
              * Contract: {symbol || 'XXX'}NFT
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> DESCRIPTION (optional):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A unique digital art collection..."
              rows={2}
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-2 py-1.5 rounded font-mono text-xs focus:border-green-400 focus:outline-none resize-none"
              disabled={loading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> IMAGE:
            </label>
            
            {/* Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded p-3 cursor-pointer transition-all ${
                dragActive
                  ? 'border-green-400 bg-green-900/30'
                  : 'border-green-500/50 bg-black/40 hover:border-green-400 hover:bg-green-900/20'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
              />
              
              {imagePreview ? (
                <div className="space-y-1.5">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded border border-green-500/50"
                  />
                  <p className="text-[10px] text-green-400 text-center retro-text">
                    ✓ {collectionImage?.name}
                  </p>
                  <p className="text-[10px] text-green-400/60 text-center retro-text">
                    Click to change
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <div className="text-2xl text-green-400">🖼️</div>
                  <p className="text-xs text-green-400 retro-text">
                    Drag & Drop or Click
                  </p>
                  <p className="text-[10px] text-green-400/40 retro-text">
                    PNG, JPG, GIF • Max 10MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Status */}
          {uploading && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded p-3">
              <p className="text-xs text-blue-400 retro-text text-center">
                <span className="blink">📤</span> Uploading image to IPFS (Pinata)...
              </p>
            </div>
          )}

          {/* Compilation Status */}
          {compiling && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
              <p className="text-xs text-green-400 retro-text text-center">
                <span className="blink">⚙️</span> Compiling ERC721URIStorage with baseURI...
              </p>
            </div>
          )}

          {/* IPFS Success */}
          {ipfsData && !compiling && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
              <p className="text-xs text-green-400 retro-text">
                ✓ Image uploaded to IPFS!
              </p>
              <p className="text-xs text-green-400/60 retro-text mt-1 break-all">
                {ipfsData.imageUrl.slice(0, 50)}...
              </p>
            </div>
          )}

          {/* Info */}
          <div className="bg-black/60 border border-green-500/30 rounded p-2">
            <p className="text-[10px] text-green-400/80 retro-text mb-1">
              <span className="blink">ℹ</span> NFT FEATURES:
            </p>
            <ul className="text-[10px] text-green-400/70 retro-text space-y-0.5 ml-3">
              <li>• ERC721 + IPFS metadata</li>
              <li>• OpenSea compatible</li>
              <li>• Auto mint() function</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded font-mono text-sm transition-all disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleDeploy}
            disabled={loading || !name || !symbol || !collectionImage}
            className="flex-1 bg-green-600 hover:bg-green-500 text-black px-4 py-2 rounded font-mono font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'UPLOADING...' : compiling ? 'COMPILING...' : loading ? 'DEPLOYING...' : 'DEPLOY'}
          </button>
        </div>

        {/* Validation Status */}
        {(!name || !symbol || !collectionImage) && (
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
            <p className="text-xs text-yellow-400 retro-text font-bold mb-2">
              ⚠️ DEPLOY BUTTON DISABLED
            </p>
            <ul className="text-xs text-yellow-400/80 retro-text space-y-1">
              {!name && <li>• Missing: Collection Name</li>}
              {!symbol && <li>• Missing: Collection Symbol</li>}
              {!collectionImage && <li>• Missing: Collection Image</li>}
            </ul>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-center text-green-400/60 retro-text pt-2 border-t border-green-700/50">
          <p className="blink">▶ AUTOMATIC IPFS UPLOAD & DEPLOYMENT</p>
          <p className="mt-1">✓ Pinata IPFS (Permanent hosting)</p>
          <p>✓ ERC721URIStorage with baseURI</p>
          <p>✓ OpenZeppelin v5.0.0 • Solidity 0.8.20</p>
          <p>✓ OpenSea & Marketplace Ready</p>
        </div>
      </div>
    </div>
  )
}
