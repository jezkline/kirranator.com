// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://kirranator.com',
	integrations: [
		starlight({
			title: 'Yapper',
			description: 'Documentation for Yapper, a node-based dialogue system for Unity.',
			logo: { light: './src/assets/yapper-light.png', dark: './src/assets/yapper-dark.png' },
			favicon: '/favicon.svg',
			customCss: ['./src/styles/docs.css'],
			social: [{ icon: 'email', label: 'Contact', href: 'mailto:contact@kirranator.com' }],
			sidebar: [
				{
					label: 'Yapper',
					items: [
						{ slug: 'yapper', label: 'Overview' },
						{ slug: 'yapper/graph-editor' },
						{ slug: 'yapper/nodes' },
						{ slug: 'yapper/conditions-and-actions' },
						{ slug: 'yapper/integration' },
						{ slug: 'yapper/presenters' },
						{ slug: 'yapper/saving' },
						{ slug: 'yapper/troubleshooting' },
						{ slug: 'yapper/api' },
						{ slug: 'yapper/roadmap' },
					],
				},
			],
		}),
	],
});
