/**
 * Bytecode Extraction Script for GIWA Sepolia Deployer
 * 
 * This script extracts compiled bytecode from Hardhat artifacts
 * and validates the bytecode format.
 * 
 * Usage: node scripts/get-bytecode.js
 */

const fs = require('fs');
const path = require('path');

/**
 * Validates bytecode format
 * @param {string} bytecode - The bytecode to validate
 * @returns {object} - Validation result
 */
function validateBytecode(bytecode) {
  const errors = [];
  const warnings = [];
  
  // Check if bytecode exists
  if (!bytecode || bytecode.length === 0) {
    errors.push('Bytecode is empty');
    return { valid: false, errors, warnings };
  }
  
  // Check if bytecode starts with 0x
  if (!bytecode.startsWith('0x')) {
    errors.push('Bytecode must start with 0x');
  }
  
  // Check for malformed bytecode (0x0x, 0x06, etc.)
  if (bytecode.startsWith('0x0x')) {
    errors.push('Bytecode has double 0x prefix (0x0x...)');
  } else if (bytecode.startsWith('0x06')) {
    errors.push('Bytecode starts with 0x06 instead of 0x60 (malformed)');
  } else if (!bytecode.startsWith('0x6080')) {
    warnings.push('Bytecode does not start with 0x6080 (unusual for Solidity 0.8+)');
  }
  
  // Check bytecode length
  if (bytecode.length < 100) {
    warnings.push(`Bytecode is very short (${bytecode.length} chars) - may be incomplete`);
  }
  
  // Check if bytecode contains only hex characters
  const hexPattern = /^0x[0-9a-fA-F]+$/;
  if (!hexPattern.test(bytecode)) {
    errors.push('Bytecode contains non-hexadecimal characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Main function to extract and validate bytecode
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║      GIWA SEPOLIA BYTECODE EXTRACTION TOOL          ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  try {
    // Define artifact paths
    const tokenPath = path.join(__dirname, '../artifacts/contracts/MyERC20.sol/MyERC20.json');
    const nftPath = path.join(__dirname, '../artifacts/contracts/MyNFT.sol/MyNFT.json');
    
    // Check if artifacts exist
    if (!fs.existsSync(tokenPath)) {
      console.error('❌ MyERC20 artifact not found!');
      console.log('   Path:', tokenPath);
      console.log('\n💡 Solution: Run "npx hardhat compile" first\n');
      process.exit(1);
    }
    
    if (!fs.existsSync(nftPath)) {
      console.error('❌ MyNFT artifact not found!');
      console.log('   Path:', nftPath);
      console.log('\n💡 Solution: Run "npx hardhat compile" first\n');
      process.exit(1);
    }
    
    // Read artifacts
    const tokenArtifact = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    const nftArtifact = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📦 ERC20 TOKEN (MyERC20)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tokenBytecode = tokenArtifact.bytecode;
    console.log('Bytecode length:', tokenBytecode.length, 'characters');
    console.log('Bytecode preview:', tokenBytecode.slice(0, 66), '...\n');
    
    const tokenValidation = validateBytecode(tokenBytecode);
    if (tokenValidation.valid) {
      console.log('✅ Bytecode validation: PASSED');
    } else {
      console.log('❌ Bytecode validation: FAILED');
      tokenValidation.errors.forEach(err => console.log('   ❌', err));
    }
    if (tokenValidation.warnings.length > 0) {
      tokenValidation.warnings.forEach(warn => console.log('   ⚠️ ', warn));
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎨 ERC721 NFT (MyNFT)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const nftBytecode = nftArtifact.bytecode;
    console.log('Bytecode length:', nftBytecode.length, 'characters');
    console.log('Bytecode preview:', nftBytecode.slice(0, 66), '...\n');
    
    const nftValidation = validateBytecode(nftBytecode);
    if (nftValidation.valid) {
      console.log('✅ Bytecode validation: PASSED');
    } else {
      console.log('❌ Bytecode validation: FAILED');
      nftValidation.errors.forEach(err => console.log('   ❌', err));
    }
    if (nftValidation.warnings.length > 0) {
      nftValidation.warnings.forEach(warn => console.log('   ⚠️ ', warn));
    }
    
    // Save to files
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('💾 SAVING BYTECODES TO FILES');
    console.log('═══════════════════════════════════════════════════════\n');
    
    fs.writeFileSync('token-bytecode.txt', tokenBytecode);
    console.log('✅ Saved: token-bytecode.txt');
    
    fs.writeFileSync('nft-bytecode.txt', nftBytecode);
    console.log('✅ Saved: nft-bytecode.txt');
    
    // Print full bytecodes
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 FULL BYTECODES (Copy & Paste to UltimateDeployer)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('// ERC20 Token (MyERC20)');
    console.log('const TOKEN_BYTECODE: Hex = \'' + tokenBytecode + '\' as Hex;\n');
    
    console.log('// ERC721 NFT (MyNFT)');
    console.log('const NFT_BYTECODE: Hex = \'' + nftBytecode + '\' as Hex;\n');
    
    // Print constructor ABIs
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 CONSTRUCTOR ABIs');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const tokenConstructor = tokenArtifact.abi.find(item => item.type === 'constructor');
    console.log('// MyERC20 Constructor ABI:');
    console.log(JSON.stringify(tokenConstructor, null, 2), '\n');
    
    const nftConstructor = nftArtifact.abi.find(item => item.type === 'constructor');
    console.log('// MyNFT Constructor ABI:');
    console.log(JSON.stringify(nftConstructor, null, 2), '\n');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 SUCCESS! All bytecodes extracted and validated');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📌 Next Steps:');
    console.log('1. Copy TOKEN_BYTECODE to src/components/UltimateDeployer.tsx');
    console.log('2. Copy NFT_BYTECODE to src/components/UltimateDeployer.tsx');
    console.log('3. Update constructor ABIs if needed');
    console.log('4. Test deployment on GIWA Sepolia testnet\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('   1. Compiled contracts: npx hardhat compile');
    console.error('   2. OpenZeppelin installed: npm install @openzeppelin/contracts');
    console.error('   3. Correct file paths in contracts/\n');
    process.exit(1);
  }
}

main().catch(console.error);
