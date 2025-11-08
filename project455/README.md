# Audio Steganography Application

A modern web application for hiding secret messages in audio files using LSB (Least Significant Bit) steganography with XOR encryption.

## Features

- 🎵 **Audio Steganography**: Hide messages in WAV audio files
- 🔐 **XOR Encryption**: Additional security layer with key-based encryption
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- ⚡ **Fast Processing**: Efficient encoding and decoding
- 🔒 **Secure**: Key-based protection ensures only authorized users can extract messages

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

### Encoding a Message

1. Go to the **Encode** tab
2. Upload a WAV audio file
3. Enter your secret message
4. Provide an encryption key
5. Click "Encode Message"
6. Download the encoded audio file

### Decoding a Message

1. Go to the **Decode** tab
2. Upload the encoded WAV audio file
3. Enter the encryption key used during encoding
4. Click "Decode Message"
5. View the extracted message

### Interactive Demo

Try the **Demo** tab to see a complete example of encoding and decoding in action.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Sonner** - Toast notifications

## Project Structure

```
project455/
├── src/
│   ├── components/      # React components
│   │   ├── ui/          # UI components (Button, Card, Tabs)
│   │   ├── HeroSection.tsx
│   │   ├── FeatureShowcase.tsx
│   │   ├── EncoderPanel.tsx
│   │   ├── DecoderPanel.tsx
│   │   ├── DemoPanel.tsx
│   │   └── MethodologySection.tsx
│   ├── lib/             # Core libraries
│   │   └── steganography.ts  # LSB encoding/decoding logic
│   ├── pages/           # Page components
│   │   └── index.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

### LSB Steganography

The application uses the Least Significant Bit (LSB) method to hide messages in audio files:

1. **Encoding**: Each bit of the encrypted message is embedded in the least significant bit of audio samples
2. **Decoding**: The LSBs are extracted and reconstructed into the original message
3. **Encryption**: Messages are XOR-encrypted with a user-provided key before embedding

### Security Notes

- Always use strong, unique encryption keys
- Never share keys over insecure channels
- Keep your stego files secure - they contain hidden information
- Remember: Steganography provides concealment, not encryption alone

## License

This project is for educational purposes.

