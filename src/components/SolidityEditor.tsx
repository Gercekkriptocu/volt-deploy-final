'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Code2 } from 'lucide-react';
import { compileSolidity, CONTRACT_TEMPLATES, type CompileResult } from '@/utils/solidity-compiler';

interface SolidityEditorProps {
  onCompiled: (bytecode: string, abi: any[], contractName: string) => void;
}

export default function SolidityEditor({ onCompiled }: SolidityEditorProps) {
  const [template, setTemplate] = useState<'ERC20' | 'ERC721' | 'custom'>('ERC20');
  const [code, setCode] = useState<string>(CONTRACT_TEMPLATES.ERC20);
  const [contractName, setContractName] = useState<string>('MyToken');
  const [compiling, setCompiling] = useState<boolean>(false);
  const [result, setResult] = useState<CompileResult | null>(null);

  useEffect(() => {
    if (template === 'ERC20') {
      setCode(CONTRACT_TEMPLATES.ERC20);
      setContractName('MyToken');
    } else if (template === 'ERC721') {
      setCode(CONTRACT_TEMPLATES.ERC721);
      setContractName('MyNFT');
    }
  }, [template]);

  const handleCompile = async () => {
    setCompiling(true);
    setResult(null);

    // Simulate async compilation (solc is sync but we add delay for UX)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const compileResult = compileSolidity(code, contractName);
    setResult(compileResult);
    setCompiling(false);

    if (compileResult.success && compileResult.bytecode && compileResult.abi) {
      onCompiled(compileResult.bytecode, compileResult.abi, contractName);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code2 className="w-5 h-5" />
          Solidity Editor
        </CardTitle>
        <CardDescription>
          Write or select a template, then compile to get bytecode and ABI automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selector */}
        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <Select value={template} onValueChange={(v) => setTemplate(v as 'ERC20' | 'ERC721' | 'custom')}>
            <SelectTrigger id="template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ERC20">ERC20 Token (OpenZeppelin)</SelectItem>
              <SelectItem value="ERC721">ERC721 NFT (OpenZeppelin)</SelectItem>
              <SelectItem value="custom">Custom Contract</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Contract Name */}
        <div className="space-y-2">
          <Label htmlFor="contractName">Contract Name</Label>
          <input
            id="contractName"
            type="text"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder="MyToken"
          />
        </div>

        {/* Code Editor */}
        <div className="space-y-2">
          <Label htmlFor="code">Solidity Code</Label>
          <Textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono text-sm h-64"
            placeholder="Paste your Solidity code here..."
          />
        </div>

        {/* Compile Button */}
        <Button onClick={handleCompile} disabled={compiling || !code.trim() || !contractName.trim()} className="w-full">
          {compiling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Compiling...
            </>
          ) : (
            <>
              <Code2 className="w-4 h-4 mr-2" />
              Compile Contract
            </>
          )}
        </Button>

        {/* Compilation Result */}
        {result && (
          <div className="space-y-2">
            {result.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✅ Compilation successful! Bytecode and ABI ready for deployment.
                  {result.warnings && result.warnings.length > 0 && (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer">⚠️ {result.warnings.length} warnings</summary>
                      <pre className="mt-2 p-2 bg-yellow-50 rounded text-yellow-800 overflow-auto max-h-32">
                        {result.warnings.join('\n')}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="font-semibold mb-1">❌ Compilation failed</div>
                  <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">{result.error}</pre>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
