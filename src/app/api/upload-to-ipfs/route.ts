import { NextRequest, NextResponse } from 'next/server'

// Pinata API endpoints
const PINATA_API_URL = 'https://api.pinata.cloud'
const PINATA_GATEWAY = 'https://gateway.pinata.cloud'

// Primary Pinata JWT token - Full access to IPFS storage
const PINATA_JWT_PRIMARY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIzZTk0YWI2Ni1iNDk2LTQ0M2YtODAwNi1iNTZhYzVhYmYxOTEiLCJlbWFpbCI6Imcua3JpcHRvY3VAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjFkMDgzNWQwNTliODJhMjdjOTIyIiwic2NvcGVkS2V5U2VjcmV0IjoiYjUzOTk5NWNlZjI2YmVkYWU1NGFiYWU1NTZlOGNlMGMzNGE0ZmEwYjBiNDZkODhmNDcwM2M5ODAwNzc3MzAzZCIsImV4cCI6MTc5MzkwNTA0OX0.leqBHPjkGcdS1OvYCHfY_B9TId29huI6_I5Xy3JDqTU'

// Backup Pinata JWT token #1 - First fallback if primary fails
const PINATA_JWT_BACKUP = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlMTlkMDJiNC1hYTBiLTQ2N2UtOTU5MC05N2Y1MTE5NmEzNDAiLCJlbWFpbCI6InNldGhlcGFpMjFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6Ijg2MjE1OGQ5NjgzYjFhNzA4MWZkIiwic2NvcGVkS2V5U2VjcmV0IjoiMjE1MTU4MWE0YWM3Njk3MGMzNTUwMTA5ZDg4ODMxMzZjZDI2ZDEyMTIxZjQ1NjdkMmFhZjkxZTdlMzYyNzNhZCIsImV4cCI6MTc5MzkwNTQ1OH0.vGcyvq6Ivg4s8V9Yj2i8rCAProJumuKul1O4CDEN0As'

// Backup Pinata JWT token #2 - Second fallback for maximum reliability
const PINATA_JWT_BACKUP_2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJlNDIxMDZkZS02OGUwLTQ3MWEtYmUyMC03YWFjNTZmZDRiMjEiLCJlbWFpbCI6InZvbHRuZXdzZG90eHl6QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIzMjEwYWJjNjI3ZDJhNTRkZGNiYiIsInNjb3BlZEtleVNlY3JldCI6IjJlZjc4NTM1MzNkMDIyZWZkNTVlNWVkYTZlYjIyZmE2ZTM1YTU4Yzg3ZTJlMTA2NmJiZWMzOTFmYzUzZWY5NzIiLCJleHAiOjE3OTM5MDg1MDF9.KD91y_RLpq1bm71o663tg1ntOaM9xSly4LNH-n03AwA'

