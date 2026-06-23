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
import { loadFont as loadAnton } from "@remotion/google-fonts/Anton";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: ANTON } = loadAnton();
const { fontFamily: INTER } = loadInter();

// ——— Sistema de marca TRINCA RV21 ———
const GOLD = "#E7B84B";
const GOLD_SOFT = "#F4D27A";
const INK = "#08080A";
const WHITE = "#FFFFFF";

export interface Word {
  text: string;
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

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 75% at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.32) 78%, rgba(0,0,0,0.7) 100%)",
      pointerEvents: "none",
    }}
  />
);

const BottomScrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.82) 100%)",
      pointerEvents: "none",
    }}
  />
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
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 40,
          right: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: intro,
          transform: `translateY(${(1 - intro) * -12}px)`,
        }}
      >
        <div style={{ fontFamily: ANTON, fontSize: 30, letterSpacing: 2, color: WHITE }}>
          TRINCA <span style={{ color: GOLD }}>RV21</span>
        </div>
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 700,
            fontSize: 19,
            letterSpacing: 1.5,
            color: INK,
            background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`,
            padding: "6px 14px",
            borderRadius: 100,
          }}
        >
          DIA 1 / 21
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Gancho de abertura (punch line desenhada) — só nos primeiros segundos
const OpeningHook: React.FC<{ gancho: string }> = ({ gancho }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const words = gancho.trim().split(/\s+/);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const kicker = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 12 });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "flex-start", padding: "0 56px", opacity: out }}>
      <div
        style={{
          fontFamily: INTER, fontWeight: 800, fontSize: 22, letterSpacing: 4, color: GOLD,
          textTransform: "uppercase", marginBottom: 16, opacity: kicker,
          transform: `translateY(${(1 - kicker) * 14}px)`, textShadow: "0 2px 10px rgba(0,0,0,0.85)",
        }}
      >
        A verdade que ninguém te contou
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px" }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * 2.2, fps, config: { damping: 18, mass: 0.5 }, durationInFrames: 14 });
          return (
            <span key={i} style={{
              fontFamily: ANTON, fontSize: 88, lineHeight: 1.0, color: WHITE, opacity: s,
              transform: `translateY(${(1 - s) * 40}px)`, textShadow: "0 4px 18px rgba(0,0,0,0.95)", display: "inline-block",
            }}>{w}</span>
          );
        })}
      </div>
      <div style={{ marginTop: 20, height: 8, width: 200, background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`, borderRadius: 100 }} />
    </AbsoluteFill>
  );
};

// Legenda KARAOKÊ sincronizada (estilo TikTok): palavra ativa em dourado
const KaraokeCaptions: React.FC<{ captions: Word[] }> = ({ captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = (frame / fps) * 1000;

  // agrupa em "páginas" de até 3 palavras
  const PER = 3;
  const pages: { words: Word[]; startMs: number; endMs: number }[] = [];
  for (let i = 0; i < captions.length; i += PER) {
    const slice = captions.slice(i, i + PER);
    if (slice.length) pages.push({ words: slice, startMs: slice[0].startMs, endMs: slice[slice.length - 1].endMs });
  }
  // estende o fim de cada página até o início da próxima (evita flicker)
  for (let i = 0; i < pages.length - 1; i++) pages[i].endMs = Math.max(pages[i].endMs, pages[i + 1].startMs - 1);

  const page = pages.find((p) => nowMs >= p.startMs && nowMs <= p.endMs);
  if (!page) return null;

  const since = (nowMs - page.startMs) / 1000;
  const pop = spring({ frame: since * fps, fps, config: { damping: 200 }, durationInFrames: 8 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", padding: "0 70px 430px" }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "2px 18px",
          opacity: pop, transform: `translateY(${(1 - pop) * 20}px) scale(${0.96 + pop * 0.04})`,
        }}
      >
        {page.words.map((w, i) => {
          const active = nowMs >= w.startMs && nowMs <= w.endMs + 60;
          return (
            <span key={i} style={{
              fontFamily: ANTON, fontSize: 74, lineHeight: 1.05, letterSpacing: 0.5,
              color: active ? GOLD : WHITE, textTransform: "uppercase",
              transform: active ? "scale(1.06)" : "scale(1)",
              textShadow: "0 4px 16px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)",
              transition: "none", display: "inline-block",
            }}>{w.text.trim()}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// End card branded — SEM URL crua (CTA = micro-compromisso "COMENTA EU QUERO")
const EndCard: React.FC<{ gatilho: string; cta: string }> = ({ gatilho, cta }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 14], [0, 0.93], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.6 }, durationInFrames: 22 });
  const chip = spring({ frame: frame - 22, fps, config: { damping: 12, mass: 0.5 }, durationInFrames: 20 });
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: INK, opacity: fade }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px", textAlign: "center" }}>
        <div style={{ transform: `scale(${0.92 + pop * 0.08})`, opacity: pop }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>
            Vagas limitadas · 1ª turma
          </div>
          <div style={{ fontFamily: ANTON, fontSize: 100, lineHeight: 0.96, color: WHITE, textTransform: "uppercase" }}>
            {gatilho}
          </div>
        </div>
        <div
          style={{
            marginTop: 46, opacity: chip, transform: `translateY(${(1 - chip) * 22}px) scale(${0.9 + chip * 0.1})`,
            fontFamily: ANTON, fontSize: 46, letterSpacing: 1, color: INK,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})`, padding: "20px 46px", borderRadius: 18,
            textTransform: "uppercase",
          }}
        >
          {cta}
        </div>
        <div style={{ marginTop: 30, opacity: chip, fontFamily: ANTON, fontSize: 26, letterSpacing: 3, color: "rgba(255,255,255,0.5)" }}>
          TRINCA <span style={{ color: GOLD }}>RV21</span> · DIA 1 DE 21
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<ReelProps> = ({ videoSrc, gancho, gatilho, cta = "Comenta EU QUERO 👇", captions = [], audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hookDur = Math.round(fps * 2.8);
  const endDur = Math.round(fps * 3.6);
  const endStart = durationInFrames - endDur;
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Video src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {audioSrc && <Audio src={audioSrc} volume={0.15} />}

      <Vignette />
      <BottomScrim />
      <TopBar />

      {/* Gancho de abertura */}
      <Sequence from={4} durationInFrames={hookDur}>
        <OpeningHook gancho={gancho} />
      </Sequence>

      {/* Legenda karaokê sincronizada (depois do gancho, até o end card) */}
      {captions.length > 0 ? (
        <Sequence from={hookDur} durationInFrames={Math.max(1, endStart - hookDur)}>
          <KaraokeCaptions captions={captions} />
        </Sequence>
      ) : null}

      {/* End card */}
      <Sequence from={endStart} durationInFrames={endDur}>
        <EndCard gatilho={gatilho} cta={cta} />
      </Sequence>
    </AbsoluteFill>
  );
};
