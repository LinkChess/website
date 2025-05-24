
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			aspectRatio: {
				'4/3': '4 / 3',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				chesslink: {
					50: "#f7f7f8",
					100: "#eeeef0",
					200: "#d7d7dd",
					300: "#b5b4be",
					400: "#8c8a99",
					500: "#67657a",
					600: "#524f65",
					700: "#414053",
					800: "#383646",
					900: "#23222c",
					950: "#1c1b24",
				},
				accent: {
					DEFAULT: "#3b82f6", // Blue accent
					light: "#93c5fd",
					dark: "#2563eb",
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' },
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' },
				},
				'fade-in': {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				'fade-in-up': {
					from: { 
						opacity: '0',
						transform: 'translateY(20px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateY(0)'
					},
				},
				'slide-in-right': {
					from: { 
						opacity: '0',
						transform: 'translateX(20px)'
					},
					to: { 
						opacity: '1',
						transform: 'translateX(0)'
					},
				},
				'subtle-pulse': {
					'0%, 100%': { 
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.95',
						transform: 'scale(0.98)'
					},
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' },
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.7s ease-out',
				'fade-in-up': 'fade-in-up 0.7s ease-out',
				'slide-in-right': 'slide-in-right 0.7s ease-out',
				'subtle-pulse': 'subtle-pulse 4s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
			},
			fontFamily: {
				sans: ['SF Pro Display', 'Inter', 'system-ui', 'sans-serif'],
				mono: ['SF Mono', 'monospace'],
			},
			boxShadow: {
				'soft': '0 5px 20px rgba(0, 0, 0, 0.02)',
				'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
				'highlight': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'dot-pattern': 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
			},
			transitionTimingFunction: {
				'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
