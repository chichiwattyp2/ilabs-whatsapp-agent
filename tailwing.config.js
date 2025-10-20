/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ilabs-green': '#10b981',
        'ilabs-blue': '#3b82f6',
      },
    },
  },
  plugins: [],
}
```

## 🚨 Check Component Location

Make sure `WhatsAppAgentPanel.tsx` is at:
```
app/components/WhatsAppAgentPanel.tsx   ← Correct ✅
```

NOT at:
```
app/api/whatsapp/components/WhatsAppAgentPanel.tsx   ← Wrong ❌