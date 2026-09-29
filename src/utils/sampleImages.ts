/**
 * Preset sample images generated via high-resolution canvas drawings
 * so the application has zero external network dependencies for demo testing.
 */

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  generateBlob: () => Promise<Blob>;
  thumbnailUrl: string;
}

function createSampleBlob(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  drawFn(ctx, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create sample blob'));
    }, 'image/png');
  });
}

// 1. Modern Sneaker / Product
const sneakerDataUrl = () => {
  const c = document.createElement('canvas');
  c.width = 800;
  c.height = 600;
  const ctx = c.getContext('2d')!;
  
  // Background studio gradient (light grey)
  const bg = ctx.createLinearGradient(0, 0, 0, 600);
  bg.addColorStop(0, '#f1f5f9');
  bg.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 600);

  // Soft studio shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(400, 480, 260, 40, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100, 116, 139, 0.35)';
  ctx.filter = 'blur(15px)';
  ctx.fill();
  ctx.restore();

  // Sneaker body
  ctx.save();
  ctx.translate(150, 180);

  // Sole
  ctx.beginPath();
  ctx.moveTo(30, 260);
  ctx.bezierCurveTo(80, 280, 380, 280, 480, 250);
  ctx.bezierCurveTo(490, 230, 460, 210, 420, 210);
  ctx.bezierCurveTo(340, 220, 100, 220, 40, 230);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Upper sneaker
  ctx.beginPath();
  ctx.moveTo(40, 230);
  ctx.bezierCurveTo(60, 160, 140, 80, 220, 80);
  ctx.bezierCurveTo(270, 80, 310, 140, 360, 150);
  ctx.bezierCurveTo(420, 160, 480, 220, 470, 250);
  ctx.bezierCurveTo(380, 260, 100, 260, 40, 230);
  ctx.closePath();
  
  const shoeGrad = ctx.createLinearGradient(50, 80, 450, 250);
  shoeGrad.addColorStop(0, '#4f46e5');
  shoeGrad.addColorStop(0.5, '#06b6d4');
  shoeGrad.addColorStop(1, '#f43f5e');
  ctx.fillStyle = shoeGrad;
  ctx.fill();

  // Swoosh/Wave line
  ctx.beginPath();
  ctx.moveTo(120, 160);
  ctx.bezierCurveTo(200, 170, 300, 120, 390, 190);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Laces
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(190 + i * 22, 100 + i * 16);
    ctx.lineTo(230 + i * 22, 85 + i * 16);
    ctx.stroke();
  }

  ctx.restore();
  return c;
};

// 2. Portrait Silhouette
const portraitDataUrl = () => {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 700;
  const ctx = c.getContext('2d')!;

  // Warm studio background
  const bg = ctx.createRadialGradient(300, 350, 50, 300, 350, 400);
  bg.addColorStop(0, '#fef3c7');
  bg.addColorStop(1, '#f97316');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 700);

  // Head and shoulders
  ctx.save();
  ctx.translate(300, 350);

  // Shoulders & Shirt
  ctx.beginPath();
  ctx.moveTo(-180, 350);
  ctx.bezierCurveTo(-150, 180, -90, 160, -45, 140);
  ctx.lineTo(45, 140);
  ctx.bezierCurveTo(90, 160, 150, 180, 180, 350);
  ctx.closePath();
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Neck
  ctx.fillStyle = '#fbb6ce';
  ctx.fillRect(-35, 70, 70, 80);

  // Face oval
  ctx.beginPath();
  ctx.ellipse(0, 40, 65, 85, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fbcfe8';
  ctx.fill();

  // Hair
  ctx.beginPath();
  ctx.ellipse(0, 5, 80, 80, 0, Math.PI, Math.PI * 2);
  ctx.bezierCurveTo(80, 70, 85, 140, 75, 180);
  ctx.lineTo(60, 160);
  ctx.bezierCurveTo(65, 90, 60, 40, 0, 40);
  ctx.bezierCurveTo(-60, 40, -65, 90, -60, 160);
  ctx.lineTo(-75, 180);
  ctx.bezierCurveTo(-85, 140, -80, 70, -80, 5);
  ctx.fillStyle = '#312e81';
  ctx.fill();

  // Glasses
  ctx.strokeStyle = '#1e1b4b';
  ctx.lineWidth = 5;
  ctx.strokeRect(-50, 25, 38, 26);
  ctx.strokeRect(12, 25, 38, 26);
  ctx.beginPath();
  ctx.moveTo(-12, 38);
  ctx.lineTo(12, 38);
  ctx.stroke();

  ctx.restore();
  return c;
};

// 3. Cute Ceramic Mug / Object
const mugDataUrl = () => {
  const c = document.createElement('canvas');
  c.width = 600;
  c.height = 600;
  const ctx = c.getContext('2d')!;

  // Teal textured background
  const bg = ctx.createLinearGradient(0, 0, 600, 600);
  bg.addColorStop(0, '#0f766e');
  bg.addColorStop(1, '#115e59');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 600, 600);

  // Table
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 440, 600, 160);

  // Mug handle
  ctx.save();
  ctx.translate(300, 300);
  ctx.beginPath();
  ctx.ellipse(110, 20, 40, 60, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 24;
  ctx.stroke();

  // Mug cylinder
  ctx.beginPath();
  ctx.moveTo(-100, -80);
  ctx.lineTo(100, -80);
  ctx.bezierCurveTo(100, 100, 80, 140, 0, 140);
  ctx.bezierCurveTo(-80, 140, -100, 100, -100, -80);
  ctx.closePath();
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Coffee surface
  ctx.beginPath();
  ctx.ellipse(0, -80, 95, 25, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#451a03';
  ctx.fill();

  // Latte art heart
  ctx.beginPath();
  ctx.moveTo(0, -75);
  ctx.bezierCurveTo(-20, -95, -40, -80, 0, -65);
  ctx.bezierCurveTo(40, -80, 20, -95, 0, -75);
  ctx.fillStyle = '#fef3c7';
  ctx.fill();

  ctx.restore();
  return c;
};

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'sample-sneaker',
    name: 'Sneaker Product',
    category: 'E-Commerce',
    generateBlob: async () => {
      const c = sneakerDataUrl();
      return new Promise<Blob>((resolve) => c.toBlob((b) => resolve(b!), 'image/png'));
    },
    thumbnailUrl: '',
  },
  {
    id: 'sample-portrait',
    name: 'Studio Portrait',
    category: 'Avatar & Profile',
    generateBlob: async () => {
      const c = portraitDataUrl();
      return new Promise<Blob>((resolve) => c.toBlob((b) => resolve(b!), 'image/png'));
    },
    thumbnailUrl: '',
  },
  {
    id: 'sample-mug',
    name: 'Coffee Mug',
    category: 'Object Cutout',
    generateBlob: async () => {
      const c = mugDataUrl();
      return new Promise<Blob>((resolve) => c.toBlob((b) => resolve(b!), 'image/png'));
    },
    thumbnailUrl: '',
  },
];
