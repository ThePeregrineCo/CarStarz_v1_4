import { NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { getWalletAddressFromRequest } from "../../../lib/utils/authHelpers";
import { getSupabaseClient } from "../../../lib/supabase";

// Function to get the next token ID
async function getNextTokenId() {
  const counterPath = join(process.cwd(), "data", "tokenCounter.json");
  try {
    const counterDataRaw = await readFile(counterPath, "utf-8");
    const counterData = JSON.parse(counterDataRaw);
    const nextId = (counterData.default || 0) + 1;
    await writeFile(counterPath, JSON.stringify({ default: nextId }));
    return nextId;
  } catch {
    // If file doesn't exist, start with 1
    await writeFile(counterPath, JSON.stringify({ default: 1 }));
    return 1;
  }
}

export async function POST(request: Request) {
  try {
    // Get the wallet address from the request headers or form data
    let ownerWallet = getWalletAddressFromRequest(request);
    
    if (!ownerWallet) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    
    // Normalize the wallet address
    ownerWallet = ownerWallet.toLowerCase();
    
    // Check if the user has a profile and get the identity ID
    const supabase = getSupabaseClient(true);
    let identityId = null;
    
    if (!supabase) {
      console.error('Failed to get Supabase client');
      // Continue with a dummy identity ID
      identityId = `dummy-id-${Date.now()}`;
    } else {
      try {
        // Check if the identity_registry table exists and get the identity ID
        const { data: identity, error } = await supabase
          .from('identity_registry')
          .select('id')
          .eq('normalized_wallet', ownerWallet)
          .maybeSingle();
        
        if (error) {
          if (error.code === '42P01') {
            console.log('identity_registry table does not exist, using dummy identity ID');
            identityId = `dummy-id-${Date.now()}`;
          } else {
            console.error('Error checking if user has profile:', error);
            identityId = `error-dummy-id-${Date.now()}`;
          }
        } else if (!identity) {
          // No profile found, return error
          return NextResponse.json(
            {
              error: "You need to create a profile before minting a vehicle",
              code: "PROFILE_REQUIRED"
            },
            { status: 403 }
          );
        } else {
          // Profile found, use the identity ID
          identityId = identity.id;
          console.log(`Found identity ID ${identityId} for wallet ${ownerWallet}`);
        }
      } catch (error) {
        console.error('Exception checking if user has profile:', error);
        identityId = `exception-dummy-id-${Date.now()}`;
      }
    }
    
    const formData = await request.formData();
    const vin = formData.get("vin") as string;
    const name = formData.get("name") as string;
    const make = formData.get("make") as string;
    const model = formData.get("model") as string;
    const year = formData.get("year") as string;
    const image = formData.get("image") as File;

    if (!vin || !name || !make || !model || !year || !image) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get next token ID
    const tokenId = await getNextTokenId();

    // Create metadata directory if it doesn't exist
    const metadataDir = join(process.cwd(), "public", "metadata");
    await mkdir(metadataDir, { recursive: true });

    // Define image paths
    const imageUrlPath = `/metadata/${tokenId}.jpg`;
    
    const metadata = {
      tokenId,
      vin,
      name,
      make,
      model,
      year,
      image: imageUrlPath,
    };

    // Save metadata JSON
    const metadataPath = join(metadataDir, `${tokenId}.json`);
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // Save image
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const imageFilePath = join(metadataDir, `${tokenId}.jpg`);
    await writeFile(imageFilePath, imageBuffer);

    // Skip identity registry registration
    console.log(`Skipping identity registry registration for wallet ${ownerWallet}`);

    // Prepare the vehicle data for the client to use during confirmation
    const vehicleData = {
      vin,
      name,
      make,
      model,
      year,
      // Convert image to base64 for the client to store temporarily
      imageData: image ? await convertImageToBase64(image) : null
    };

    // Return the token ID, metadata URI, and identity ID for the client to use for minting
    return NextResponse.json({
      tokenId,
      metadataURI: `/metadata/${tokenId}.json`,
      vehicleData,
      identityId
    });
  } catch (error) {
    console.error("Error in mint API:", error);
    return NextResponse.json(
      { error: "Failed to process mint request" },
      { status: 500 }
    );
  }
}

// Helper function to convert an image file to base64 in Node.js environment
async function convertImageToBase64(file: File): Promise<string> {
  try {
    // Get the buffer from the file
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Convert buffer to base64
    const base64String = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    return base64String;
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw error;
  }
}