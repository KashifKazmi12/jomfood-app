/**
 * Generate App Icons Script
 * 
 * Generates all required icon sizes for Android and iOS from a source image.
 * 
 * Usage: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '../src/assets/images/favicon.png');
const OUTPUT_DIR = path.join(__dirname, '../generated-icons');

// Android icon sizes (for mipmap folders)
const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// iOS icon sizes (base size, scale determines final size)
const IOS_SIZES = [
  { size: 20, scale: 2, filename: 'icon-20@2x.png' }, // 40x40
  { size: 20, scale: 3, filename: 'icon-20@3x.png' }, // 60x60
  { size: 29, scale: 2, filename: 'icon-29@2x.png' }, // 58x58
  { size: 29, scale: 3, filename: 'icon-29@3x.png' }, // 87x87
  { size: 40, scale: 2, filename: 'icon-40@2x.png' }, // 80x80
  { size: 40, scale: 3, filename: 'icon-40@3x.png' }, // 120x120
  { size: 60, scale: 2, filename: 'icon-60@2x.png' }, // 120x120
  { size: 60, scale: 3, filename: 'icon-60@3x.png' }, // 180x180
  { size: 1024, scale: 1, filename: 'icon-1024.png' }, // 1024x1024 (marketing)
];

async function generateIcons() {
  console.log('🎨 Generating app icons from:', SOURCE_IMAGE);
  
  // Check if source image exists
  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('❌ Source image not found:', SOURCE_IMAGE);
    process.exit(1);
  }

  // Create output directories
  const androidDir = path.join(OUTPUT_DIR, 'android');
  const iosDir = path.join(OUTPUT_DIR, 'ios');

  // Create Android directories
  Object.keys(ANDROID_SIZES).forEach(folder => {
    const dir = path.join(androidDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create iOS directory
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }

  console.log('\n📱 Generating Android icons...');
  // Generate Android icons
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const outputPath = path.join(androidDir, folder, 'ic_launcher.png');
    const outputPathRound = path.join(androidDir, folder, 'ic_launcher_round.png');
    
    // Generate square icon
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✓ Generated ${folder}/ic_launcher.png (${size}x${size})`);
    
    // Generate round icon (same as square for now - Android will apply round mask)
    await sharp(SOURCE_IMAGE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPathRound);
    
    console.log(`  ✓ Generated ${folder}/ic_launcher_round.png (${size}x${size})`);
  }

  console.log('\n🍎 Generating iOS icons...');
  // Generate iOS icons
  for (const { size, scale, filename } of IOS_SIZES) {
    const finalSize = size * scale;
    const outputPath = path.join(iosDir, filename);
    
    await sharp(SOURCE_IMAGE)
      .resize(finalSize, finalSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`  ✓ Generated ${filename} (${finalSize}x${finalSize})`);
  }

  console.log('\n📋 Copying icons to app directories...');
  
  // Copy Android icons
  const androidResDir = path.join(__dirname, '../android/app/src/main/res');
  for (const folder of Object.keys(ANDROID_SIZES)) {
    const sourceDir = path.join(androidDir, folder);
    const targetDir = path.join(androidResDir, folder);
    
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Copy ic_launcher.png
    const sourceIcon = path.join(sourceDir, 'ic_launcher.png');
    const targetIcon = path.join(targetDir, 'ic_launcher.png');
    fs.copyFileSync(sourceIcon, targetIcon);
    
    // Copy ic_launcher_round.png
    const sourceIconRound = path.join(sourceDir, 'ic_launcher_round.png');
    const targetIconRound = path.join(targetDir, 'ic_launcher_round.png');
    fs.copyFileSync(sourceIconRound, targetIconRound);
    
    console.log(`  ✓ Copied ${folder}/ icons to android/app/src/main/res/`);
  }
  
  // Copy iOS icons
  const iosIconDir = path.join(__dirname, '../ios/jomfood/Images.xcassets/AppIcon.appiconset');
  for (const { filename } of IOS_SIZES) {
    const sourceIcon = path.join(iosDir, filename);
    const targetIcon = path.join(iosIconDir, filename);
    fs.copyFileSync(sourceIcon, targetIcon);
    console.log(`  ✓ Copied ${filename} to iOS AppIcon.appiconset/`);
  }
  
  console.log('\n✅ All icons generated and copied successfully!');
  console.log('\n📋 Next step: Rebuild your app');
  console.log('   Android: cd android && ./gradlew assembleRelease');
  console.log('   Or: npx react-native run-android --variant=release');
}

// Run the script
generateIcons().catch(error => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});

