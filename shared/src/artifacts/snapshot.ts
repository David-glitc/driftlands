import { ARTIFACT_CONFIG_VERSION, ARTIFACT_DEFINITIONS } from "./catalog.js";
import { scoreArtifactAxes } from "./rank.js";

/** Catalog snapshot for clients — includes ranking axes. */
export function catalogSnapshot() {
  return {
    configVersion: ARTIFACT_CONFIG_VERSION,
    artifacts: ARTIFACT_DEFINITIONS.map((def) => ({
      ...def,
      axes: scoreArtifactAxes(def),
    })),
  };
}
