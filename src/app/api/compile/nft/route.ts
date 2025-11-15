import { NextRequest, NextResponse } from 'next/server';
import solc from 'solc';

// OpenZeppelin v5.0.0 ERC721 contracts (embedded for compilation)
const OPENZEPPELIN_CONTRACTS: Record<string, { content: string }> = {
  '@openzeppelin/contracts/token/ERC721/ERC721.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "./IERC721.sol";
import {IERC721Metadata} from "./extensions/IERC721Metadata.sol";
import {Context} from "../../utils/Context.sol";
import {IERC721Errors} from "../../interfaces/draft-IERC6093.sol";
import {IERC165, ERC165} from "../../utils/introspection/ERC165.sol";

abstract contract ERC721 is Context, ERC165, IERC721, IERC721Metadata, IERC721Errors {
    mapping(uint256 tokenId => address) private _owners;
    mapping(address owner => uint256) private _balances;
    mapping(uint256 tokenId => address) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool)) private _operatorApprovals;

    string private _name;
    string private _symbol;

    constructor(string memory name_, string memory symbol_) {
        _name = name_;
        _symbol = symbol_;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC721).interfaceId || interfaceId == type(IERC721Metadata).interfaceId || super.supportsInterface(interfaceId);
    }

    function balanceOf(address owner) public view virtual returns (uint256) {
        if (owner == address(0)) {
            revert ERC721InvalidOwner(address(0));
        }
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view virtual returns (address) {
        return _requireOwned(tokenId);
    }

    function name() public view virtual returns (string memory) {
        return _name;
    }

    function symbol() public view virtual returns (string memory) {
        return _symbol;
    }

    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        _requireOwned(tokenId);
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string.concat(baseURI, _toString(tokenId)) : "";
    }

    function _baseURI() internal view virtual returns (string memory) {
        return "";
    }

    function approve(address to, uint256 tokenId) public virtual {
        _approve(to, tokenId, _msgSender());
    }

    function getApproved(uint256 tokenId) public view virtual returns (address) {
        _requireOwned(tokenId);
        return _getApproved(tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view virtual returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, _msgSender());
        if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public virtual {
        transferFrom(from, to, tokenId);
    }

    function _ownerOf(uint256 tokenId) internal view virtual returns (address) {
        return _owners[tokenId];
    }

    function _getApproved(uint256 tokenId) internal view virtual returns (address) {
        return _tokenApprovals[tokenId];
    }

    function _isAuthorized(address owner, address spender, uint256 tokenId) internal view virtual returns (bool) {
        return spender != address(0) && (owner == spender || isApprovedForAll(owner, spender) || _getApproved(tokenId) == spender);
    }

    function _checkAuthorized(address owner, address spender, uint256 tokenId) internal view virtual {
        if (!_isAuthorized(owner, spender, tokenId)) {
            if (owner == address(0)) {
                revert ERC721NonexistentToken(tokenId);
            } else {
                revert ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    function _increaseBalance(address account, uint128 value) internal virtual {
        unchecked {
            _balances[account] += value;
        }
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual returns (address) {
        address from = _ownerOf(tokenId);

        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        if (from != address(0)) {
            _approve(address(0), tokenId, address(0), false);
            unchecked {
                _balances[from] -= 1;
            }
        }

        if (to != address(0)) {
            unchecked {
                _balances[to] += 1;
            }
        }

        _owners[tokenId] = to;
        emit Transfer(from, to, tokenId);
        return from;
    }

    function _mint(address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner != address(0)) {
            revert ERC721InvalidSender(address(0));
        }
    }

    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal virtual {
        _mint(to, tokenId);
    }

    function _burn(uint256 tokenId) internal {
        address previousOwner = _update(address(0), tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (to == address(0)) {
            revert ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0));
        if (previousOwner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        } else if (previousOwner != from) {
            revert ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }

    function _approve(address to, uint256 tokenId, address auth) internal {
        _approve(to, tokenId, auth, true);
    }

    function _approve(address to, uint256 tokenId, address auth, bool emitEvent) internal virtual {
        if (emitEvent || auth != address(0)) {
            address owner = _requireOwned(tokenId);

            if (auth != address(0) && owner != auth && !isApprovedForAll(owner, auth)) {
                revert ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit Approval(owner, to, tokenId);
            }
        }

        _tokenApprovals[tokenId] = to;
    }

    function _setApprovalForAll(address owner, address operator, bool approved) internal virtual {
        if (operator == address(0)) {
            revert ERC721InvalidOperator(operator);
        }
        _operatorApprovals[owner][operator] = approved;
        emit ApprovalForAll(owner, operator, approved);
    }

    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert ERC721NonexistentToken(tokenId);
        }
        return owner;
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
`,
  },
  '@openzeppelin/contracts/token/ERC721/IERC721.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "../../utils/introspection/IERC165.sol";

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}
`,
  },
  '@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC721} from "../IERC721.sol";

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
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
  '@openzeppelin/contracts/utils/introspection/IERC165.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
`,
  },
  '@openzeppelin/contracts/utils/introspection/ERC165.sol': {
    content: `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC165} from "./IERC165.sol";

abstract contract ERC165 is IERC165 {
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
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

// Generate ERC721 NFT source code with baseURI support
// Based on user-provided template, simplified and OpenZeppelin 5.0.0 compatible
function generateNFTSource(name: string, symbol: string): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ${symbol}NFT is ERC721 {
    uint256 public nextTokenId = 1;
    string private _baseTokenURI;

    constructor(string memory baseURI_) ERC721("${name}", "${symbol}") {
        require(bytes(baseURI_).length > 0, "Base URI cannot be empty");
        _baseTokenURI = baseURI_;
    }

    // Public mint function (anyone can mint)
    function mint(address to) public returns (uint256) {
        uint256 tokenId = nextTokenId;
        nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }

    // Base URI getter (for transparency)
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // tokenURI override – Returns baseURI directly (all tokens share same metadata)
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId); // Token existence check
        return _baseTokenURI; // All tokens use the same metadata
    }
}`;
}

export async function POST(req: NextRequest) {
  try {
    const { name, symbol, baseURI } = await req.json();

    if (!name || !symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing name or symbol' },
        { status: 400 }
      );
    }

    // Generate contract source with baseURI support
    const sourceCode = generateNFTSource(name, symbol);
    const contractName = `${symbol}NFT`;

    console.log('🔧 Compiling NFT contract with IPFS baseURI support:', contractName);
    console.log('📝 Source code generated');
    if (baseURI) {
      console.log('🔗 Base URI provided:', baseURI);
    }

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

    console.log('✅ NFT contract compiled successfully');
    console.log(`📦 Bytecode length: ${bytecode.length} chars`);
    console.log(`🔢 ABI functions: ${abi.length}`);;

    return NextResponse.json({
      success: true,
      bytecode: `0x${bytecode}`,
      abi,
      sourceCode,
      contractName,
      hasBaseURI: true,
      warnings: output.errors
        ?.filter((e: any) => e.severity === 'warning')
        .map((w: any) => w.message),
    });
  } catch (error: any) {
    console.error('❌ NFT compilation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Compilation failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}
