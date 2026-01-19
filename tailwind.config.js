/** @type {import('tailwindcss').Config} */
export default {
    safelist: [
        'col-span-1',
        'col-span-2',
        'col-span-3',
        'col-span-4',
        'col-span-5',
        'col-span-6',
        'col-span-7',
        'col-start-1',
        'col-start-2',
        'col-start-3',
        'col-start-4',
        'col-start-5',
        'col-start-6',
        'col-start-7',
        'col-end-1',
        'col-end-2',
        'col-end-3',
        'col-end-4',
        'col-end-5',
        'col-end-6',
        'col-end-7',
    ],
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {}
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}

