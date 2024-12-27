import type { Point2 } from "./data/Point2";

function createPrefab(name: string, type: number, objects: object[]) {
  return {
    n: name,
    type,
    objs: objects
  };
}

function createObject(
  id: string,
  parentId: string | undefined,
  name: string,
  startTime: number,
  length: number,
  origin: Point2,
  type: number,
  depth: number,
  position: Point2,
  scale: Point2,
  rotation: number,
  color: number) {
  return {
    id,
    p_id: parentId,
    ak_t: 3, // fixed time
    ak_o: length,
    ot: type,
    n: name,
    o: {
      x: origin.x,
      y: origin.y,
    },
    s: 2, // triangle shape
    so: 2, // right triangle
    p_t: "111", // parent type (all)
    d: depth,
    st: startTime,
    e: [
      {
        k: [
          {
            ev: [
              position.x,
              position.y
            ]
          }
        ]
      },
      {
        k: [
          {
            ev: [
              scale.x,
              scale.y
            ]
          }
        ]
      },
      {
        k: [
          {
            ev: [
              rotation * 180 / Math.PI
            ]
          }
        ]
      },
      {
        k: [
          {
            ev: [
              color
            ]
          }
        ]
      }
    ]
  };
}

function generateId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*_+{}|:<>?,./;'[]▓▒░▐▆▉☰☱☲☳☴☵☶☷►▼◄▬▩▨▧▦▥▤▣▢□■¤ÿòèµ¶™ßÃ®¾ð¥œ⁕(◠‿◠✿)";
  const length = 16;
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default {
  createPrefab,
  createObject,
  generateId
}