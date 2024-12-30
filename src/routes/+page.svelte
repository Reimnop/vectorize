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
	import type { Triangle } from '$lib/data/Triangle';
	import type { VectorPath } from '$lib/data/VectorPath';
	import ToggleSwitch from '$lib/components/ToggleSwitch.svelte';

  interface Result {
    text: string;
    prefabName: string;
    objectCount: number;
  }

  interface Preview {
    paths: VectorPath[];
    minBoxX: number;
    minBoxY: number;
    maxBoxX: number;
    maxBoxY: number;
  }

  let selectedFile: File | null = $state(null);
  let previewEnabled: boolean = $state(false);

  let quality: number = $state(3);

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
  let previewPromise: Promise<Preview> | null = $derived.by(() => {
    if (!previewEnabled) {
      return null;
    }
    if (!svgPromise) {
      return null;
    }
    const svgPromise1 = svgPromise;
    const segments = quality;

    async function generatePreview(): Promise<Preview> {
      const svg = await svgPromise1;
      const paths = Vectorize.computeSvgPaths(svg, segments);
      const minBoxX = Math.min(...paths.flatMap(x => x.vertices.map(x => x.x)));
      const minBoxY = Math.min(...paths.flatMap(x => x.vertices.map(x => x.y)));
      const maxBoxX = Math.max(...paths.flatMap(x => x.vertices.map(x => x.x)));
      const maxBoxY = Math.max(...paths.flatMap(x => x.vertices.map(x => x.y)));
      return { paths, minBoxX, minBoxY, maxBoxX, maxBoxY };
    };

    return generatePreview();
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

    const paths = Vectorize.computeSvgPaths(svg, quality);

    const minBoxX = Math.min(...paths.flatMap(x => x.vertices.map(x => x.x)));
    const minBoxY = Math.min(...paths.flatMap(x => x.vertices.map(x => x.y)));
    const maxBoxX = Math.max(...paths.flatMap(x => x.vertices.map(x => x.x)));
    const maxBoxY = Math.max(...paths.flatMap(x => x.vertices.map(x => x.y)));
    const width = maxBoxX - minBoxX;
    const height = maxBoxY - minBoxY;

    const triangles: Triangle[] = [];
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const trianglesForPath = Vectorize.triangulatePath(path, i);
      triangles.push(...trianglesForPath);
    }

    const rightTriangles = triangles.flatMap(triangle => Vectorize.convertTriangleToRightTriangles(triangle));

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

  function getPathString(path: VectorPath): string {
    const vertices = path.vertices;
    if (vertices.length < 3) {
      return "";
    }

    let output = `M ${vertices[0].x} ${vertices[0].y}`;
    for (let i = 1; i < vertices.length; i++) {
      output += ` L ${vertices[i].x} ${vertices[i].y}`;
    }

    const holes = path.holes;
    if (holes.length === 0) {
      return output;
    }

    output += " Z";

    for (const hole of holes) {
      if (hole.length < 3) {
        continue;
      }

      output += ` M ${hole[0].x} ${hole[0].y}`;
      for (let i = 1; i < hole.length; i++) {
        output += ` L ${hole[i].x} ${hole[i].y}`;
      }
      output += " Z";
    }

    return output;
  }
</script>

<div class="flex flex-col gap-4 lg:flex-row lg:max-w-[64rem] lg:mx-auto">
  <Panel class="lg:flex-[2_1_0] flex flex-col gap-2">
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
        <RangeSlider min={1} max={16} bind:value={quality} name="quality" ariaLabel="quality" class="w-full" />
      </label>
      <label>
        Layer
        <RangeSlider min={0} max={40} value={40} name="layer" ariaLabel="layer" class="w-full" />
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
    <label class="flex-row gap-2 text-foreground-sub">
      Enable preview
      <ToggleSwitch name="preview" bind:value={previewEnabled} />
    </label>
  </Panel>
  <Panel class="lg:flex-[1_1_0] flex flex-col gap-2">
    <h2 class="text-center">Result</h2>
    {#if previewPromise}
      {#await previewPromise then preview}
        <div class="w-full p-4">
          <svg class="w-full drop-shadow-[0_0_0.5rem_rgba(255,255,255,0.25)]" viewBox="{preview.minBoxX} {preview.minBoxY} {preview.maxBoxX - preview.minBoxX} {preview.maxBoxY - preview.minBoxY}">
            {#each preview.paths as path}
              <path d={getPathString(path)}
                    fill="#{path.color.getHexString()}" 
                    fill-rule="nonzero" />
            {/each}
          </svg>
        </div>
      {:catch error}
        <p class="text-red-600">Failed to render preview: {error}</p>
      {/await}
    {/if}

    {#if result}
      <p class="text-center">Your prefab is ready!</p>
      <p class="flex flex-row gap-1 items-center">
        <IconTypeOutline class="inline-block text-base" />
        <span>{result.prefabName}</span>
      </p>
      <p class="flex flex-row gap-1 items-center">
        <IconLayoutGrid class="inline-block text-base" />
        <span>{result.objectCount} objects</span>
      </p>
      <TextDownload class="block w-full" text={result.text} fileName="prefab.vgp" />
    {:else if !previewPromise}
      <p class="text-center">Nothing here... yet.</p>
    {/if}
  </Panel>
</div>
