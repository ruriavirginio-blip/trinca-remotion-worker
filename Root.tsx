import { Composition } from "remotion";
import { ReelComposition, type ReelProps } from "./ReelComposition";

const ReelCompositionForRemotion: React.FC<Record<string, unknown>> = (props) => {
  return <ReelComposition {...(props as unknown as ReelProps)} />;
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ReelTrinca"
      component={ReelCompositionForRemotion}
      durationInFrames={30 * 30}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        videoSrc: "",
        gancho: "",
        gatilho: "",
        legenda: "",
        audioSrc: undefined,
      }}
    />
  );
};
