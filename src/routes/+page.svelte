<script lang="ts">
  import Vectorize from '$lib/Vectorize';
	import PrefabGenerator from '$lib/PrefabGenerator';
	import Panel from './Panel.svelte';
  import IconTypeOutline from '~icons/lucide/type-outline';
  import IconLayoutGrid from '~icons/lucide/layout-grid';
	import RangeSlider from '$lib/components/RangeSlider.svelte';
	import type { SVGResult } from 'three/examples/jsm/Addons.js';
	import TextDownload from './TextDownload.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';

  interface Result {
    text: string;
    prefabName: string;
    objectCount: number;
  }

  let selectedFile: File | null = $state(null);
  let svgPromise: Promise<SVGResult> | null = $derived.by(() => {
    if (!selectedFile) {
      return null;
    }

    const file = selectedFile;

    return new Promise<SVGResult>((resolve, reject) => {
      // Load SVG
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");

      reader.addEventListener("load", () => {
        const text = reader.result as string;
        try {
          const svg = Vectorize.parseSvg(text);
          resolve(svg);
        } catch (error) {
          reject(error);
        }
      });

      reader.addEventListener("error", () => {
        reject("Failed to read file");
      });
    });
  });

  let result: Result | null = $state(null);

  function onSubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
    event.preventDefault();

    if (!svgPromise) {
      return;
    }

    const form = new FormData(event.currentTarget);
    
    generateAsync(svgPromise, form)
      .then(x => result = x)
      .catch(console.error);
  }

  async function generateAsync(svgPromise: Promise<SVGResult>, form: FormData): Promise<Result> {
    const svg = await svgPromise;

    const theme: Map<string, number> = new Map();
    for (const [key, value] of form.entries()) {
      if (key.startsWith("#")) {
        theme.set(key.slice(1), Number(value) - 1);
      }
    }

    const quality = Math.floor(Number(form.get("quality")));
    const layer = Math.floor(Number(form.get("layer")));
    const length = Number(form.get("length"));
    const size = Number(form.get("size"));
    const prefabName = form.get("prefab-name") as string;
    const prefabType = Number(form.get("prefab-type"));
    const prefabDescription = form.get("prefab-description") as string;

    const triangles = Vectorize.triangulateSvg(svg, quality);
    const rightTriangles = triangles.flatMap(triangle => Vectorize.convertTriangleToRightTriangles(triangle));

    const minBoxX = Math.min(...triangles.flatMap(x => [x.a.x, x.b.x, x.c.x]));
    const minBoxY = Math.min(...triangles.flatMap(x => [x.a.y, x.b.y, x.c.y]));
    const maxBoxX = Math.max(...triangles.flatMap(x => [x.a.x, x.b.x, x.c.x]));
    const maxBoxY = Math.max(...triangles.flatMap(x => [x.a.y, x.b.y, x.c.y]));
    const width = maxBoxX - minBoxX;
    const height = maxBoxY - minBoxY;

    const sizeDivisor = Math.max(width, height);

    const objects: object[] = [];
    const parentObject = PrefabGenerator.createObject(
      PrefabGenerator.generateId(),
      undefined,
      prefabName,
      0,
      length,
      { x: 0, y: 0 },
      6,
      20,
      0,
      { x: 0, y: 0 },
      { x: 1 / sizeDivisor * size, y: -1 / sizeDivisor * size },
      0,
      0,
    );
    objects.push(parentObject);

    const triangleOffsetX = (maxBoxX + minBoxX) / 2;
    const triangleOffsetY = (maxBoxY + minBoxY) / 2;

    for (const triangle of rightTriangles) {
      const color = theme.get(triangle.color);
      if (color === undefined) {
        console.log("color not found", triangle.color);
        continue;
      }

      const object = PrefabGenerator.createObject(
        PrefabGenerator.generateId(),
        parentObject.id,
        `triangle_${objects.length}`,
        0,
        length,
        { x: 0.5, y: 0.5 },
        5,
        layer - triangle.z,
        1,
        { x: triangle.origin.x - triangleOffsetX, y: triangle.origin.y - triangleOffsetY },
        { x: triangle.width, y: triangle.height },
        triangle.angle,
        color,
      );
      objects.push(object);
    }

    const prefab = PrefabGenerator.createPrefab(prefabName, prefabDescription, prefabType, objects);
    return {
      text: JSON.stringify(prefab),
      prefabName,
      objectCount: objects.length,
    };
  }
