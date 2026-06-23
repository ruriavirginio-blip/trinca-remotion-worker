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

export interface ReelProps {
  videoSrc: string;
  gancho: string;
  gatilho: string;
  legenda: string;
  audioSrc?: string;
}

// Vinheta cinematográfica (escurece cantos, foco no centro)
const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 75% at 50% 42%, rgba(0,0,0,0) 38%, rgba(0,0,0,0.35) 78%, rgba(0,0,0,0.72) 100%)",
      pointerEvents: "none",
    }}
  />
);

// Scrim de baixo pra legibilidade do texto
const BottomScrim: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.85) 100%)",
      pointerEvents: "none",
    }}
  />
);

// Barra superior: marca + progresso DIA 1/21
const TopBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const intro = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* trilho de progresso no topo */}
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

// Gancho cinético: palavra por palavra, com mola + sublinhado dourado
const KineticHook: React.FC<{ gancho: string }> = ({ gancho }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = gancho.trim().split(/\s+/);

  const lineWidth = spring({ frame: frame - 14, fps, config: { damping: 200 }, durationInFrames: 18 });
  const kicker = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 14 });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: "0 56px 560px" }}>
      {/* kicker */}
      <div
        style={{
          fontFamily: INTER,
          fontWeight: 800,
          fontSize: 22,
          letterSpacing: 4,
          color: GOLD,
          textTransform: "uppercase",
          marginBottom: 18,
          opacity: kicker,
          transform: `translateY(${(1 - kicker) * 14}px)`,
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
        }}
      >
        A verdade que ninguém te contou
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
        {words.map((w, i) => {
          const start = i * 2.5;
          const s = spring({ frame: frame - start, fps, config: { damping: 18, mass: 0.5 }, durationInFrames: 16 });
          return (
            <span
              key={i}
              style={{
                fontFamily: ANTON,
                fontSize: 86,
                lineHeight: 1.0,
                color: WHITE,
                opacity: s,
                transform: `translateY(${(1 - s) * 40}px)`,
                textShadow: "0 4px 18px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.9)",
                display: "inline-block",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* sublinhado dourado que cresce */}
      <div
        style={{
          marginTop: 22,
          height: 8,
          width: `${lineWidth * 220}px`,
          background: `linear-gradient(90deg, ${GOLD}, ${GOLD_SOFT})`,
          borderRadius: 100,
        }}
      />
    </AbsoluteFill>
  );
};

// Legenda inferior (lower-third) com aba dourada
const LowerThird: React.FC<{ legenda: string }> = ({ legenda }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 16 });
  if (!legenda) return null;
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 48px 300px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          opacity: inn,
          transform: `translateX(${(1 - inn) * -30}px)`,
          maxWidth: "86%",
        }}
      >
        <div style={{ width: 6, background: GOLD, borderRadius: 4, marginRight: 16 }} />
        <div
          style={{
            fontFamily: INTER,
            fontWeight: 600,
            fontSize: 32,
            lineHeight: 1.35,
            color: WHITE,
            background: "rgba(0,0,0,0.55)",
            padding: "16px 22px",
            borderRadius: 12,
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
          }}
        >
          {legenda}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// End card branded: dimeriza o vídeo + CTA premium
const EndCard: React.FC<{ gatilho: string }> = ({ gatilho }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 14], [0, 0.92], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: frame - 6, fps, config: { damping: 14, mass: 0.6 }, durationInFrames: 22 });
  const pill = spring({ frame: frame - 20, fps, config: { damping: 200 }, durationInFrames: 16 });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: INK, opacity: fade }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 60px", textAlign: "center" }}>
        <div style={{ transform: `scale(${0.92 + pop * 0.08})`, opacity: pop }}>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 24, letterSpacing: 4, color: GOLD, textTransform: "uppercase", marginBottom: 26 }}>
            Vagas limitadas · 1ª turma
          </div>
          <div style={{ fontFamily: ANTON, fontSize: 104, lineHeight: 0.96, color: WHITE, textTransform: "uppercase" }}>
            {gatilho}
          </div>
        </div>
        <div
          style={{
            marginTop: 44,
            opacity: pill,
            transform: `translateY(${(1 - pill) * 20}px)`,
            fontFamily: INTER,
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: 1,
            color: INK,
            background: `linear-gradient(135deg, ${GOLD}, ${GOLD_SOFT})`,
            padding: "18px 40px",
            borderRadius: 16,
          }}
        >
          protocolorv.com.br/vip
        </div>
        <div style={{ marginTop: 30, opacity: pill, fontFamily: ANTON, fontSize: 26, letterSpacing: 3, color: "rgba(255,255,255,0.55)" }}>
          TRINCA <span style={{ color: GOLD }}>RV21</span> · DIA 1 DE 21
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<ReelProps> = ({ videoSrc, gancho, gatilho, legenda, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const hookDur = Math.round(fps * 3.6);
  const endDur = Math.round(fps * 3.6);
  const endStart = durationInFrames - endDur;

  // leve zoom-in cinematográfico no vídeo (vida)
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.07], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <Video src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>

      {audioSrc && <Audio src={audioSrc} volume={0.15} />}

      <Vignette />
      <BottomScrim />
      <TopBar />

      {/* Gancho cinético */}
      <Sequence from={6} durationInFrames={hookDur}>
        <KineticHook gancho={gancho} />
      </Sequence>

      {/* Legenda no miolo (se houver) */}
      {legenda ? (
        <Sequence from={hookDur + 10} durationInFrames={Math.max(1, endStart - hookDur - 20)}>
          <LowerThird legenda={legenda} />
        </Sequence>
      ) : null}

      {/* End card branded */}
      <Sequence from={endStart} durationInFrames={endDur}>
        <EndCard gatilho={gatilho} />
      </Sequence>
    </AbsoluteFill>
  );
};
