import type { Point2 } from "./Point2";

export interface RightTriangle {
  origin: Point2;
  width: number;
  height: number;
  angle: number;
  z: number;
  color: string;
}