// Helper function to upload to Pinata with 3-tier fallback support
async function uploadToPinata(
  formData: FormData,
  endpoint: string = '/pinning/pinFileToIPFS'
): Promise<Response> {
  // Try primary token first
  console.log('🔄 Attempting upload with primary token...')
  let response = await fetch(`${PINATA_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PINATA_JWT_PRIMARY}`,
    },
    body: formData,
  })

  // If primary fails, try first backup token
  if (!response.ok) {
    console.log('⚠️ Primary token failed, trying backup token #1...')
    response = await fetch(`${PINATA_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT_BACKUP}`,
      },
      body: formData,
    })

    // If first backup fails, try second backup token
    if (!response.ok) {
      console.log('⚠️ Backup token #1 failed, trying backup token #2...')
      response = await fetch(`${PINATA_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PINATA_JWT_BACKUP_2}`,
        },
        body: formData,
      })

      if (response.ok) {
        console.log('✅ Backup token #2 succeeded!')
      } else {
        console.error('❌ All 3 tokens failed!')
      }
    } else {
      console.log('✅ Backup token #1 succeeded!')
    }
  } else {
    console.log('✅ Primary token succeeded!')
  }

  return response
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const description = formData.get('description') as string || ''
    const symbol = formData.get('symbol') as string

    if (!file || !name || !symbol) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: file, name, or symbol' },
        { status: 400 }
      )
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📤 STARTING IPFS UPLOAD WITH PROPER FOLDER STRUCTURE')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Collection:', name)
    console.log('📝 Symbol:', symbol)
    console.log('🖼️ File:', file.name, file.type, file.size, 'bytes')

    // STEP 1: Upload collection image to IPFS
    console.log('\n🚀 STEP 1: Uploading collection image...')
    
    const imageFormData = new FormData()
    imageFormData.append('file', file)
    
    const pinataMetadata = JSON.stringify({
      name: `${symbol}-collection-image`,
    })
    imageFormData.append('pinataMetadata', pinataMetadata)

    const imageUploadResponse = await uploadToPinata(imageFormData)

    if (!imageUploadResponse.ok) {
      const errorData = await imageUploadResponse.text()
      console.error('❌ Image upload failed:', errorData)
      throw new Error(`Image upload failed: ${imageUploadResponse.status} - ${errorData}`)
    }

    const imageData = await imageUploadResponse.json()
    const imageCid = imageData.IpfsHash
    const imageUrl = `ipfs://${imageCid}`
    
    console.log('✅ Image uploaded successfully')
    console.log('🔗 Image CID:', imageCid)
    console.log('🔗 Image URL:', imageUrl)

    // STEP 2: Create single base metadata template
    console.log('\n🚀 STEP 2: Creating base metadata template...')
    
    // Create a single base metadata JSON that the contract will use
    const baseMetadata = {
      name: `${name} #{{id}}`,
      description: description || `NFT from ${name} collection`,
      image: imageUrl,
      attributes: [
        {
          trait_type: 'Collection',
          value: name
        }
      ]
    }
    
    console.log('📝 Base metadata template created')

    // STEP 3: Upload base metadata to IPFS
    console.log('\n🚀 STEP 3: Uploading base metadata to IPFS...')
    
    const metadataBlob = new Blob([JSON.stringify(baseMetadata)], { type: 'application/json' })
    const metadataFile = new File([metadataBlob], 'metadata.json', { type: 'application/json' })
    
    const metadataFormData = new FormData()
    metadataFormData.append('file', metadataFile)
    
    const metadataPinataMetadata = JSON.stringify({
      name: `${symbol}-base-metadata`,
    })
    metadataFormData.append('pinataMetadata', metadataPinataMetadata)

    const metadataUploadResponse = await uploadToPinata(metadataFormData)

    if (!metadataUploadResponse.ok) {
      const errorData = await metadataUploadResponse.text()
      console.error('❌ Metadata upload failed:', errorData)
      throw new Error(`Metadata upload failed: ${metadataUploadResponse.status} - ${errorData}`)
    }

    const metadataData = await metadataUploadResponse.json()
    const folderCid = metadataData.IpfsHash
    
    // baseURI points directly to the metadata file (all tokens share this metadata)
    const baseURI = `ipfs://${folderCid}`
    
    console.log('✅ Metadata uploaded successfully')
    console.log('🔗 Metadata CID:', folderCid)
    console.log('🔗 Base URI:', baseURI)
    console.log('📝 All tokens will use this metadata')
    
    // STEP 4: Create collection metadata (for marketplaces)
    console.log('\n🚀 STEP 4: Creating collection metadata...')
    
    const collectionMetadata = {
      name: name,
      description: description || `${name} NFT Collection`,
      image: imageUrl,
      external_link: '',
      seller_fee_basis_points: 0,
      fee_recipient: ''
    }

    const collectionBlob = new Blob([JSON.stringify(collectionMetadata)], { type: 'application/json' })
    const collectionFile = new File([collectionBlob], 'collection.json', { type: 'application/json' })

    const collectionFormData = new FormData()
    collectionFormData.append('file', collectionFile)
    
    const collectionPinataMetadata = JSON.stringify({
      name: `${symbol}-collection-metadata`,
    })
    collectionFormData.append('pinataMetadata', collectionPinataMetadata)

    const collectionUploadResponse = await uploadToPinata(collectionFormData)

    let collectionMetadataCid = null
    if (collectionUploadResponse.ok) {
      const collectionData = await collectionUploadResponse.json()
      collectionMetadataCid = collectionData.IpfsHash
      console.log('✅ Collection metadata uploaded')
      console.log('🔗 Collection CID:', collectionMetadataCid)
    } else {
      console.warn('⚠️ Collection metadata upload failed, but continuing...')
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 IPFS UPLOAD COMPLETE!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Summary:')
    console.log(`   ✓ Image CID: ${imageCid}`)
    console.log(`   ✓ Metadata CID: ${folderCid}`)
    console.log(`   ✓ Base URI: ${baseURI}`)
    console.log(`   ✓ Ready for deployment`)

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      imageCid: imageCid,
      baseURI: baseURI, // This will be used as constructor parameter
      metadataFolderCid: folderCid,
      collectionMetadataCid: collectionMetadataCid,
      collectionMetadata: collectionMetadata,
      // Gateway URLs for preview
      imageGateway: `${PINATA_GATEWAY}/ipfs/${imageCid}`,
      metadataGateway: `${PINATA_GATEWAY}/ipfs/${folderCid}`,
      collectionGateway: collectionMetadataCid ? `${PINATA_GATEWAY}/ipfs/${collectionMetadataCid}` : null
    })
  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ IPFS UPLOAD FAILED')
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    
    return NextResponse.json(
      {
        success: false,
        error: `IPFS upload failed: ${error.message}`,
        details: error.toString()
      },
      { status: 500 }
    )
  }
}
