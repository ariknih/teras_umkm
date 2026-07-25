const fs = require('fs');
const path = require('path');

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 550" width="500" height="550">
  <defs>
    <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8DC63F" />
      <stop offset="100%" stop-color="#76BC21" />
    </linearGradient>
    <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFD100" />
      <stop offset="100%" stop-color="#F5A623" />
    </linearGradient>
  </defs>

  <!-- Outer Pin Body -->
  <path d="M 250 15 
           C 130 15, 40 105, 40 225 
           C 40 350, 250 535, 250 535 
           C 250 535, 460 350, 460 225 
           C 460 105, 370 15, 250 15 Z" 
        fill="url(#pinGrad)" />

  <!-- Inner Dark Green Circular Disc -->
  <circle cx="250" cy="205" r="145" fill="#044E29" />

  <!-- Smile Curve -->
  <path d="M 165 228 A 85 85 0 0 0 335 228" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="26" 
        stroke-linecap="round" />

  <!-- Canopy / Shop Awning -->
  <g>
    <!-- Background Arch White Base -->
    <path d="M 125 180 C 135 130, 180 120, 250 120 C 320 120, 365 130, 375 180 L 375 188 
             Q 350 210, 325 188 
             Q 300 210, 275 188 
             Q 250 210, 225 188 
             Q 200 210, 175 188 
             Q 150 210, 125 188 Z" fill="#FFFFFF" />

    <!-- Yellow Stripe 1 (Second segment from left) -->
    <path d="M 175 188 
             C 173 150, 195 130, 225 122 
             L 225 188 
             Q 200 210, 175 188 Z" fill="url(#yellowGrad)" />

    <!-- Yellow Stripe 2 (Fourth segment from left) -->
    <path d="M 325 188 
             C 327 150, 305 130, 275 122 
             L 275 188 
             Q 300 210, 325 188 Z" fill="url(#yellowGrad)" />
  </g>
</svg>`;

const logoPlusTextSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 250" width="900" height="250">
  <defs>
    <linearGradient id="pinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#8DC63F" />
      <stop offset="100%" stop-color="#76BC21" />
    </linearGradient>
    <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFD100" />
      <stop offset="100%" stop-color="#F5A623" />
    </linearGradient>
  </defs>

  <!-- Pin Icon Group -->
  <g transform="translate(10, -5) scale(0.42)">
    <path d="M 250 15 C 130 15, 40 105, 40 225 C 40 350, 250 535, 250 535 C 250 535, 460 350, 460 225 C 460 105, 370 15, 250 15 Z" fill="url(#pinGrad)" />
    <circle cx="250" cy="205" r="145" fill="#044E29" />
    <path d="M 165 228 A 85 85 0 0 0 335 228" fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" />
    <path d="M 125 180 C 135 130, 180 120, 250 120 C 320 120, 365 130, 375 180 L 375 188 Q 350 210, 325 188 Q 300 210, 275 188 Q 250 210, 225 188 Q 200 210, 175 188 Q 150 210, 125 188 Z" fill="#FFFFFF" />
    <path d="M 175 188 C 173 150, 195 130, 225 122 L 225 188 Q 200 210, 175 188 Z" fill="url(#yellowGrad)" />
    <path d="M 325 188 C 327 150, 305 130, 275 122 L 275 188 Q 300 210, 325 188 Z" fill="url(#yellowGrad)" />
  </g>

  <!-- Typography: Saloka.id -->
  <text x="240" y="155" font-family="Poppins, Montserrat, system-ui, sans-serif" font-weight="800" font-size="110" fill="#111111" letter-spacing="-2">Saloka<tspan fill="#F5A623">.id</tspan></text>
</svg>`;

async function main() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Write SVGs
  fs.writeFileSync(path.join(imagesDir, 'logosaloka.svg'), logoSvg);
  fs.writeFileSync(path.join(imagesDir, 'logo+nama_saloka.svg'), logoPlusTextSvg);

  const sharp = require('sharp');

  // Convert logosaloka.png & .webp
  await sharp(Buffer.from(logoSvg))
    .resize(512, 550, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logosaloka.png'));

  await sharp(Buffer.from(logoSvg))
    .resize(512, 550, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95 })
    .toFile(path.join(imagesDir, 'logosaloka.webp'));

  // Convert logo+nama_saloka.png & .webp
  await sharp(Buffer.from(logoPlusTextSvg))
    .resize(900, 250, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(imagesDir, 'logo+nama_saloka.png'));

  await sharp(Buffer.from(logoPlusTextSvg))
    .resize(900, 250, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 95 })
    .toFile(path.join(imagesDir, 'logo+nama_saloka.webp'));

  console.log('SUCCESS: All Saloka logo assets generated with zero distortion!');
}

main().catch(err => {
  console.error('Error generating logos:', err);
  process.exit(1);
});
