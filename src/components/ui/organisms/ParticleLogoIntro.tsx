"use client";

import { useEffect, useRef, useState } from "react";

type Particle = {
  x: number; // 현재 위치
  y: number; // 현재 위치
  vx: number; // 점의 이동속도
  vy: number; // 점의 이동속도
  tx: number; // 점의 도착위치
  ty: number; // 점의 도착위치
  radius: number; // 점의 크기
  color: string; // 점색상
  delay: number; // 출발 타이밍 부여
};

const LOGO_SRC = "/dpc_icon.png";
// 로고 모이는 시간
const GATHER_DURATION = 2000;
// 유지 시간
const HOLD_DURATION = 400;
// 사라지는 시간
const FADE_DURATION = 300;
const TOTAL_DURATION = GATHER_DURATION + HOLD_DURATION + FADE_DURATION;
// 파티클 개수
const TARGET_PARTICLE_COUNT = 2600;
const BACKGROUND = "#0e0e0e";
const POINT = "#ff4128";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// 모이는 애니메이션
function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

// 랜덤위치 생성
// edge === 0 화면 위쪽 바깥.
// edge === 1 화면 오른쪽 바깥.
// edge === 2 화면 아래쪽 바깥.
// edge === 3 화면 왼쪽 바깥.
function randomEdgePosition(width: number, height: number) {
  const edge = Math.floor(Math.random() * 4);

  if (edge === 0) return { x: Math.random() * width, y: -40 - Math.random() * height * 0.25 };
  if (edge === 1) return { x: width + 40 + Math.random() * width * 0.25, y: Math.random() * height };
  if (edge === 2) return { x: Math.random() * width, y: height + 40 + Math.random() * height * 0.25 };

  return { x: -40 - Math.random() * width * 0.25, y: Math.random() * height };
}

// 로고 이미지 불러오기
async function loadLogoImage() {
  const image = new Image();
  image.src = LOGO_SRC;
  image.decoding = "async";
  await image.decode();
  return image;
}

// 로고 이미지를 분석하여 파티클 배열 생성
function buildParticles(image: HTMLImageElement, width: number, height: number) {
  // 로고 크기 계산
  const logoMaxWidth = Math.min(width * 0.55, 420);
  const logoMaxHeight = Math.min(height * 0.36, 420);
  const logoScale = Math.min(logoMaxWidth / image.naturalWidth, logoMaxHeight / image.naturalHeight);
  const logoWidth = Math.max(1, Math.floor(image.naturalWidth * logoScale));
  const logoHeight = Math.max(1, Math.floor(image.naturalHeight * logoScale));

  // 임시 canvas 생성
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = logoWidth;
  sampleCanvas.height = logoHeight;

  const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleContext) return [];

  // canvas 초기화
  sampleContext.clearRect(0, 0, logoWidth, logoHeight);
  // 로고 이미지 그리기
  sampleContext.drawImage(image, 0, 0, logoWidth, logoHeight);

  // 이미지 픽셀 가져오기
  const imageData = sampleContext.getImageData(0, 0, logoWidth, logoHeight);
  // 전체 픽셀 수 계산 (imageData.data는 rgba 순서로 구성)
  const totalPixels = Math.max(1, Math.floor(imageData.data.length / 4));
  // 픽셀 간격 설정(성능이슈로 몇개 건너뜀)
  const sampleStep = Math.max(2, Math.floor(Math.sqrt(totalPixels / TARGET_PARTICLE_COUNT)));
  // 로고를 중간에 그리기
  const offsetX = width / 2 - logoWidth / 2;
  const offsetY = height / 2 - logoHeight / 2;
  const particles: Particle[] = [];

  // 로고 픽셀을 순회하며 파티클 생성
  for (let y = 0; y < logoHeight; y += sampleStep) {
    for (let x = 0; x < logoWidth; x += sampleStep) {
      const index = (y * logoWidth + x) * 4;
      const alpha = imageData.data[index + 3];

      if (alpha < 80) continue;

      const start = randomEdgePosition(width, height);
      const isPointParticle = Math.random() < 0.12;
      const opacity = isPointParticle ? 0.9 : 0.48 + Math.random() * 0.34;

      particles.push({
        x: start.x,
        y: start.y,
        vx: 0,
        vy: 0,
        tx: offsetX + x + (Math.random() - 0.5) * sampleStep * 0.45,
        ty: offsetY + y + (Math.random() - 0.5) * sampleStep * 0.45,
        radius: Math.max(1, sampleStep * (0.34 + Math.random() * 0.24)),
        color: isPointParticle ? POINT : `rgba(255,255,255,${opacity.toFixed(2)})`,
        delay: Math.random() * 0.22,
      });
    }
  }

  return particles;
}

