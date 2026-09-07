/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        'surface-canvas': 'rgb(var(--surface-canvas) / <alpha-value>)',
        'surface-card': 'rgb(var(--surface-card) / <alpha-value>)',
        'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
        'surface-container-low': 'rgb(var(--surface-container-low) / <alpha-value>)',
        'surface-container-lowest': 'rgb(var(--surface-container-lowest) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--surface-elevated) / <alpha-value>)',
        'border-subtle': 'rgb(var(--border-subtle) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--on-primary-container) / <alpha-value>)',
        
        // Base statuses
        'status-verified': 'rgb(var(--status-verified) / <alpha-value>)',
        'status-pending': 'rgb(var(--status-pending) / <alpha-value>)',
        'status-rejected': 'rgb(var(--status-rejected) / <alpha-value>)',
        
        // Added: Missing background & border variants used in Reports_2.tsx
        'status-verified-bg': 'rgb(var(--status-verified-bg) / <alpha-value>)',
        'status-verified-border': 'rgb(var(--status-verified-border) / <alpha-value>)',
        'status-pending-bg': 'rgb(var(--status-pending-bg) / <alpha-value>)',
        'status-pending-border': 'rgb(var(--status-pending-border) / <alpha-value>)',
        'status-rejected-bg': 'rgb(var(--status-rejected-bg) / <alpha-value>)',
        'status-rejected-border': 'rgb(var(--status-rejected-border) / <alpha-value>)',

        brand: {
          navy: '#1E3A8A',    
          blue: '#2563EB',    
          success: '#10B981', 
          warning: '#F59E0B', 
          danger: '#EF4444',  
        }
      }
    },
  },
  plugins: [],
}