import { NextRequest, NextResponse } from 'next/server';
import solc from 'solc';

// OpenZeppelin v5.0.0 ERC20 contracts (embedded for compilation)
const OPENZEPPELIN_CONTRACTS: Record<string, { content: string }> = {
  '@openzeppelin/contracts/token/ERC20/ERC20.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "./IERC20.sol";
import {IERC20Metadata} from "./extensions/IERC20Metadata.sol";
import {Context} from "../../utils/Context.sol";
import {IERC20Errors} from "../../interfaces/draft-IERC6093.sol";

abstract contract ERC20 is Context, IERC20, IERC20Metadata, IERC20Errors {
    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;
    uint256 private _totalSupply;
    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function decimals() public view virtual returns (uint8) {
        return 18;
    }

    function totalSupply() public view virtual returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view virtual returns (uint256) {
        return _balances[account];
    }

    function transfer(address to, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, value);
        return true;
    }

    function allowance(address owner, address spender) public view virtual returns (uint256) {
        return _allowances[owner][spender];
    }

    function approve(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _approve(owner, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public virtual returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, value);
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (from == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        if (to == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(from, to, value);
    }

    function _update(address from, address to, uint256 value) internal virtual {
        if (from == address(0)) {
            _totalSupply += value;
        } else {
            uint256 fromBalance = _balances[from];
            if (fromBalance < value) {
                revert ERC20InsufficientBalance(from, fromBalance, value);
            }
            unchecked {
                _balances[from] = fromBalance - value;
            }
        }

        if (to == address(0)) {
            unchecked {
                _totalSupply -= value;
            }
        } else {
            unchecked {
                _balances[to] += value;
            }
        }

        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidReceiver(address(0));
        }
        _update(address(0), account, value);
    }

    function _burn(address account, uint256 value) internal {
        if (account == address(0)) {
            revert ERC20InvalidSender(address(0));
        }
        _update(account, address(0), value);
    }

    function _approve(address owner, address spender, uint256 value) internal {
        _approve(owner, spender, value, true);
    }

    function _approve(address owner, address spender, uint256 value, bool emitEvent) internal virtual {
        if (owner == address(0)) {
            revert ERC20InvalidApprover(address(0));
        }
        if (spender == address(0)) {
            revert ERC20InvalidSpender(address(0));
        }
        _allowances[owner][spender] = value;
        if (emitEvent) {
            emit Approval(owner, spender, value);
        }
    }

    function _spendAllowance(address owner, address spender, uint256 value) internal virtual {
        uint256 currentAllowance = allowance(owner, spender);
        if (currentAllowance != type(uint256).max) {
            if (currentAllowance < value) {
                revert ERC20InsufficientAllowance(spender, currentAllowance, value);
            }
            unchecked {
                _approve(owner, spender, currentAllowance - value, false);
            }
        }
    }
}
`,
  },
  '@openzeppelin/contracts/token/ERC20/IERC20.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}
`,
  },
  '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../IERC20.sol";

interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}
`,
  },
  '@openzeppelin/contracts/utils/Context.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}
`,
  },
  '@openzeppelin/contracts/interfaces/draft-IERC6093.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Errors {
    error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed);
    error ERC20InvalidSender(address sender);
    error ERC20InvalidReceiver(address receiver);
    error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed);
    error ERC20InvalidApprover(address approver);
    error ERC20InvalidSpender(address spender);
}

interface IERC721Errors {
    error ERC721InvalidOwner(address owner);
    error ERC721NonexistentToken(uint256 tokenId);
    error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);
    error ERC721InvalidSender(address sender);
    error ERC721InvalidReceiver(address receiver);
    error ERC721InsufficientApproval(address operator, uint256 tokenId);
    error ERC721InvalidApprover(address approver);
    error ERC721InvalidOperator(address operator);
}
`,
  },
};

// Generate ERC20 token source code
function generateTokenSource(name: string, symbol: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ${symbol}Token is ERC20 {
    constructor(uint256 initialSupply) ERC20("${name}", "${symbol}") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount * 10 ** decimals());
    }
}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, symbol, initialSupply } = await req.json();

    if (!name || !symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing name or symbol' },
        { status: 400 }
      );
    }

    // Validate initialSupply
    const supply = initialSupply || 1000000; // Default 1M tokens
    if (supply <= 0) {
      return NextResponse.json(
        { success: false, error: 'Initial supply must be positive' },
        { status: 400 }
      );
    }

    // Generate contract source
    const sourceCode = generateTokenSource(name, symbol);
    const contractName = `${symbol}Token`;

    console.log('🔧 Compiling token contract:', contractName);
    console.log('📝 Source code generated');

    // Prepare solc input
    const input = {
      language: 'Solidity',
      sources: {
        'main.sol': {
          content: sourceCode,
        },
        ...OPENZEPPELIN_CONTRACTS,
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };

    // Compile
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error');
      if (errors.length > 0) {
        console.error('❌ Compilation errors:', errors);
        return NextResponse.json({
          success: false,
          error: errors.map((e: any) => e.formattedMessage).join('\n\n'),
        });
      }
    }

    // Extract contract
    const contract = output.contracts['main.sol']?.[contractName];
    if (!contract) {
      return NextResponse.json({
        success: false,
        error: `Contract "${contractName}" not found in compilation output`,
      });
    }

    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;

    if (!bytecode || bytecode.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No bytecode generated',
      });
    }

    console.log('✅ Token contract compiled successfully');
    console.log(`📦 Bytecode length: ${bytecode.length} chars`);
    console.log(`🔢 ABI functions: ${abi.length}`);

    return NextResponse.json({
      success: true,
      bytecode: `0x${bytecode}`,
      abi,
      sourceCode,
      contractName,
      warnings: output.errors
        ?.filter((e: any) => e.severity === 'warning')
        .map((w: any) => w.message),
    });
  } catch (error: any) {
    console.error('❌ Token compilation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Compilation failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
