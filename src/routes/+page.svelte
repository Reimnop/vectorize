<script lang="ts">
	import { onMount } from 'svelte';
  import Vectorize from '$lib/Vectorize';
	import PrefabGenerator from '$lib/PrefabGenerator';

  let output: string = $state("");
  let palette: Map<string, number> = $state(new Map());

  onMount(async () => {
    const svg = await Vectorize.loadSvgAsync("/us.svg");
    const triangles = Vectorize.triangulateSvg(svg);
    const rightTriangles = triangles.flatMap(triangle => Vectorize.convertTriangleToRightTriangles(triangle));

    // create theme
    palette = Vectorize.generateTheme(rightTriangles);

    // create prefab
    const objects: object[] = [];

    const parentObject = PrefabGenerator.createObject(
      PrefabGenerator.generateId(),
      undefined,
      "root",
      0,
      10,
      { x: 0, y: 0 },
      6,
      20,
      { x: 0, y: 0 },
      { x: 1 / 36 * 10, y: -1 / 36 * 10 },
      0,
      0
    );
    objects.push(parentObject);

    for (const triangle of rightTriangles) {
      const color = palette.get(triangle.color);
      if (color === undefined) {
        continue;
      }

      const object = PrefabGenerator.createObject(
        PrefabGenerator.generateId(),
        parentObject.id,
        `triangle_${objects.length}`,
        0,
        10,
        { x: 0.5, y: 0.5 },
        5,
        40 - triangle.z,
        { x: triangle.origin.x, y: triangle.origin.y },
        { x: triangle.width, y: triangle.height },
        triangle.angle,
        color
      );
      objects.push(object);
    }

    const prefab = PrefabGenerator.createPrefab("murica", 2, objects);
    output = JSON.stringify(prefab);
  });
</script>

<pre>{output}</pre>

<ul>
  {#each Array.from(palette) as [color, index]}
    <li>{index}: {color}</li>
  {/each}
</ul>
