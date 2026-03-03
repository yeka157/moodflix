"use client";

import {
  Component,
  useRef,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import type { ShowcasePoster } from "@/lib/tmdb";

const MovieShowcase3D = dynamic(
  () =>
    import("@/components/landing/movie-showcase-3d").then(
      (mod) => mod.MovieShowcase3D,
    ),
  { ssr: false },
);

interface MovieShowcaseProps {
  posters: ShowcasePoster[];
}

function detectWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function PosterCard({ title, posterUrl }: ShowcasePoster) {
  return (
    <div className="flex-shrink-0 w-40 hover:scale-105 transition-transform duration-300 cursor-default">
      <div className="relative w-40 aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="160px"
          className="object-cover"
          unoptimized
        />
      </div>
    </div>
  );
}

function MarqueeFallback({ posters }: { posters: ShowcasePoster[] }) {
  const row1 = [...posters, ...posters];
  const row2 = [...posters, ...posters];

  return (
    <div className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 mb-12">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Trending Now
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From classics to the latest releases, explore an ever-growing
            collection of films and series.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background via-background/60 to-transparent z-10 pointer-events-none" />

        <div className="mb-6 overflow-hidden">
          <div className="flex gap-6 motion-safe:[animation:marquee-left_40s_linear_infinite] motion-reduce:[animation-play-state:paused]">
            {row1.map((poster, index) => (
              <PosterCard key={`row1-${index}`} {...poster} />
            ))}
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="flex gap-6 motion-safe:[animation:marquee-right_40s_linear_infinite] motion-reduce:[animation-play-state:paused]">
            {row2.map((poster, index) => (
              <PosterCard key={`row2-${index}`} {...poster} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Cache WebGL detection result — won't change during the session
let webGLResult: boolean | undefined;
function getWebGLSnapshot() {
  if (webGLResult === undefined) webGLResult = detectWebGL();
  return webGLResult;
}
function getWebGLServerSnapshot() {
  return false;
}
const subscribe = () => () => {};

function useHasWebGL() {
  return useSyncExternalStore(subscribe, getWebGLSnapshot, getWebGLServerSnapshot);
}

class Canvas3DErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function MovieShowcase({ posters }: MovieShowcaseProps) {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const hasWebGL = useHasWebGL();

  if (posters.length === 0) return null;

  // Still detecting capabilities — show marquee as safe default
  if (hasWebGL === null) {
    return <MarqueeFallback posters={posters} />;
  }

  // Fallback: mobile, no WebGL, or reduced motion → CSS marquee
  if (isMobile || !hasWebGL || shouldReduceMotion) {
    return <MarqueeFallback posters={posters} />;
  }

  return (
    <Canvas3DErrorBoundary fallback={<MarqueeFallback posters={posters} />}>
      <Showcase3DWrapper posters={posters} />
    </Canvas3DErrorBoundary>
  );
}

function Showcase3DWrapper({ posters }: { posters: ShowcasePoster[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Bridge Framer Motion → Three.js via shared ref (no re-renders)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgressRef.current = v;
  });

  // Heading: hold visible longer, then gracefully fade
  const headingOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2],
    [1, 1, 0],
  );
  const headingY = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2],
    [0, 0, -40],
  );

  return (
    <section ref={sectionRef} className="relative h-[500vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Heading overlay */}
        <motion.div
          className="absolute inset-x-0 top-0 z-10 pt-24 px-4 text-center pointer-events-none"
          style={{ opacity: headingOpacity, y: headingY }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Trending Now
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From classics to the latest releases, explore an ever-growing
            collection of films and series.
          </p>
        </motion.div>

        {/* 3D Canvas */}
        <MovieShowcase3D
          posters={posters}
          scrollProgressRef={scrollProgressRef}
        />

        {/* Bottom gradient fade to next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </div>
    </section>
  );
}
