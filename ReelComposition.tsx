import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";
import { useMemo } from "react";
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: ANTON } = loadAnton();
const { fontFamily: INTER } = loadInter();

const GOLD = "#E7B84B";
const GOLD_SOFT = "#F4D27A";
const INK = "#08080A";
const WHITE = "#FFFFFF";

export interface Word {
  text: string;
  startMs: number;
  endMs: number;
}
interface Page {
  words: Word[];
  startMs: number;
  endMs: number;
}

export interface ReelProps {
  videoSrc: string;
  gancho: string;
  gatilho: string;
  legenda: string;
  cta?: string;
  captions?: Word[];
  audioSrc?: string;
}

// Agrupa palavras em páginas de até 3 (quebra em pausas) — estilo legenda dinâmica
function buildPages(words: Word[]): Page[] {
  const pages: Page[] = [];
  let cur: Word[] = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const next = words[i + 1];
    const gap = next ? next.startMs - words[i].endMs : 99999;
    if (cur.length >= 3 || gap > 420 || !next) {
      pages.push({ words: cur, startMs: cur[0].startMs, endMs: cur[cur.length - 1].endMs });
      cur = [];
    }
  }
  for (let i = 0; i < pages.length - 1; i++) pages[i].endMs = Math.max(pages[i].endMs, pages[i + 1].startMs - 1);
  return pages;
}

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(120% 75% at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.3) 78%, rgba(0,0,0,0.7) 100%)", pointerEvents: "none" }} />
);
const BottomScrim: React.FC = () => (
  <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.8) 100%)", pointerEvents: "none" }} />
);

// Grão de filme (35mm) — turbulência animada, look cinematográfico premium
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay", pointerEvents: "none" }}>
      <svg width="1080" height="1920" style={{ width: "100%", height: "100%" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 73} stitchTiles="stitch" />
        </filter>
        <rect width="1080" height="1920" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// Color grade quente + glow dourado sutil (faz "saltar" do feed)
const WarmGrade: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(78% 58% at 50% 36%, rgba(231,184,75,0.10), rgba(0,0,0,0) 70%)", mixBlendMode: "soft-light", pointerEvents: "none" }} />
);

const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const intro = interpolate(frame, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 6, background: "rgba(255,255,255,0.12)" }}>
        <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})` }} />
      </div>
      <div style={{ position: "absolute", top: 34, left: 40, right: 40, display: "flex", alignItems: "center", justifyContent: "space-between", opacity: intro, transform: `translateY(${(1 - intro) * -12}px)` }}>
        <div style={{ fontFamily: ANTON, fontSize: 30, letterSpacing: 2, color: WHITE }}>TRINCA <span style={{ color: GOLD }}>RV21</span></div>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 19, letterSpacing: 1.5, color: INK, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`, padding: "6px 14px", borderRadius: 100 }}>DIA 1 / 21</div>
      </div>
    </AbsoluteFill>
  );
};

