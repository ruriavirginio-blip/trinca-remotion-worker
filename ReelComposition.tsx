import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from "remotion";

export interface ReelProps {
  videoSrc: string;
  gancho: string;
  gatilho: string;
  legenda: string;
  audioSrc?: string;
}

const AnimatedText: React.FC<{ text: string; startFrame: number; color?: string }> = ({
  text,
  startFrame,
  color = "#FFFFFF",
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - startFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame - startFrame, [0, 8], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontFamily: "'Clash Display', 'Arial Black', sans-serif",
        fontWeight: 800,
        color,
        textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.7)",
        lineHeight: 1.15,
      }}
    >
      {text}
    </div>
  );
};

const CTACard: React.FC<{ gatilho: string }> = ({ gatilho }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
      <div
        style={{
          opacity,
          background: "rgba(0,0,0,0.85)",
          border: "2px solid #D4AF37",
          borderRadius: 16,
          padding: "24px 40px",
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        <div
          style={{
            fontFamily: "'Clash Display', 'Arial Black', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#FFFFFF",
            marginBottom: 8,
          }}
        >
          COMENTE ABAIXO:
        </div>
        <div
          style={{
            fontFamily: "'Clash Display', 'Arial Black', sans-serif",
            fontWeight: 900,
            fontSize: 36,
            color: "#D4AF37",
            letterSpacing: 2,
          }}
        >
          {gatilho}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ReelComposition: React.FC<ReelProps> = ({
  videoSrc,
  gancho,
  gatilho,
  legenda,
  audioSrc,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const ctaStartFrame = durationInFrames - fps * 5;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Video src={videoSrc} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

      {audioSrc && <Audio src={audioSrc} volume={0.15} />}

      <Sequence from={0} durationInFrames={fps * 3}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)",
              padding: "30px 20px",
              borderRadius: 12,
              textAlign: "center",
              width: "100%",
            }}
          >
            <AnimatedText text={gancho} startFrame={0} color="#FFFFFF" />
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={fps * 4} durationInFrames={ctaStartFrame - fps * 4}>
        <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 24px 140px" }}>
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              borderRadius: 10,
              padding: "12px 16px",
              borderLeft: "3px solid #D4AF37",
            }}
          >
            <div
              style={{
                fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
                fontWeight: 600,
                fontSize: 18,
                color: "#FFFFFF",
                lineHeight: 1.5,
              }}
            >
              {legenda}
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      <Sequence from={ctaStartFrame} durationInFrames={fps * 5}>
        <CTACard gatilho={gatilho} />
      </Sequence>
    </AbsoluteFill>
  );
};
