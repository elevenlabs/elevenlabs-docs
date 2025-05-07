![Frame 514831260](https://github.com/user-attachments/assets/615d8a31-c5b0-43b6-8fb9-3f52132ff76e)

<p align="center">
  ElevenLabs open-source Next.js Audio Starter Kit
</p>

## Getting started

1. Clone the repo

```bash
git clone https://github.com/elevenlabs/elevenlabs-docs.git
cd examples/elevenlabs-nextjs
```

2. Setup the `.env` file

```bash
cp .env.example .env
```

- ELEVENLABS_API_KEY: Get your API key from [ElevenLabs](https://elevenlabs.io/app/settings/api-keys)
- IRON_SESSION_SECRET_KEY: Generate using `openssl rand -base64 32`

3. Install/run the project

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Capabilities

- Text to Speech
- Speech to Text
- Sound Effects
- Conversational AI

## Technology

- ElevenLabs SDK
- Next.js w/ Turbo + shadcn/ui
- Tailwind CSS v4

## Learn More

- [ElevenLabs Documentation](https://elevenlabs.io/docs) - learn about ElevenLabs features and API.
