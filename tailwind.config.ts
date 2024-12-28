import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				background: '#0f0f0f',
				foreground: '#f0f0f0',
				'foreground-sub': '#909090',
			},
			fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
		}
	},

	plugins: []
} satisfies Config;