const OpeningHook: React.FC<{ gancho: string }> = ({ gancho }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = gancho.trim().split(/\s+/);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kicker = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 56px", opacity: out }}>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: GOLD, textTransform: "uppercase", marginBottom: 16, opacity: kicker, transform: `translateY(${(1 - kicker) * 14}px)`, textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>A verdade que ninguém te contou</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * 2.2, fps, config: { damping: 18, mass: 0.5 }, durationInFrames: 14 });
          return <span key={i} style={{ fontFamily: ANTON, fontSize: 88, lineHeight: 1.0, color: WHITE, opacity: s, transform: `translateY(${(1 - s) * 40}px)`, textShadow: "0 4px 18px rgba(0,0,0,0.95)", display: "inline-block" }}>{w}</span>;
        })}
      </div>
      <div style={{ marginTop: 20, height: 8, width: 200, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`, borderRadius: 100 }} />
    </AbsoluteFill>
  );
};

// Legenda KARAOKÊ — tempo ABSOLUTO (renderizada direto, sem Sequence → sem atraso)
const KaraokeCaptions: React.FC<{ pages: Page[]; hookMs: number; endMs: number }> = ({ pages, hookMs, endMs }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  if (nowMs < hookMs || nowMs > endMs) return null;
  const page = pages.find((p) => nowMs >= p.startMs && nowMs <= p.endMs);
  if (!page) return null;
  const since = nowMs - page.startMs;
  const pop = spring({ frame: (since / 1000) * fps, fps, config: { damping: 16, mass: 0.5 }, durationInFrames: 8 });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 64px 440px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 14px", opacity: pop, transform: `translateY(${(1 - pop) * 24}px) scale(${0.92 + pop * 0.08})` }}>
        {page.words.map((w, i) => {
          const active = nowMs >= w.startMs && nowMs <= w.endMs + 50;
          return (
            <span key={i} style={{
              fontFamily: ANTON, fontSize: 74, lineHeight: 1.0, letterSpacing: 0.5, textTransform: "uppercase",
              color: active ? INK : WHITE,
              background: active ? `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})` : "transparent",
              padding: active ? "4px 16px" : "4px 0", borderRadius: 14,
              transform: active ? "scale(1.07)" : "scale(1)",
              boxShadow: active ? "0 6px 20px rgba(0,0,0,0.45)" : "none",
              textShadow: active ? "none" : "0 4px 14px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
              display: "inline-block",
            }}>{w.text.trim()}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ gatilho: string; cta: string }> = ({ gatilho, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 14], [0, 0.93], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.6 }, durationInFrames: 22 });
  const chip = spring({ frame: frame - 22, fps, config: { damping: 12, mass: 0.5 }, durationInFrames: 20 });
  const pulse = 1 + Math.sin(frame / 7) * 0.02;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: INK, opacity: fade }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px", textAlign: "center" }}>
        <div style={{ transform: `scale(${0.92 + pop * 0.08})`, opacity: pop }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>Vagas limitadas · 1ª turma</div>
          <div style={{ fontFamily: ANTON, fontSize: 100, lineHeight: 0.96, color: WHITE, textTransform: "uppercase" }}>{gatilho}</div>
        </div>
        <div style={{ marginTop: 46, opacity: chip, transform: `translateY(${(1 - chip) * 22}px) scale(${chip * pulse})`, display: "flex", alignItems: "center", gap: 16, fontFamily: ANTON, fontSize: 46, letterSpacing: 1, color: INK, background: `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})`, padding: "20px 46px", borderRadius: 18, textTransform: "uppercase", boxShadow: "0 10px 36px rgba(231,184,75,0.4)" }}>
          {cta}
          <span style={{ display: "inline-block", width: 0, height: 0, borderLeft: "16px solid transparent", borderRight: "16px solid transparent", borderTop: `22px solid ${INK}` }} />
        </div>
        <div style={{ marginTop: 30, opacity: chip, fontFamily: ANTON, fontSize: 26, letterSpacing: 3, color: "rgba(255,255,255,0.5)" }}>TRINCA <span style={{ color: GOLD }}>RV21</span> · DIA 1 DE 21</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<ReelProps> = ({ videoSrc, gancho, gatilho, cta = "Comenta a segunda", captions = [], audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hookDur = Math.round(fps * 2.8);
  const endDur = Math.round(fps * 3.6);
  const endStart = durationInFrames - endDur;
  const msToFrame = (ms: number) => Math.round((ms / 1000) * fps);

  const pages = useMemo(() => (captions && captions.length ? buildPages(captions) : []), [captions]);

  // Punch-in: leve kick a cada troca de página de legenda
  const nowMs = (frame / fps) * 1000;
  let pageStartMs = 0;
  for (const p of pages) {
    if (p.startMs <= nowMs) pageStartMs = p.startMs;
    else break;
  }
  const sincePage = frame - msToFrame(pageStartMs);
  const inCaps = frame < endStart && frame > hookDur;
  const kick = interpolate(sincePage, [0, 7], [0.022, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const base = interpolate(frame, [0, durationInFrames], [1.0, 1.045], { extrapolateRight: "clamp" });
  const zoom = base + (inCaps ? kick : 0);
  // motion-blur leve no "snap" de cada legenda (cheio, sem multiplicar render)
  const blurKick = inCaps ? interpolate(sincePage, [0, 5], [2.4, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, filter: `contrast(1.09) saturate(1.16) brightness(1.02) blur(${blurKick}px)` }}>
        <Video src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {audioSrc && <Audio src={audioSrc} volume={0.15} />}

      <WarmGrade />
      <Vignette />
      <BottomScrim />
      <FilmGrain />
      <TopBar />

      <Sequence from={4} durationInFrames={hookDur}>
        <OpeningHook gancho={gancho} />
      </Sequence>

      {/* Legenda em tempo absoluto (direto, sem offset) */}
      {pages.length > 0 ? (
        <KaraokeCaptions pages={pages} hookMs={(hookDur / fps) * 1000} endMs={(endStart / fps) * 1000} />
      ) : null}

      <Sequence from={endStart} durationInFrames={endDur}>
        <EndCard gatilho={gatilho} cta={cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
