<script lang="ts">
	import { onDestroy, onMount } from "svelte";

  interface Props {
    min: number;
    max: number;
    value: number;
    name: string;
    class: string;
  }

  let { 
    min = 1,
    max = 16,
    value = 1,
    name = "",
    class: className = ""
  }: Props = $props();

  onMount(() => {
    window.addEventListener("mouseup", mouseUp);
    window.addEventListener("mousemove", mouseMove);
  });

  onDestroy(() => {
    window.removeEventListener("mouseup", mouseUp);
    window.removeEventListener("mousemove", mouseMove);
  });

  let slider: HTMLDivElement | null = $state(null);
  let dragging = false;

  function mouseDown() {
    dragging = true;
  }

  function mouseUp() {
    dragging = false;
  }

  function mouseMove(event: MouseEvent) {
    if (!slider) return;
    if (!dragging) return;

    const rect = slider.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const newValue = Math.min(Math.max(0, x / width), 1) * (max - min) + min;

    value = Math.round(newValue);
  }

  function keyPress(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") {
      value = Math.max(min, value - 1);
    } else if (event.key === "ArrowRight") {
      value = Math.min(max, value + 1);
    }
  }
</script>

<div class="flex flex-row gap-4 select-none {className}">
  <div bind:this={slider}
       onmousedown={mouseDown}
       onkeydown={keyPress}
       draggable="false"
       role="slider" 
       tabindex="0" 
       aria-valuenow={value} 
       aria-valuemin={min} 
       aria-valuemax={max} 
       class="relative w-full h-6 cursor-pointer 
              [&>*:nth-child(1)]:hover:border-foreground 
              [&>*:nth-child(2)]:hover:bg-foreground 
              [&>*:nth-child(3)]:hover:bg-foreground 
              [&>*:nth-child(3)]:hover:h-6">
    <div class="absolute top-1/2 -translate-y-1/2 w-full h-2 border border-foreground-sub duration-75 rounded-full"></div>
    <div class="absolute top-1/2 -translate-y-1/2 h-2 bg-foreground-sub duration-75 rounded-full" style={`width: ${(value - min) / (max - min) * 100}%`}></div>
    <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-foreground-sub duration-75 rounded-full" style={`left: ${(value - min) / (max - min) * 100}%`}></div>
  </div>
  <span class="text-foreground-sub w-8 text-center border border-foreground-sub rounded-md">{value}</span>
</div>

<input type="range" min={min} max={max} value={value} name={name} class="hidden" />
