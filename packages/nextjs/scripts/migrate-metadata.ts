const fs = require('fs');
const path = require('path');

const metadataDir = path.join(process.cwd(), 'public', 'metadata');

// Read all JSON files in the metadata directory
const files: string[] = fs.readdirSync(metadataDir).filter((file: string) => file.endsWith('.json'));

// Assign token IDs starting from 1
files.forEach((file: string, index: number) => {
  const tokenId = index + 1;
  const filePath = path.join(metadataDir, file);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Add tokenId to metadata
  const newContent = {
    ...content,
    tokenId,
    image: `/metadata/${tokenId}.jpg`
  };
  
  // Save new metadata file
  const newFilePath = path.join(metadataDir, `${tokenId}.json`);
  fs.writeFileSync(newFilePath, JSON.stringify(newContent, null, 2));
  
  // Rename image file
  const oldImagePath = path.join(metadataDir, content.image.split('/').pop() || '');
  const newImagePath = path.join(metadataDir, `${tokenId}.jpg`);
  if (fs.existsSync(oldImagePath)) {
    fs.renameSync(oldImagePath, newImagePath);
  }
  
  // Remove old metadata file
  fs.unlinkSync(filePath);
});

console.log('Migration completed successfully!'); 