/** @type {import('tailwindcss').Config} */
import PrimeUI from 'tailwindcss-primeui';

export default {
    darkMode: ['selector', '[class="app-dark"]'],
    content: [
        './src/**/*.{html,ts,scss,css}',
        './index.html',
        "./node_modules/flowbite/**/*.js"
    ],
    plugins: [PrimeUI, require('flowbite/plugin')],
    theme: {
        screens: {
            sm: '576px',
            md: '768px',
            lg: '992px',
            xl: '1200px',
            '2xl': '1920px'
        }
    }
};
