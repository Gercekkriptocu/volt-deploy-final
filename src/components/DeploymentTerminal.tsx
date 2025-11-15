'use client'
import { useState, useEffect, useCallback } from 'react'
import type { ReactElement } from 'react'
import { ContractDeployer } from './ContractDeployer'
import { useNetwork } from '@/contexts/NetworkContext'

type LogType = 'info' | 'success' | 'warning' | 'error' | 'debug'

interface Log {
  time: string
  message: string
  type: LogType
}

export function DeploymentTerminal(): ReactElement {
  const { currentNetworkId } = useNetwork()
  const [logs, setLogs] = useState<Log[]>([
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), message: '🖥️ DEPLOYMENT TERMINAL INITIALIZED', type: 'success' },
    { time: new Date().toLocaleTimeString('en-US', { hour12: false }), message: '⏳ Ready for contract deployment...', type: 'info' },
  ])

  const addLog = useCallback((message: string, type: LogType = 'info') => {
    const newLog: Log = {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type,
    }
    setLogs((prev) => [...prev, newLog])
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom
    const terminal = document.getElementById('terminal-logs')
    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight
    }
  }, [logs])

  // Terminal color based on network
  const terminalColor = currentNetworkId === 'ARC' 
    ? '#A0A0A0' 
    : currentNetworkId === 'STABLE'
    ? '#10B981'
    : '#00ff00'

  const terminalBorder = currentNetworkId === 'ARC'
    ? 'border-[#A0A0A0]'
    : currentNetworkId === 'STABLE'
    ? 'border-emerald-400'
    : 'border-[#00ff00]'

  return (
    <div className="space-y-4">
      {/* Contract Deployment */}
      <ContractDeployer onLog={addLog} />

      {/* Terminal Logs */}
      <div className={`bg-[#0a0a0a] border-2 ${terminalBorder} rounded-lg p-4 max-h-[400px] overflow-y-auto`} id="terminal-logs">
        <h3 className="font-mono font-bold mb-3 flex items-center gap-2" style={{ color: terminalColor }}>
          <span className="animate-pulse">▶</span> DEPLOYMENT LOGS
        </h3>
        <div className="space-y-1">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`font-mono text-xs ${
                log.type === 'error'
                  ? 'text-red-400'
                  : log.type === 'success'
                  ? terminalColor === '#00ff00' ? 'text-[#00ff00]' : terminalColor === '#10B981' ? 'text-emerald-400' : 'text-[#A0A0A0]'
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
    </div>
  )
}
