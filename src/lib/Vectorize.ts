import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { ShapeUtils } from 'three/src/extras/ShapeUtils.js';
import type { SVGResult } from 'three/examples/jsm/Addons.js';
import type { Triangle } from './data/Triangle';
import type { RightTriangle } from './data/RightTriangle';
import { Vector2 } from './data/Vector2';
import type { Point2 } from './data/Point2';
import type { VectorPath } from './data/VectorPath';

function parseSvg(text: string): SVGResult {
  const loader = new SVGLoader();
  return loader.parse(text);
}

function computeSvgPaths(svg: SVGResult, segments: number): VectorPath[] {
  const paths: VectorPath[] = [];
  for (const svgPath of svg.paths) {
    const shapes = SVGLoader.createShapes(svgPath);
    for (const shape of shapes) {
      const points = shape.extractPoints(segments);
      const vertices = points.shape;
      const holes = points.holes;

      // ensure vertices are in counter-clockwise order
      if (ShapeUtils.isClockWise(vertices)) {
        vertices.reverse();
      }

      // ensure all holes are in clockwise order
      for (const hole of holes) {
        if (!ShapeUtils.isClockWise(hole)) {
          hole.reverse();
        }
      }

      paths.push({ 
        vertices,
        holes,
        color: svgPath.color
      });
    }
  }
  return paths;
}

function triangulatePath(path: VectorPath, z: number): Triangle[] {
  const triangles: Triangle[] = [];

  const vertices = path.vertices;
  const holes = path.holes;

  // triangulate shape
  const faces = ShapeUtils.triangulateShape(vertices, holes);

  // join vertices of inner and outer paths
  const allVertices = vertices.concat(...holes);

  // create triangles
  for (const face of faces) {
    const a = allVertices[face[0]];
    const b = allVertices[face[1]];
    const c = allVertices[face[2]];

    // check if any vertex overlaps
    if (Math.abs(a.x - b.x) < 0.0001 && Math.abs(a.y - b.y) < 0.0001) {
      continue;
    }

    if (Math.abs(b.x - c.x) < 0.0001 && Math.abs(b.y - c.y) < 0.0001) {
      continue;
    }

    if (Math.abs(c.x - a.x) < 0.0001 && Math.abs(c.y - a.y) < 0.0001) {
      continue;
    }

    triangles.push({
      a: { x: a.x, y: a.y },
      b: { x: b.x, y: b.y },
      c: { x: c.x, y: c.y },
      z: z,
      color: path.color.getHexString()
    });
  }
  return triangles;
}

function convertTriangleToRightTriangles(triangle: Triangle): RightTriangle[] {
  const points = [
    {
      point: new Vector2(triangle.a.x, triangle.a.y),
      angle: angleBetweenVectors(
        new Vector2(triangle.b.x - triangle.a.x, triangle.b.y - triangle.a.y),
        new Vector2(triangle.c.x - triangle.a.x, triangle.c.y - triangle.a.y)
      )
    },
    {
      point: new Vector2(triangle.b.x, triangle.b.y),
      angle: angleBetweenVectors(
        new Vector2(triangle.a.x - triangle.b.x, triangle.a.y - triangle.b.y),
        new Vector2(triangle.c.x - triangle.b.x, triangle.c.y - triangle.b.y)
      )
    },
    {
      point: new Vector2(triangle.c.x, triangle.c.y),
      angle: angleBetweenVectors(
        new Vector2(triangle.a.x - triangle.c.x, triangle.a.y - triangle.c.y),
        new Vector2(triangle.b.x - triangle.c.x, triangle.b.y - triangle.c.y)
      )
    }
  ];

  points.sort((a, b) => b.angle - a.angle);

  const a = points[0].point;
  const b = points[1].point;
  const c = points[2].point;

  const bcVector = new Vector2(c.x - b.x, c.y - b.y);
  const uVector = bcVector.normalize();
  const a_: Point2 = {
    x: a.x - b.x,
    y: a.y - b.y
  };
  const h_: Point2 = {
    x: uVector.x * uVector.x * a_.x + uVector.x * uVector.y * a_.y,
    y: uVector.x * uVector.y * a_.x + uVector.y * uVector.y * a_.y
  };
  const h: Point2 = {
    x: h_.x + b.x,
    y: h_.y + b.y
  };

  const rightTriangles: RightTriangle[] = [];

  {
    const haVector = new Vector2(a.x - h.x, a.y - h.y);
    const hbVector = new Vector2(b.x - h.x, b.y - h.y);
    const v1 = haVector.normalize();
    const v2 = hbVector.normalize();

    const determinant = v1.x * v2.y - v1.y * v2.x;
    const theta = Math.atan2(v1.y, v1.x);

    const width = haVector.length();
    const height = determinant < 0 ? -hbVector.length() : hbVector.length();

    if (!isNaN(theta) && !isNaN(width) && !isNaN(height)) {
      rightTriangles.push({
        origin: h,
        width: width,
        height: height,
        angle: theta,
        z: triangle.z,
        color: triangle.color
      });
    } 
  }

  {
    const haVector = new Vector2(a.x - h.x, a.y - h.y);
    const hbVector = new Vector2(c.x - h.x, c.y - h.y);
    const v1 = haVector.normalize();
    const v2 = hbVector.normalize();

    const theta = Math.atan2(v1.y, v1.x);
    const determinant = v1.x * v2.y - v1.y * v2.x;

    const width = haVector.length();
    const height = determinant < 0 ? -hbVector.length() : hbVector.length();

    if (!isNaN(theta) && !isNaN(width) && !isNaN(height)) {
      rightTriangles.push({
        origin: h,
        width: width,
        height: height,
        angle: theta,
        z: triangle.z,
        color: triangle.color
      });
    }
  }

  return rightTriangles;
}

function generateTheme(objects: { color: string }[]): Map<string, number> {
  const theme = new Map<string, number>();
  for (const obj of objects) {
    if (!theme.has(obj.color)) {
      theme.set(obj.color, theme.size);
    }
  }
  return theme;
}

function angleBetweenVectors(a: Vector2, b: Vector2): number {
  return Math.acos(a.dot(b) / (a.length() * b.length()));
}

export default {
  parseSvg,
  computeSvgPaths,
  triangulatePath,
  convertTriangleToRightTriangles,
  generateTheme
}