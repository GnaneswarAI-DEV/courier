/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Royal navy foundation. Used for the workspace chrome and headings.
        ink: {
          950: '#08101F',
          900: '#0E1A2E',
          850: '#14233A',
          800: '#1A2C47',
          700: '#243A59',
          600: '#33496B',
        },
        // Antique gold: the primary accent across buttons, badges and charts.
        brand: {
          50: '#FBF5E6',
          100: '#F5E8C8',
          200: '#EAD49C',
          300: '#DBB96C',
          400: '#C9A047',
          500: '#B0852F',
          600: '#96701F',
          700: '#7A5A19',
          800: '#624715',
          900: '#503A12',
        },
        // Warm ivory instead of cold grey, so tables and forms read like paper.
        surface: '#F7F3EA',
        // Royal indigo for selection, focus and secondary emphasis.
        accent: '#2F3595',
        // Deep emerald for delivered/success states: green that sits beside navy
        // without the neon cast of Tailwind's default emerald.
        success: {
          50: '#E1F0E7',
          100: '#D6E9DE',
          500: '#2F7D5B',
          600: '#276A4C',
          700: '#1F5540',
        },
        // Landing-page palette: ivory paper, navy ink, gold. Kept separate from
        // the workspace tokens so the marketing surface keeps its editorial voice.
        paper: {
          DEFAULT: '#F5F0E4',
          50: '#FBF8F1',
          100: '#F1EADA',
          200: '#E5DBC6',
          300: '#D3C6AA',
        },
        char: '#14192B',
        clay: {
          400: '#9A9585',
          500: '#78725F',
          600: '#565141',
        },
        // Deep navy surface for the map console and hero graphics.
        console: {
          DEFAULT: '#0B1424',
          800: '#101B2E',
          700: '#16243A',
          600: '#22344E',
        },
        gold: {
          50: '#FBF3E2',
          100: '#F6E4BF',
          200: '#EBCE94',
          300: '#DDB367',
          400: '#C99A43',
          500: '#AE7F27',
          600: '#91681D',
          700: '#745217',
          800: '#5B4013',
          900: '#47320F',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Manrope', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 18, 32, 0.04), 0 8px 24px -12px rgba(10, 18, 32, 0.18)',
        lift: '0 18px 40px -18px rgba(10, 18, 32, 0.35)',
        focus: '0 0 0 3px rgba(47, 53, 149, 0.18)',
        board: '0 30px 70px -40px rgba(20, 25, 43, 0.45)',
        console: '0 44px 80px -46px rgba(8, 16, 31, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        xl2: '1.125rem',
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
        'grid-paper':
          'linear-gradient(to right, rgba(20,25,43,0.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,25,43,0.055) 1px, transparent 1px)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          from: { transform: 'translate3d(0, 0, 0)' },
          to: { transform: 'translate3d(-50%, 0, 0)' },
        },
        wheelSpin: {
          to: { transform: 'rotate(360deg)' },
        },
        roadDash: {
          to: { transform: 'translate3d(-32px, 0, 0)' },
        },
        drive: {
          '0%': { transform: 'translate3d(-90px, -50%, 0)' },
          '100%': { transform: 'translate3d(430px, -50%, 0)' },
        },
        nodePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.75' },
          '50%': { transform: 'scale(1.9)', opacity: '0' },
        },
        tripRun: {
          from: { offsetDistance: '0%' },
          to: { offsetDistance: '100%' },
        },
        dashTravel: {
          to: { strokeDashoffset: '-64' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        marquee: 'marquee 42s linear infinite',
        'wheel-spin': 'wheelSpin 0.9s linear infinite',
        'road-dash': 'roadDash 0.8s linear infinite',
        drive: 'drive 12s linear infinite',
        'node-pulse': 'nodePulse 2.6s ease-out infinite',
        'trip-run': 'tripRun 15s linear infinite',
        'dash-travel': 'dashTravel 2.6s linear infinite',
      },
    },
  },
  plugins: [],
}
