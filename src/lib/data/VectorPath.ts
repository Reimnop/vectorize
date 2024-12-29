import type { Color } from "three/src/math/Color.js";
import type { Vector2Like } from "three/src/math/Vector2.js";

export interface VectorPath {
  vertices: Vector2Like[];
  holes: Vector2Like[][];
  color: Color
}