export default function ParticleLogoIntro() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let disposed = false;
    let startedAt = 0;
    let removeResizeListener: (() => void) | null = null;

    const resizeCanvas = async (image: HTMLImageElement) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particlesRef.current = buildParticles(image, width, height);
    };

    const finish = () => {
      setIsLeaving(true);
      window.setTimeout(() => {
        if (!disposed) setIsVisible(false);
      }, FADE_DURATION);
    };

    loadLogoImage()
      .then(async (image) => {
        if (disposed) return;

        await resizeCanvas(image);
        startedAt = performance.now();

        const handleResize = () => {
          void resizeCanvas(image);
        };

        window.addEventListener("resize", handleResize);
        removeResizeListener = () => window.removeEventListener("resize", handleResize);

        const render = (now: number) => {
          if (disposed) return;

          const elapsed = now - startedAt;
          const width = window.innerWidth;
          const height = window.innerHeight;
          const gatherProgress = clamp(elapsed / GATHER_DURATION, 0, 1);
          const easedProgress = easeOutCubic(gatherProgress);
          const fadeProgress =
            elapsed <= GATHER_DURATION + HOLD_DURATION
              ? 0
              : clamp((elapsed - GATHER_DURATION - HOLD_DURATION) / FADE_DURATION, 0, 1);

          context.clearRect(0, 0, width, height);
          context.globalAlpha = 1 - fadeProgress;
          context.fillStyle = BACKGROUND;
          context.fillRect(0, 0, width, height);
          context.globalCompositeOperation = "lighter";

          for (const particle of particlesRef.current) {
            const localProgress = clamp((easedProgress - particle.delay) / (1 - particle.delay), 0, 1);
            const spring = 0.035 + localProgress * 0.105;
            const damping = 0.76 + localProgress * 0.12;
            const drift = (1 - localProgress) * 0.9;

            particle.vx = (particle.vx + (particle.tx - particle.x) * spring) * damping;
            particle.vy = (particle.vy + (particle.ty - particle.y) * spring) * damping;
            particle.x += particle.vx + Math.sin(now * 0.0016 + particle.tx * 0.018) * drift;
            particle.y += particle.vy + Math.cos(now * 0.0014 + particle.ty * 0.018) * drift;

            context.beginPath();
            context.fillStyle = particle.color;
            context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            context.fill();
          }

          context.globalCompositeOperation = "source-over";
          context.globalAlpha = 1;

          if (elapsed >= TOTAL_DURATION) {
            finish();
            return;
          }

          animationRef.current = requestAnimationFrame(render);
        };

        animationRef.current = requestAnimationFrame(render);
      })
      .catch(() => {
        finish();
      });

    return () => {
      disposed = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      removeResizeListener?.();
    };
  }, []);

  const skip = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsLeaving(true);
    window.setTimeout(() => setIsVisible(false), FADE_DURATION);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#0e0e0e] transition-opacity duration-500 ${
        isLeaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-label="dustpeakclub intro animation"
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <button
        type="button"
        onClick={skip}
        className="font-paperlogy absolute right-4 top-4 rounded border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white/75 backdrop-blur transition hover:border-point/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-point"
      >
        skip
      </button>
    </div>
  );
}
