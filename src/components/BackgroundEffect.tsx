import React, { useEffect, useRef } from 'react';

export default function BackgroundEffect({ effectType = 'particles' }: { effectType?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initializer state mapping based on selected theme
    // 1. PARTICLES INIT
    const particlesCount = Math.min(60, Math.floor((width * height) / 25000));
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;
    }> = [];
    const colors = ['rgba(0, 240, 255, ', 'rgba(255, 0, 127, ', 'rgba(157, 78, 223, '];

    if (effectType === 'particles') {
      for (let i = 0; i < particlesCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.4,
          speedY: (Math.random() - 0.5) * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.5 + 0.2,
        });
      }
    }

    // 2. MATRIX RAIN INIT
    const katakana = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ☠⚡⚙★';
    const matrixAlphabet = katakana.split('');
    const fontSize = 14;
    const columns = Math.floor(width / fontSize) + 1;
    const rainDrops: number[] = [];
    for (let x = 0; x < columns; x++) {
      rainDrops[x] = Math.random() * -100; // staggered starts
    }

    // 3. STARS FIELD INIT
    const starsCount = 150;
    const stars: Array<{
      x: number;
      y: number;
      z: number;
      size: number;
      color: string;
    }> = [];
    for (let i = 0; i < starsCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        size: Math.random() * 1.5 + 0.5,
        color: Math.random() > 0.4 ? '#00f0ff' : '#9d4edf',
      });
    }

    // 4. FLOWING WAVES VARIABLES
    let waveOffset = 0;

    const animate = () => {
      // Background base clears
      if (effectType === 'matrix') {
        ctx.fillStyle = 'rgba(7, 7, 12, 0.1)'; // slightly heavier for cool trails
      } else if (effectType === 'stars') {
        ctx.fillStyle = 'rgba(7, 7, 12, 0.25)';
      } else {
        ctx.fillStyle = 'rgba(7, 7, 12, 0.2)';
      }
      ctx.fillRect(0, 0, width, height);

      // Rendering logic depending on selected parameters
      if (effectType === 'matrix') {
        ctx.fillStyle = '#00f0ff';
        ctx.font = fontSize + 'px monospace';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#00f0ff';

        for (let i = 0; i < rainDrops.length; i++) {
          const text = matrixAlphabet[Math.floor(Math.random() * matrixAlphabet.length)];
          ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

          if (rainDrops[i] * fontSize > height && Math.random() > 0.975) {
            rainDrops[i] = 0;
          }
          rainDrops[i]++;
        }
        ctx.shadowBlur = 0; // reset
      } 
      
      else if (effectType === 'stars') {
        const cx = width / 2;
        const cy = height / 2;

        ctx.shadowBlur = 5;
        stars.forEach((s) => {
          s.z -= 1.5; // star forward speed
          if (s.z <= 0) {
            s.z = width;
            s.x = (Math.random() - 0.5) * width * 2;
            s.y = (Math.random() - 0.5) * height * 2;
          }

          const k = 120.0 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          if (px >= 0 && px < width && py >= 0 && py < height) {
            const rad = s.size * (1 - s.z / width) * 2;
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.1, rad), 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.shadowColor = s.color;
            ctx.fill();
          }
        });
        ctx.shadowBlur = 0;
      } 
      
      else if (effectType === 'waves') {
        waveOffset += 0.015;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;

        // Draw multiple stacked wavy lines at the lower third
        const waveY = height * 0.7;
        const count = 3;

        for (let w = 0; w < count; w++) {
          ctx.beginPath();
          ctx.strokeStyle = w === 0 ? 'rgba(0, 240, 255, 0.15)' : w === 1 ? 'rgba(255, 0, 127, 0.1)' : 'rgba(157, 78, 223, 0.08)';
          
          for (let x = 0; x < width; x += 10) {
            const factor = (w + 1) * 0.005;
            const amp = 30 + w * 15;
            const y = waveY + Math.sin(x * factor + waveOffset) * amp + Math.cos(x * 0.002 - waveOffset * 0.5) * 10;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } 
      
      else {
        // DEFAULT: 'particles'
        // Draw grid
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.025)';
        ctx.lineWidth = 1;

        const gridSpacing = 60;
        for (let x = 0; x < width; x += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSpacing) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Draw particles
        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;

          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color + p.alpha + ')';
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color === colors[0] ? '#00f0ff' : p.color === colors[1] ? '#ff007f' : '#9d4edf';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effectType]);

  return (
    <canvas
      ref={canvasRef}
      id="bg-laser-canvas"
      className="fixed inset-0 -z-50 pointer-events-none block"
    />
  );
}
