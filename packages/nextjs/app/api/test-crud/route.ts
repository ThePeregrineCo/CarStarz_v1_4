import { NextResponse } from 'next/server'
import { vehicleProfiles } from '../../../lib/api/vehicles'

export async function GET() {
  try {
    const results = {
      vehicleProfile: null as any,
      modification: null as any,
      media: null as any,
      cleanup: { success: true } as const,
    }

    // Generate unique test data
    const timestamp = Math.floor(Date.now() / 1000) // Use seconds instead of milliseconds
    const tokenId = timestamp.toString() // Use seconds timestamp as unique token_id
    const testProfile = {
      vin: `TEST${timestamp}`, // Use timestamp in VIN to make it unique
      make: 'Toyota',
      model: 'Supra',
      year: 2024,
      name: 'Test Supra',
      description: 'Test vehicle profile',
      owner_id: '00000000-0000-0000-0000-000000000000', // Using a dummy UUID for testing
    }

    try {
      // 1. Create vehicle profile
      results.vehicleProfile = await vehicleProfiles.create(tokenId, testProfile)
      console.log('Created vehicle profile:', results.vehicleProfile)

      // 2. Add modification
      const testMod = {
        name: 'Test Turbo',
        description: 'Test modification',
        category: 'Performance',
      }
      // Convert tokenId to number for addModification
      const tokenIdNum = parseInt(tokenId, 10)
      results.modification = await vehicleProfiles.addModification(
        tokenIdNum,
        testMod
      )
      console.log('Added modification:', results.modification)

      // 3. Add media
      const testMedia = new FormData()
      const testImage = new Blob(['test'], { type: 'image/jpeg' })
      testMedia.append('file', testImage, 'test.jpg')
      testMedia.append('caption', 'Test image')
      results.media = await vehicleProfiles.addMedia(
        tokenId,
        testMedia
      )
      console.log('Added media:', results.media)

      // 4. Read vehicle profile with relations
      const profile = await vehicleProfiles.getByTokenId(tokenId)
      console.log('Read profile with relations:', profile)

      // 5. Update vehicle profile
      const updatedProfile = await vehicleProfiles.update(tokenId, {
        name: 'Updated Test Supra',
        description: 'Updated test vehicle profile',
      })
      console.log('Updated profile:', updatedProfile)

      // 6. Clean up test data
      // Note: There is no direct delete method for vehicle profiles
      // In a real implementation, you would need to delete all related data first
      console.log('Skipping cleanup as there is no direct delete method for vehicle profiles')
      console.log('In a production environment, you would need to implement proper cleanup')

      return NextResponse.json({
        success: true,
        results,
      })
    } catch (operationError) {
      console.error('Operation failed:', operationError)
      if (operationError instanceof Error) {
        console.error('Error name:', operationError.name)
        console.error('Error message:', operationError.message)
        console.error('Error stack:', operationError.stack)
      }
      throw operationError
    }
  } catch (error) {
    console.error('Test failed:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      },
      { status: 500 }
    )
  }
} 