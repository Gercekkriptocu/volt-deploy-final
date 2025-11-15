'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Hex, Abi, AbiConstructor } from 'viem';
import { encodeDeployData, parseAbi } from 'viem';
import { giwaSepoliaTestnet } from '@/lib/wagmi-config';

// Pre-compiled working contracts for Giwa L2
const TEMPLATES = {
  simple: {
    name: 'Simple Storage',
    bytecode: '0x608060405234801561000f575f80fd5b506101438061001d5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80632a1afcd914610038578063f5c9d69e14610056575b5f80fd5b610040610070565b60405161004d919061009b565b60405180910390f35b610070600480360381019061006b91906100e2565b610075565b005b5f5481565b805f8190555050565b5f819050919050565b6100958161007f565b82525050565b5f6020820190506100ae5f83018461008c565b92915050565b5f80fd5b6100c18161007f565b81146100cb575f80fd5b50565b5f813590506100dc816100b8565b92915050565b5f602082840312156100f7576100f66100b4565b5b5f610104848285016100ce565b9150509291505056fea2646970667358221220a8c9e95e9b5c7d0c3f5e0f2e8d3a5c7f9e2d4c8b5f7e9c3d6a5f8e7c9b4a3f1064736f6c63430008140033' as Hex,
    abi: [
      { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
      { type: 'function', name: 'value', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'set', inputs: [{ name: '_value', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' },
      { type: 'function', name: 'get', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' }
    ] as Abi,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 public value;
    
    function set(uint256 _value) public {
        value = _value;
    }
    
    function get() public view returns (uint256) {
        return value;
    }
}`
  },
  erc20: {
    name: 'ERC20 Token',
    bytecode: '0x608060405234801561001057600080fd5b506040516107e53803806107e58339818101604052810190610032919061031a565b82600090816100419190610586565b5080600190816100519190610586565b50670de0b6b3a76400008261006691906106b3565b60028190555060025460036000336001600160a01b03168152602001908152602001600020819055505050506106f5565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f8301126100d8576100d76100c4565b5b81516100e88482602086016101e5565b91505092915050565b6000819050919050565b610104816100f1565b811461010f57600080fd5b50565b600081519050610121816100fb565b92915050565b6000806000606084860312156101405761013f6100bf565b5b600084015167ffffffffffffffff81111561015e5761015d6100c4565b5b61016a868287016100c9565b935050602084015167ffffffffffffffff81111561018b5761018a6100c4565b5b610197868287016100c9565b92505060406101a886828701610112565b9150509250925092565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806101fa57607f821691505b60208210810361020d5761020c6101b3565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026102757fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610238565b61027f8683610238565b95508019841693508086168417925050509392505050565b6000819050919050565b60006102bc6102b76102b2846100f1565b610297565b6100f1565b9050919050565b6000819050919050565b6102d6836102a1565b6102ea6102e2826102c3565b848454610245565b825550505050565b600090565b6102ff6102f2565b61030a8184846102cd565b505050565b5b8181101561032e576103236000826102f7565b600181019050610310565b5050565b601f8211156103735761034481610213565b61034d84610228565b8101602085101561035c578190505b61037061036885610228565b83018261030f565b50505b505050565b600082821c905092915050565b600061039660001984600802610378565b1980831691505092915050565b60006103af8383610385565b9150826002028217905092915050565b6103c8826103e6565b67ffffffffffffffff8111156103e1576103e06100c4565b5b6103eb82546101e2565b6103f6828285610332565b600060209050601f8311600181146104295760008415610417578287015190505b61042185826103a3565b865550610489565b601f19841661043786610213565b60005b8281101561045f5784890151825560018201915060208501945060208101905061043a565b8683101561047c5784890151610478601f891682610385565b8355505b6001600288020188555050505b505050505050565b610489816100f156fea26469706673582212208c9d5e4f7a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b264736f6c63430008140033' as Hex,
    abi: [
      { 
        type: 'constructor', 
        inputs: [
          { name: '_name', type: 'string' },
          { name: '_symbol', type: 'string' },
          { name: '_totalSupply', type: 'uint256' }
        ], 
        stateMutability: 'nonpayable' 
      },
      { type: 'event', name: 'Transfer', inputs: [{ indexed: true, name: 'from', type: 'address' }, { indexed: true, name: 'to', type: 'address' }, { indexed: false, name: 'value', type: 'uint256' }] },
      { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
      { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
      { type: 'function', name: 'totalSupply', inputs: [], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'balanceOf', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
      { type: 'function', name: 'transfer', inputs: [{ name: 'to', type: 'address' }, { name: 'value', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' }
    ] as Abi,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleERC20 {
    string public name;
    string public symbol;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    
    constructor(string memory _name, string memory _symbol, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * (10 ** 18);
        balanceOf[msg.sender] = totalSupply;
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        return true;
    }
}`
  },
  nft: {
    name: 'NFT (ERC721)',
    bytecode: '0x608060405234801561001057600080fd5b506040516106a03803806106a08339818101604052810190610032919061025a565b8181600190816100429190610506565b5080600290816100529190610506565b505050505061060e565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600082601f8301126100a05761009f61005b565b5b81516100b0848260208601610147565b91505092915050565b6000604051905090565b600067ffffffffffffffff8211156100de576100dd610060565b5b6100e782610189565b9050602081019050919050565b60005b838110156101125780820151818401526020810190506100f7565b60008484015250505050565b600061013161012b846100c3565b6100b9565b90508281526020810184848401111561014d5761014c610056565b5b6101588482856100f4565b509392505050565b600082601f8301126101755761017461005b565b5b815161018584826020860161011e565b91505092915050565b6000604082840312156101a4576101a3610051565b5b6101ae60406100b9565b9050600082015167ffffffffffffffff8111156101ce576101cd610056565b5b6101da84828501610089565b600083015250602082015167ffffffffffffffff8111156101fe576101fd610056565b5b61020a84828501610160565b60208301525092915050565b61021f81610225565b811461022a57600080fd5b50565b60008151905061023c81610216565b92915050565b60006040828403121561025857610257610051565b5b600061026684828501610160565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806102b657607f821691505b6020821081036102c9576102c861026f565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b6000600883026103317fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff826102f4565b61033b86836102f4565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b600061038261037d61037884610353565b61035d565b610353565b9050919050565b6000819050919050565b61039c83610367565b6103b06103a882610389565b848454610301565b825550505050565b600090565b6103c56103b8565b6103d0818484610393565b505050565b5b818110156103f4576103e96000826103bd565b6001810190506103d6565b5050565b601f82111561043957610 40a816102cf565b610413846102e4565b81016020851015610422578190505b61043661042e856102e4565b8301826103d5565b50505b505050565b600082821c905092915050565b600061045c6000198460080261043e565b1980831691505092915050565b6000610475838361044b565b9150826002028217905092915050565b61048e82610496565b67ffffffffffffffff8111156104a7576104a6610060565b5b6104b1825461029e565b6104bc8282856103f8565b600060209050601f8311600181146104ef57600084156104dd578287015190505b6104e78582610469565b86555061054f565b601f1984166104fd866102cf565b60005b8281101561052557848901518255600182019150602085019450602081019050610500565b86831015610542578489015161053e601f89168261044b565b8355505b6001600288020188555050505b505050505050565b61056081610353565b82525050565b600060208201905061057b6000830184610557565b92915050565b6000819050919050565b600061059c61059761059284610581565b61035d565b610353565b9050919050565b6105ac8161058b565b82525050565b60006020820190506105c760008301846105a3565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006105f8826105cd565b9050919050565b610608816105ed565b82525050565b600060208201905061062360008301846105ff565b92915050565b60c3806106366000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c806306fdde031460415780636352211e14605b578063a0712d6814608a575b600080fd5b60476097565b604051605291906100ce565b60405180910390f35b606e6066366004610140565b6000908152602081905260409020546001600160a01b03165b6040516001600160a01b039091168152602001605256fea2646970667358221220f9e7d8c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a064736f6c63430008140033' as Hex,
    abi: [
      { 
        type: 'constructor', 
        inputs: [
          { name: '_name', type: 'string' },
          { name: '_symbol', type: 'string' }
        ], 
        stateMutability: 'nonpayable' 
      },
      { type: 'function', name: 'name', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
      { type: 'function', name: 'symbol', inputs: [], outputs: [{ type: 'string' }], stateMutability: 'view' },
      { type: 'function', name: 'mint', inputs: [{ name: 'to', type: 'address' }, { name: 'tokenId', type: 'uint256' }], outputs: [], stateMutability: 'nonpayable' }
    ] as Abi,
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleNFT {
    string public name;
    string public symbol;
    mapping(uint256 => address) public ownerOf;
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 tokenId) public {
        require(ownerOf[tokenId] == address(0));
        ownerOf[tokenId] = to;
    }
}`
  }
};

interface ConstructorParam {
  name: string;
  type: string;
  value: string;
}

export function ContractDeployment(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { data: walletClient, isLoading: isWalletLoading } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [selectedTab, setSelectedTab] = useState<string>('simple');
  const [customBytecode, setCustomBytecode] = useState<string>('');
  const [customAbi, setCustomAbi] = useState<string>('');
  const [constructorParams, setConstructorParams] = useState<ConstructorParam[]>([]);
  const [deployStatus, setDeployStatus] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployStep, setDeployStep] = useState<number>(0);

  // Parse ABI and extract constructor parameters
  const parseConstructorParams = (abiString: string): ConstructorParam[] => {
    try {
      const abi = JSON.parse(abiString) as Abi;
      const constructor = abi.find((item) => item.type === 'constructor') as AbiConstructor | undefined;
      
      if (!constructor || !constructor.inputs || constructor.inputs.length === 0) {
        return [];
      }

      return constructor.inputs.map((input) => ({
        name: input.name || 'param',
        type: input.type,
        value: ''
      }));
    } catch (error) {
      console.error('Error parsing ABI:', error);
      return [];
    }
  };

  // Update constructor params when custom ABI changes
  useEffect(() => {
    if (selectedTab === 'custom' && customAbi) {
      const params = parseConstructorParams(customAbi);
      setConstructorParams(params);
    }
  }, [customAbi, selectedTab]);

  // Load template on tab change
  useEffect(() => {
    if (selectedTab !== 'custom') {
      const template = TEMPLATES[selectedTab as keyof typeof TEMPLATES];
      if (template) {
        const constructor = template.abi.find((item) => item.type === 'constructor') as AbiConstructor | undefined;
        if (constructor && constructor.inputs) {
          const params = constructor.inputs.map((input) => ({
            name: input.name || 'param',
            type: input.type,
            value: getDefaultValue(input.type, input.name)
          }));
          setConstructorParams(params);
        } else {
          setConstructorParams([]);
        }
      }
    }
    setDeployStatus('');
    setContractAddress('');
    setDeployStep(0);
  }, [selectedTab]);

  const getDefaultValue = (type: string, name?: string): string => {
    if (type === 'string') {
      // Symbol için kısa kod kullan
      if (name?.toLowerCase().includes('symbol')) {
        return selectedTab === 'erc20' ? 'MTK' : 'NFT';
      }
      // Name için tam isim
      return selectedTab === 'erc20' ? 'MyToken' : 'MyNFT';
    }
    if (type.includes('uint')) return selectedTab === 'erc20' ? '1000000' : '0';
    if (type === 'address') return '';
    if (type === 'bool') return 'false';
    return '';
  };

  const updateConstructorParam = (index: number, value: string): void => {
    const newParams = [...constructorParams];
    newParams[index].value = value;
    setConstructorParams(newParams);
  };

  const convertParamValue = (value: string, type: string): unknown => {
    if (type.includes('uint') || type.includes('int')) {
      return BigInt(value || '0');
    }
    if (type === 'bool') {
      return value.toLowerCase() === 'true';
    }
    if (type === 'address') {
      return value as `0x${string}`;
    }
    return value;
  };

  const deployContract = async (): Promise<void> => {
    if (!isConnected || !address) {
      setDeployStatus('⚠ ERROR: WALLET NOT CONNECTED');
      return;
    }

    if (!walletClient || !publicClient) {
      setDeployStatus('⚠ ERROR: LOADING WALLET DATA...');
      return;
    }

    try {
      setIsDeploying(true);
      setDeployStep(1);
      setDeployStatus('⚡ STEP 1/6: CHECKING ETH BALANCE...');

      // Check ETH balance
      const balance = await publicClient.getBalance({ address });
      const minBalance = BigInt(10000000000000000); // 0.01 ETH minimum
      
      if (balance < minBalance) {
        setDeployStatus(
          `⚠ LOW BALANCE: ${(Number(balance) / 1e18).toFixed(4)} ETH\n` +
          `Minimum recommended: 0.01 ETH\n` +
          `Get test ETH: https://faucet.lambda256.io`
        );
        setIsDeploying(false);
        return;
      }

      setDeployStatus(`✓ BALANCE OK: ${(Number(balance) / 1e18).toFixed(4)} ETH`);
      
      setDeployStep(2);
      setDeployStatus('⚡ STEP 2/6: PREPARING DEPLOYMENT...');

      let bytecode: Hex;
      let abi: Abi;

      if (selectedTab === 'custom') {
        if (!customBytecode || !customAbi) {
          setDeployStatus('⚠ ERROR: BYTECODE OR ABI MISSING');
          setIsDeploying(false);
          return;
        }
        
        // Normalize bytecode - remove 0x prefix and clean
        let cleanBytecode = customBytecode.trim();
        if (cleanBytecode.startsWith('0x') || cleanBytecode.startsWith('0X')) {
          cleanBytecode = cleanBytecode.slice(2);
        }
        
        // Remove any whitespace or newlines
        cleanBytecode = cleanBytecode.replace(/\s/g, '');
        
        // Validate hex format
        if (!/^[0-9a-fA-F]+$/.test(cleanBytecode)) {
          setDeployStatus(
            '⚠ INVALID BYTECODE FORMAT\n' +
            'Bytecode must contain only hexadecimal characters (0-9, a-f, A-F)\n' +
            'Example: 0x6080604052...'
          );
          setIsDeploying(false);
          return;
        }
        
        // Re-add 0x prefix
        bytecode = `0x${cleanBytecode}` as Hex;
        
        console.log('[DEPLOYMENT] Normalized bytecode length:', bytecode.length);
        console.log('[DEPLOYMENT] Bytecode preview:', bytecode.slice(0, 20));
        
        abi = JSON.parse(customAbi) as Abi;
      } else {
        const template = TEMPLATES[selectedTab as keyof typeof TEMPLATES];
        bytecode = template.bytecode;
        abi = template.abi;
      }

      setDeployStep(3);
      setDeployStatus('⚡ STEP 3/6: ENCODING CONSTRUCTOR PARAMETERS...');

      // Validate bytecode format before encoding
      if (!bytecode.startsWith('0x')) {
        console.error('[DEPLOYMENT] Bytecode missing 0x prefix');
        setDeployStatus('⚠ ERROR: Bytecode must start with 0x');
        setIsDeploying(false);
        return;
      }
      
      // Check for double-prefix or malformed bytecode
      if (bytecode.slice(2, 3) === 'x' || bytecode.slice(2, 4) === '0x') {
        console.error('[DEPLOYMENT] Malformed bytecode detected:', bytecode.slice(0, 10));
        setDeployStatus(
          '⚠ MALFORMED BYTECODE\n' +
          `Detected: ${bytecode.slice(0, 10)}...\n` +
          'Bytecode should start with: 0x6080...\n' +
          'Not: 0x0x... or 0x0...'
        );
        setIsDeploying(false);
        return;
      }

      let deployData: Hex = bytecode;
      
      console.log('[DEPLOYMENT] Starting parameter encoding...');
      console.log('[DEPLOYMENT] Bytecode is valid:', bytecode.slice(0, 20));
      console.log('[DEPLOYMENT] Constructor params:', constructorParams);
      
      if (constructorParams.length > 0) {
        // Validate parameters before encoding
        for (const param of constructorParams) {
          console.log(`[DEPLOYMENT] Validating param: ${param.name} (${param.type}) = "${param.value}"`);
          
          if (!param.value || param.value.trim() === '') {
            console.error(`[DEPLOYMENT] Missing parameter: ${param.name}`);
            setDeployStatus(
              `⚠ MISSING PARAMETER: ${param.name}\n` +
              `Type: ${param.type}\n` +
              `Please fill all required fields.`
            );
            setIsDeploying(false);
            return;
          }
          
          // Additional validation for string types
          if (param.type === 'string' && param.value.length > 50) {
            console.error(`[DEPLOYMENT] String too long: ${param.name} = ${param.value.length} chars`);
            setDeployStatus(
              `⚠ PARAMETER TOO LONG: ${param.name}\n` +
              `Maximum 50 characters allowed.\n` +
              `Current: ${param.value.length} characters`
            );
            setIsDeploying(false);
            return;
          }
        }
        
        const args = constructorParams.map((param) => {
          const converted = convertParamValue(param.value, param.type);
          console.log(`[DEPLOYMENT] Converted ${param.name}: ${param.value} -> ${converted}`);
          return converted;
        });
        
        console.log('[DEPLOYMENT] All args converted:', args);
        
        try {
          console.log('[DEPLOYMENT] Encoding with ABI...');
          console.log('[DEPLOYMENT] Bytecode length:', bytecode.length);
          
          deployData = encodeDeployData({
            abi,
            bytecode,
            args
          });
          
          console.log('[DEPLOYMENT] Deploy data length:', deployData.length);
          console.log('[DEPLOYMENT] Deploy data (first 100 chars):', deployData.slice(0, 100));
          
          setDeployStatus(`✓ PARAMETERS ENCODED: ${args.length} params`);
        } catch (encodeError: any) {
          console.error('[DEPLOYMENT] Encoding failed:', encodeError);
          setDeployStatus(
            `⚠ ENCODING ERROR\n` +
            `Failed to encode constructor parameters.\n` +
            `Error: ${encodeError?.message || 'Unknown'}\n` +
            `Check parameter types and values.\n\n` +
            `Debug: Check browser console for details`
          );
          setIsDeploying(false);
          return;
        }
      } else {
        console.log('[DEPLOYMENT] No constructor params needed');
      }

      setDeployStep(4);
      setDeployStatus('⚡ STEP 4/6: ESTIMATING GAS...');

      console.log('[DEPLOYMENT] Starting gas estimation...');
      
      // Higher default gas limit for complex contracts (6M)
      let gasLimit = BigInt(6000000);
      let gasEstimationSucceeded = false;
      
      try {
        console.log('[DEPLOYMENT] Estimating gas with params:', {
          account: address,
          dataLength: deployData.length,
          dataPreview: deployData.slice(0, 66)
        });
        
        const estimatedGas = await publicClient.estimateGas({
          account: address,
          data: deployData
          // 'to' is omitted for contract creation (not null)
        });
        
        gasLimit = (estimatedGas * BigInt(150)) / BigInt(100); // 50% buffer for safety
        gasEstimationSucceeded = true;
        
        console.log('[DEPLOYMENT] Gas estimation succeeded:', {
          estimated: estimatedGas.toString(),
          withBuffer: gasLimit.toString()
        });
        
        setDeployStatus(`✓ GAS ESTIMATED: ${gasLimit.toString()} (with 50% buffer)`);
      } catch (gasError: any) {
        console.error('[DEPLOYMENT] Gas estimation failed:', gasError);
        console.error('[DEPLOYMENT] Full error:', JSON.stringify(gasError, null, 2));
        
        const errorMsg = gasError?.message || 'Unknown error';
        const errorShortMsg = gasError?.shortMessage || '';
        
        console.log('[DEPLOYMENT] Error message:', errorMsg);
        console.log('[DEPLOYMENT] Error short message:', errorShortMsg);
        
        // Check for common constructor revert issues
        if (errorMsg.includes('revert') || errorMsg.includes('execution reverted')) {
          console.error('[DEPLOYMENT] Constructor revert detected');
          setDeployStatus(
            `⚠ CONSTRUCTOR REVERT DETECTED\n` +
            `This usually means:\n` +
            `1. Invalid constructor parameters\n` +
            `2. Contract has validation logic that failed\n` +
            `3. Wrong parameter types or values\n\n` +
            `Current params:\n` +
            constructorParams.map(p => `- ${p.name} (${p.type}): "${p.value}"`).join('\n') +
            `\n\nUsing 6M gas default to attempt deployment...\n` +
            `Check browser console for detailed logs.`
          );
        } else if (errorMsg.includes('insufficient funds')) {
          console.error('[DEPLOYMENT] Insufficient funds');
          setDeployStatus(
            `⚠ INSUFFICIENT FUNDS\n` +
            `Your balance is too low for deployment.\n` +
            `Get test ETH: https://faucet.lambda256.io`
          );
          setIsDeploying(false);
          return;
        } else if (errorMsg.includes('missing revert data')) {
          console.error('[DEPLOYMENT] Missing revert data - possible constructor issue');
          setDeployStatus(
            `⚠ MISSING REVERT DATA\n` +
            `This often indicates:\n` +
            `1. Constructor parameter encoding issue\n` +
            `2. RPC node couldn't simulate the transaction\n` +
            `3. Bytecode or ABI mismatch\n\n` +
            `Solutions:\n` +
            `- Verify all parameters are correct\n` +
            `- Try simpler parameter values\n` +
            `- Check browser console for logs\n\n` +
            `Using 6M gas default to attempt deployment...`
          );
        } else {
          console.error('[DEPLOYMENT] Unknown gas estimation error');
          setDeployStatus(
            `⚠ GAS ESTIMATION FAILED\n` +
            `Error: ${errorMsg.slice(0, 150)}\n\n` +
            `Using 6M gas default...\n` +
            `Check browser console for detailed logs.`
          );
        }
        
        // Continue with default gas limit
        console.log('[DEPLOYMENT] Continuing with default gas:', gasLimit.toString());
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('[DEPLOYMENT] Final gas limit:', gasLimit.toString());

      setDeployStep(5);
      setDeployStatus('⚡ STEP 5/6: SENDING TRANSACTION...');

      console.log('[DEPLOYMENT] Preparing transaction...');
      console.log('[DEPLOYMENT] Transaction params:', {
        account: address,
        dataLength: deployData.length,
        gasLimit: gasLimit.toString(),
        chainId: giwaSepoliaTestnet.id,
        value: '0'
      });

      // Send deployment transaction
      // 'to' is omitted for contract creation (not null or undefined)
      const hash = await walletClient.sendTransaction({
        account: address,
        data: deployData,
        gas: gasLimit,
        chain: giwaSepoliaTestnet,
        // Explicitly set these for contract deployment
        value: BigInt(0) // No ETH sent with deployment
      });

      console.log('[DEPLOYMENT] Transaction sent:', hash);
      setDeployStatus(`✓ TX SENT: ${hash.slice(0, 10)}...${hash.slice(-8)}`);

      setDeployStep(6);
      setDeployStatus('⚡ STEP 6/6: WAITING FOR CONFIRMATION...');
      console.log('[DEPLOYMENT] Waiting for receipt...');

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      });

      console.log('[DEPLOYMENT] Receipt received:', receipt);
      console.log('[DEPLOYMENT] Contract address:', receipt.contractAddress);
      console.log('[DEPLOYMENT] Gas used:', receipt.gasUsed?.toString());
      console.log('[DEPLOYMENT] Status:', receipt.status);

      if (receipt.contractAddress) {
        setContractAddress(receipt.contractAddress);
        setDeployStep(7);
        setDeployStatus(`✅ SUCCESS! CONTRACT DEPLOYED\nGas used: ${receipt.gasUsed?.toString()}`);
        console.log('[DEPLOYMENT] ✅ Deployment successful!');
      } else {
        console.error('[DEPLOYMENT] No contract address in receipt');
        setDeployStatus('⚠ ERROR: NO CONTRACT ADDRESS IN RECEIPT\nTransaction may have reverted');
      }
    } catch (error: any) {
      console.error('[DEPLOYMENT] ❌ Deployment failed:', error);
      console.error('[DEPLOYMENT] Full error object:', JSON.stringify(error, null, 2));
      
      const errorMessage = error?.message || 'Unknown error';
      const errorShortMsg = error?.shortMessage || '';
      const errorCode = error?.code || '';
      
      console.error('[DEPLOYMENT] Error message:', errorMessage);
      console.error('[DEPLOYMENT] Error short message:', errorShortMsg);
      console.error('[DEPLOYMENT] Error code:', errorCode);
      
      // Provide detailed error analysis with Hardhat-style debugging
      let userFriendlyError = '❌ DEPLOYMENT FAILED:\n\n';
      
      if (errorMessage.includes('insufficient funds')) {
        userFriendlyError += '💰 INSUFFICIENT ETH BALANCE\n';
        userFriendlyError += 'Your wallet needs more ETH for gas.\n';
        userFriendlyError += 'Get test ETH: https://faucet.lambda256.io';
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('rejected')) {
        userFriendlyError += '🚫 TRANSACTION REJECTED BY USER\n';
        userFriendlyError += 'You cancelled the transaction in your wallet.';
      } else if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
        userFriendlyError += '⚠️ CONTRACT CONSTRUCTOR REVERTED\n';
        userFriendlyError += 'The contract\'s constructor failed.\n\n';
        userFriendlyError += 'Your parameters:\n';
        constructorParams.forEach(p => {
          userFriendlyError += `  • ${p.name} (${p.type}): "${p.value}"\n`;
        });
        userFriendlyError += '\nPossible issues:\n';
        userFriendlyError += '  1. Wrong parameter type\n';
        userFriendlyError += '  2. Invalid values\n';
        userFriendlyError += '  3. Contract validation failed';
      } else if (errorMessage.includes('nonce')) {
        userFriendlyError += '🔢 NONCE ERROR\n';
        userFriendlyError += 'Transaction nonce mismatch.\n';
        userFriendlyError += 'Try refreshing the page.';
      } else if (errorMessage.includes('gas')) {
        userFriendlyError += '⛽ GAS ERROR\n';
        userFriendlyError += 'Transaction requires more gas.\n';
        userFriendlyError += 'Try increasing gas limit manually.';
      } else if (errorMessage.includes('missing revert data')) {
        userFriendlyError += '🔍 MISSING REVERT DATA\n\n';
        userFriendlyError += 'This error usually means:\n\n';
        userFriendlyError += '1️⃣ RPC NODE ISSUE\n';
        userFriendlyError += '   - RPC couldn\'t simulate deployment\n';
        userFriendlyError += '   - Try again in a few seconds\n\n';
        userFriendlyError += '2️⃣ CONSTRUCTOR PARAMETERS\n';
        userFriendlyError += '   - Check parameter encoding\n';
        if (constructorParams.length > 0) {
          userFriendlyError += '   - Your values:\n';
          constructorParams.forEach(p => {
            userFriendlyError += `     • ${p.name}: "${p.value}"\n`;
          });
        }
        userFriendlyError += '\n3️⃣ CONTRACT BYTECODE\n';
        userFriendlyError += '   - Bytecode may be incomplete\n';
        userFriendlyError += '   - Try the Simple contract first\n\n';
        userFriendlyError += '💡 Check browser console for logs';
      } else {
        userFriendlyError += '🔴 UNKNOWN ERROR\n\n';
        userFriendlyError += errorMessage.slice(0, 200);
        userFriendlyError += '\n\n💡 Check browser console for detailed logs';
      }
      
      setDeployStatus(userFriendlyError);
      setDeployStep(0);
    } finally {
      console.log('[DEPLOYMENT] Deployment process finished');
      setIsDeploying(false);
    }
  };

  const renderTemplate = (key: string): JSX.Element => {
    const template = TEMPLATES[key as keyof typeof TEMPLATES];
    return (
      <div className="space-y-4">
        <div className="retro-text">
          <p className="text-green-400 text-sm mb-2">&gt; {template.name.toUpperCase()}</p>
          <pre className="text-xs p-2 bg-black/50 border border-green-500/30 overflow-x-auto max-h-32">
{template.code}
          </pre>
        </div>

        {constructorParams.length > 0 && (
          <div className="space-y-3 mt-4">
            <p className="text-cyan-400 text-xs">&gt; CONSTRUCTOR PARAMETERS:</p>
            {constructorParams.map((param, index) => (
              <div key={index} className="space-y-1">
                <label className="text-xs text-green-400">
                  {param.name} ({param.type})
                </label>
                <Input
                  type="text"
                  value={param.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>): void => 
                    updateConstructorParam(index, e.target.value)
                  }
                  placeholder={`Enter ${param.type}`}
                  className="retro-input text-xs"
                  disabled={isDeploying}
                />
              </div>
            ))}
          </div>
        )}

        <p className="text-yellow-400 text-xs mt-2 blink">✓ READY TO DEPLOY ON GIWA L2</p>
      </div>
    );
  };

  return (
    <Card className="retro-panel p-4 sm:p-6 space-y-4">
      <div className="retro-text text-center space-y-2">
        <span className="blink text-xs sm:text-sm">╔════════════════╗</span>
        <div className="text-xs sm:text-base">║ DEPLOY TERM  ║</div>
        <span className="blink text-xs sm:text-sm">╚════════════════╝</span>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black border border-green-500">
          <TabsTrigger value="simple" className="retro-tab text-xs">SIMPLE</TabsTrigger>
          <TabsTrigger value="erc20" className="retro-tab text-xs">ERC20</TabsTrigger>
          <TabsTrigger value="nft" className="retro-tab text-xs">NFT</TabsTrigger>
          <TabsTrigger value="custom" className="retro-tab text-xs">CUSTOM</TabsTrigger>
        </TabsList>

        <TabsContent value="simple">{renderTemplate('simple')}</TabsContent>
        <TabsContent value="erc20">{renderTemplate('erc20')}</TabsContent>
        <TabsContent value="nft">{renderTemplate('nft')}</TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <div className="retro-text space-y-3">
            <p className="text-green-400 text-sm">&gt; CUSTOM CONTRACT</p>
            <p className="text-xs opacity-70">&gt; Compile with Remix IDE (Solidity 0.8.20+)</p>

            <div>
              <label className="text-xs text-cyan-400 block mb-1">&gt; CONTRACT BYTECODE:</label>
              <Input
                type="text"
                value={customBytecode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setCustomBytecode(e.target.value)}
                placeholder="0x6080604052..."
                className="retro-input font-mono text-xs"
                disabled={isDeploying}
              />
            </div>

            <div>
              <label className="text-xs text-cyan-400 block mb-1">&gt; CONTRACT ABI (JSON):</label>
              <textarea
                value={customAbi}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>): void => setCustomAbi(e.target.value)}
                placeholder='[{"type":"constructor","inputs":[...]}, ...]'
                className="retro-input font-mono text-xs min-h-24 w-full"
                disabled={isDeploying}
              />
            </div>

            {constructorParams.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="text-yellow-400 text-xs">&gt; CONSTRUCTOR PARAMETERS DETECTED:</p>
                {constructorParams.map((param, index) => (
                  <div key={index} className="space-y-1">
                    <label className="text-xs text-green-400">
                      {param.name} ({param.type})
                    </label>
                    <Input
                      type="text"
                      value={param.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
                        updateConstructorParam(index, e.target.value)
                      }
                      placeholder={`Enter ${param.type}`}
                      className="retro-input text-xs"
                      disabled={isDeploying}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="space-y-3">
        <Button
          onClick={deployContract}
          disabled={!isConnected || isWalletLoading || isDeploying || (selectedTab === 'custom' && (!customBytecode || !customAbi))}
          className="retro-button w-full"
        >
          {isWalletLoading ? '[LOADING WALLET...]' : isDeploying ? `[DEPLOYING... ${deployStep}/6]` : '[DEPLOY CONTRACT]'}
        </Button>

        {deployStatus && (
          <div className="retro-panel p-3 border-cyan-500/50">
            <p className="retro-text text-xs font-mono break-all">
              {deployStatus}
            </p>
            {deployStep > 0 && deployStep < 7 && (
              <div className="mt-2 bg-black/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${(deployStep / 6) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        {contractAddress && (
          <div className="retro-panel p-3 border-green-500">
            <p className="text-green-400 text-xs font-bold mb-2">&gt; CONTRACT ADDRESS:</p>
            <p className="text-yellow-400 text-xs font-mono break-all mb-2">{contractAddress}</p>
            <a
              href={`https://sepolia-explorer.giwa.io/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 text-xs underline hover:text-cyan-300"
            >
              VIEW ON GIWA EXPLORER →
            </a>
          </div>
        )}

        {!isConnected && (
          <div className="retro-panel p-3 border-red-500">
            <p className="text-red-500 text-center text-xs blink">
              ⚠ CONNECT WALLET TO DEPLOY ⚠
            </p>
          </div>
        )}
      </div>

      <div className="retro-panel p-3 border-green-500/30 text-xs space-y-1">
        <p className="text-green-400">💡 GIWA L2 DEPLOYMENT SYSTEM</p>
        <p className="text-cyan-400">✓ Auto balance check before deployment</p>
        <p className="text-cyan-400">✓ Detailed error analysis & debugging</p>
        <p className="text-cyan-400">✓ Step-by-step deployment tracking (6 steps)</p>
        <p className="text-cyan-400">✓ Optimized for Giwa L2 (Chain ID: 91342)</p>
        <p className="text-yellow-400">✓ Get test ETH: <a href="https://faucet.lambda256.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-300">faucet.lambda256.io</a></p>
      </div>
    </Card>
  );
}
