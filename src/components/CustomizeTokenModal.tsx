'use client'
import { useState } from 'react'
import type { ReactElement } from 'react'

interface CustomizeTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onDeploy: (params: {
    name: string
    symbol: string
    initialSupply: string
    bytecode: string
    abi: any[]
  }) => void
}

export function CustomizeTokenModal({ isOpen, onClose, onDeploy }: CustomizeTokenModalProps): ReactElement | null {
  const [name, setName] = useState<string>('')
  const [symbol, setSymbol] = useState<string>('')
  const [initialSupply, setInitialSupply] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [compiling, setCompiling] = useState<boolean>(false)

  if (!isOpen) return null

  const handleDeploy = async (): Promise<void> => {
    if (!name || !symbol || !initialSupply) {
      alert('Please fill all fields')
      return
    }

    setLoading(true)
    setCompiling(true)

    try {
      console.log('🔧 Starting automatic token compilation...')
      console.log('📝 Parameters:', { name, symbol, initialSupply })

      // Step 1: Call compile API to generate bytecode
      const compileResponse = await fetch('/api/compile/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          symbol,
          initialSupply: initialSupply || '1000000' // Send initialSupply to API
        }),
      })

      const compileResult = await compileResponse.json()

      if (!compileResult.success) {
        console.error('❌ Compilation failed:', compileResult.error)
        alert(`Compilation failed: ${compileResult.error}`)
        return
      }

      console.log('✅ Contract compiled successfully!')
      console.log('📦 Bytecode length:', compileResult.bytecode.length)
      console.log('🔢 ABI functions:', compileResult.abi.length)

      setCompiling(false)

      // Step 2: Deploy with the compiled bytecode
      onDeploy({
        name,
        symbol,
        initialSupply,
        bytecode: compileResult.bytecode,
        abi: compileResult.abi,
      })

      // Reset form
      setName('')
      setSymbol('')
      setInitialSupply('')
      onClose()
    } catch (error) {
      console.error('❌ Token preparation error:', error)
      alert('Failed to prepare token deployment')
    } finally {
      setLoading(false)
      setCompiling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="retro-panel max-w-md w-full p-6 space-y-4 border-2 border-green-400 shadow-lg shadow-green-500/50">
        {/* Header */}
        <div className="text-center retro-text">
          <span className="blink text-sm">╔═══════════════════════╗</span>
          <div className="text-sm my-1">║ CUSTOMIZE ERC20 TOKEN ║</div>
          <span className="blink text-sm">╚═══════════════════════╝</span>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> TOKEN NAME:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Token"
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-3 py-2 rounded font-mono text-sm focus:border-green-400 focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Symbol Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> TOKEN SYMBOL:
            </label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MTK"
              maxLength={10}
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-3 py-2 rounded font-mono text-sm focus:border-green-400 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-green-400/60 mt-1 retro-text">
              * Used as contract name: {symbol || 'XXX'}Token
            </p>
          </div>

          {/* Initial Supply Input */}
          <div>
            <label className="block retro-text text-xs mb-1">
              <span className="blink">&gt;</span> INITIAL SUPPLY:
            </label>
            <input
              type="number"
              value={initialSupply}
              onChange={(e) => setInitialSupply(e.target.value)}
              placeholder="1000000"
              className="w-full bg-black/80 border-2 border-green-500/50 text-green-400 px-3 py-2 rounded font-mono text-sm focus:border-green-400 focus:outline-none"
              disabled={loading}
            />
            <p className="text-xs text-green-400/60 mt-1 retro-text">
              * All tokens will be minted to your address
            </p>
          </div>

          {/* Compilation Status */}
          {compiling && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
              <p className="text-xs text-green-400 retro-text text-center">
                <span className="blink">⚙️</span> Compiling contract with Solidity 0.8.20...
              </p>
            </div>
          )}
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
            disabled={loading || !name || !symbol || !initialSupply}
            className="flex-1 bg-green-600 hover:bg-green-500 text-black px-4 py-2 rounded font-mono font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compiling ? 'COMPILING...' : loading ? 'DEPLOYING...' : 'DEPLOY'}
          </button>
        </div>

        {/* Info */}
        <div className="text-xs text-center text-green-400/60 retro-text pt-2 border-t border-green-700/50">
          <p className="blink">▶ AUTOMATIC COMPILATION & DEPLOYMENT</p>
          <p className="mt-1">✓ OpenZeppelin ERC20 v5.0.0</p>
          <p>✓ Solidity 0.8.20 (Testnet Compatible)</p>
          <p>✓ Includes mint() function</p>
        </div>
      </div>
    </div>
  )
}
