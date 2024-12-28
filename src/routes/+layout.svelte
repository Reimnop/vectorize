<script lang="ts">
	import '../app.pcss';
	import Footer from './Footer.svelte';
	import Header from './Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>Vectorize</title>
	<meta name="title" content="Vectorize" />
	<meta name="description" content="THE tool to convert SVG files to Project Arrhythmia prefabs " />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://vectorize.reimnop.com/" />
	<meta property="og:title" content="Vectorize" />
	<meta property="og:description" content="THE tool to convert SVG files to Project Arrhythmia prefabs " />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://vectorize.reimnop.com/" />
	<meta property="twitter:title" content="Vectorize" />
	<meta property="twitter:description" content="THE tool to convert SVG files to Project Arrhythmia prefabs " />
</svelte:head>

<div class="w-screen min-h-screen p-4 flex flex-col gap-4">
	<header>
		<Header />
	</header>
	<main>
		{@render children()}
	</main>
	<footer class="mt-auto">
		<Footer />
	</footer>
</div>