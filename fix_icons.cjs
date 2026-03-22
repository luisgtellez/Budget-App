const sharp = require('sharp');
const fs = require('fs');

async function fixIcons() {
  try {
    console.log('Reading logo-final.png...');
    
    // Create exact 180x180 for Apple
    await sharp('./public/logo-final.png')
      .resize(180, 180)
      .toFile('./public/apple-touch-icon.png');
      
    // Also create a precomposed version just in case (older iOS fallback)
    await sharp('./public/logo-final.png')
      .resize(180, 180)
      .toFile('./public/apple-touch-icon-precomposed.png');

    console.log('Successfully created exact Apple icons.');
  } catch (e) {
    console.error('Error generating icons:', e);
  }
}

fixIcons();