</script>

<div class="flex flex-col gap-4 lg:flex-row lg:max-w-[64rem] lg:mx-auto">
  <Panel class="lg:flex-[2_1_0]">
    <h2 class="text-center">Config</h2>
    <form onsubmit={onSubmit}>
      <div class="flex flex-col gap-2 sm:flex-row">
        <label class="w-full">
          Prefab name
          <input type="text" name="prefab-name" />
        </label>
        <label>
          Prefab type
          <select name="prefab-type">
            <option value={0}>Character</option>
            <option value={1}>Character Parts</option>
            <option value={2}>Props</option>
            <option value={3}>Bullets</option>
            <option value={4}>Pulses</option>
            <option value={5}>Bombs</option>
            <option value={6}>Spinners</option>
            <option value={7}>Beams</option>
            <option value={8}>Static</option>
            <option value={9}>Misc 1</option>
            <option value={10}>Misc 2</option>
            <option value={11}>Misc 3</option>
          </select>
        </label>
      </div>
      <label>
        Prefab description
        <textarea name="prefab-description" class="min-h-20"></textarea>
      </label>
      <label>
        Quality
        <RangeSlider min={1} max={16} value={3} name="quality" class="w-full" />
      </label>
      <label>
        Layer
        <RangeSlider min={0} max={40} value={40} name="layer" class="w-full" />
      </label>
      <label>
        Size
        <input type="number" name="size" min="0" value="5" step="0.001" />
      </label>
      <label>
        Length
        <input type="number" name="length" min="0" value="10" step="0.001" />
      </label>
      <label>
        Upload SVG
        <FileUpload name="svg-file" accept=".svg" onChange={(value) => selectedFile = value} />
      </label>
      {#if svgPromise}
        {#await svgPromise then svg}
          <label>
            Theme (click on color to copy)
            <div class="flex flex-row flex-wrap gap-4">
              {#each Array.from(Vectorize.generateTheme(svg.paths.map(path => { return { color: path.color.getHexString() }; }))) as [key, value]}
                <div class="flex flex-row gap-1">
                  <button class="w-8 h-8" style="background-color: #{key}" onclick={() => navigator.clipboard.writeText(key)} aria-label="copy color {key}"></button>
                  <input type="number" class="w-16" name="#{key}" min="1" value={value + 1} />
                </div>
              {/each}
            </div>
          </label>
          <button type="submit">Generate</button>
        {:catch error}
          <p class="text-red-600">Failed to load SVG: {error}</p>
        {/await}
      {/if}
    </form>
  </Panel>
  <Panel class="lg:flex-[1_1_0]">
    <h2 class="text-center">Result</h2>
    {#if result}
      <p class="text-center">Your prefab is ready!</p>
      <div class="w-full flex flex-col gap-2">
        <p class="flex flex-row gap-1 items-center">
          <IconTypeOutline class="inline-block text-base" />
          <span>{result.prefabName}</span>
        </p>
        <p class="flex flex-row gap-1 items-center">
          <IconLayoutGrid class="inline-block text-base" />
          <span>{result.objectCount} objects</span>
        </p>
        <TextDownload class="block w-full" text={result.text} fileName="prefab.vgp" />
      </div>
    {:else}
      <p class="text-center">Nothing here... yet.</p>
    {/if}
  </Panel>
</div>
