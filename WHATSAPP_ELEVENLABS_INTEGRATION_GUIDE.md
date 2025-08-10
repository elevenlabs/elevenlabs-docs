# WhatsApp-ElevenLabs Voice Integration Setup Guide

## Table of Contents

1. [Prerequisites and Dependencies](#prerequisites-and-dependencies)
2. [Environment Setup](#environment-setup)
3. [Configuration Management](#configuration-management)
4. [Deployment Procedures](#deployment-procedures)
5. [Integration Setup](#integration-setup)
6. [Operational Procedures](#operational-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Testing and Validation](#testing-and-validation)
9. [Maintenance and Updates](#maintenance-and-updates)

---

## Prerequisites and Dependencies

### System Requirements

#### Node.js Environment
- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **npm/pnpm**: Latest stable version
- **Operating System**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+

#### Audio Processing Dependencies
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y build-essential python3-dev libasound2-dev

# macOS
brew install python3

# Windows (via chocolatey)
choco install python3 visualstudio2019buildtools
```

#### Network Requirements
- **Inbound Ports**: 
  - 443 (HTTPS/WSS)
  - 80 (HTTP redirect)
  - 3000-8000 (configurable application port)
- **Outbound Access**:
  - `api.elevenlabs.io:443` (ElevenLabs API)
  - `graph.facebook.com:443` (WhatsApp Business API)
  - STUN servers: `stun.l.google.com:19302`

#### Hardware Recommendations
- **CPU**: 2+ cores, 2.4GHz minimum for concurrent call handling
- **RAM**: 4GB minimum, 8GB recommended for production
- **Storage**: 10GB available space for logs and temporary audio files
- **Network**: 10Mbps minimum bandwidth per concurrent call

### Third-Party Service Accounts

#### ElevenLabs Setup
1. Create account at [ElevenLabs](https://elevenlabs.io)
2. Generate API key from [Dashboard > Settings > API Keys](https://elevenlabs.io/app/settings/api-keys)
3. Create Conversational AI agent at [Conversational AI Dashboard](https://elevenlabs.io/app/conversational-ai/agents/)
4. Note the Agent ID from agent settings

#### WhatsApp Business API Setup
1. Register for [WhatsApp Business API](https://business.whatsapp.com/api)
2. Set up Meta Developer account and create app
3. Configure webhook URL for voice message events
4. Obtain access token and verify webhook token

---

## Environment Setup

### Local Development Environment

#### 1. Project Initialization
```bash
# Clone or create project directory
mkdir whatsapp-elevenlabs-integration
cd whatsapp-elevenlabs-integration

# Initialize Node.js project
npm init -y

# Install core dependencies
npm install fastify @fastify/websocket @fastify/formbody
npm install ws dotenv node-fetch
npm install @elevenlabs/elevenlabs-js
npm install whatsapp-web.js  # Or official WhatsApp Business API SDK
```

#### 2. Development Dependencies
```bash
# Install development tools
npm install --save-dev nodemon typescript @types/node
npm install --save-dev @types/ws eslint prettier
```

#### 3. Environment Configuration
Create `.env` file:
```bash
# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# WebRTC Configuration (optional)
STUN_SERVER=stun:stun.l.google.com:19302

# Security
SESSION_SECRET=your_32_character_session_secret_here
WEBHOOK_SIGNATURE_SECRET=your_webhook_signature_secret_here
```

### Production Environment Differences

#### SSL/TLS Configuration
WhatsApp webhooks require HTTPS. For production:

```bash
# Using Let's Encrypt with certbot
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# Update environment variables
SSL_CERT_PATH=/etc/letsencrypt/live/your-domain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### Process Management
```bash
# Install PM2 for production process management
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'whatsapp-elevenlabs-bridge',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: '/var/log/whatsapp-bridge/combined.log',
    out_file: '/var/log/whatsapp-bridge/out.log',
    error_file: '/var/log/whatsapp-bridge/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
```

---

## Configuration Management

### Audio Format Configuration

#### ElevenLabs Audio Settings
```javascript
const ELEVENLABS_CONFIG = {
  // Audio output format for ElevenLabs TTS
  audioFormat: {
    format: 'pcm',        // PCM for real-time streaming
    sampleRate: 16000,    // 16kHz for telephony quality
    channels: 1,          // Mono audio
    bitDepth: 16          // 16-bit samples
  },
  
  // Conversation settings
  conversation: {
    maxDurationSeconds: 1800,  // 30 minutes max
    textOnly: false,
    clientEvents: ['user_transcript', 'agent_response', 'interruption']
  }
};
```

#### WhatsApp Audio Configuration
```javascript
const WHATSAPP_AUDIO_CONFIG = {
  // Audio format for WhatsApp voice messages
  inputFormat: {
    format: 'ogg',        // WhatsApp uses Opus in OGG container
    codec: 'opus',
    sampleRate: 16000,    // 16kHz standard
    channels: 1           // Mono
  },
  
  // Conversion settings for WebRTC
  webrtcFormat: {
    format: 'pcm',
    sampleRate: 16000,
    channels: 1,
    bitDepth: 16
  }
};
```

### WebSocket Configuration

#### Connection Settings
```javascript
const WEBSOCKET_CONFIG = {
  // ElevenLabs WebSocket
  elevenlabs: {
    url: 'wss://api.elevenlabs.io/v1/convai/conversation',
    pingInterval: 30000,      // 30 seconds
    reconnectAttempts: 5,
    reconnectInterval: 5000   // 5 seconds
  },
  
  // WhatsApp WebSocket (for real-time events)
  whatsapp: {
    maxConnections: 100,      // Concurrent WhatsApp connections
    messageTimeout: 30000,    // 30 seconds
    heartbeatInterval: 25000  // 25 seconds
  }
};
```

### Security Configuration

#### API Key Management
```javascript
// Use environment-specific key rotation
const API_KEYS = {
  development: {
    elevenlabs: process.env.ELEVENLABS_API_KEY_DEV,
    whatsapp: process.env.WHATSAPP_ACCESS_TOKEN_DEV
  },
  production: {
    elevenlabs: process.env.ELEVENLABS_API_KEY_PROD,
    whatsapp: process.env.WHATSAPP_ACCESS_TOKEN_PROD
  }
};

// Webhook signature verification
const verifyWhatsAppSignature = (payload, signature) => {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SIGNATURE_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

---

## Deployment Procedures

### Local Development Deployment

#### 1. Start Development Server
```bash
# Using npm scripts
npm run dev

# Or directly with nodemon
npx nodemon src/index.js

# Expose local server for webhook testing
npx ngrok http 3000
```

#### 2. Webhook Configuration
Update WhatsApp webhook URL to use ngrok URL:
```
https://your-ngrok-url.ngrok.io/webhook/whatsapp
```

### Production Server Deployment

#### 1. Server Preparation
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install process manager
npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash whatsapp-bridge
sudo usermod -aG audio whatsapp-bridge
```

#### 2. Application Deployment
```bash
# Clone repository
git clone <your-repo-url> /opt/whatsapp-elevenlabs-bridge
cd /opt/whatsapp-elevenlabs-bridge

# Install dependencies
npm ci --only=production

# Build TypeScript (if applicable)
npm run build

# Set ownership
sudo chown -R whatsapp-bridge:whatsapp-bridge /opt/whatsapp-elevenlabs-bridge

# Start with PM2
sudo -u whatsapp-bridge pm2 start ecosystem.config.js
sudo -u whatsapp-bridge pm2 save
sudo pm2 startup
```

### Cloud Platform Deployment

#### AWS EC2 Deployment
```bash
# User data script for EC2 instance
#!/bin/bash
yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install application
cd /home/ec2-user
git clone <your-repo-url> whatsapp-bridge
cd whatsapp-bridge
npm ci --only=production

# Configure systemd service
sudo tee /etc/systemd/system/whatsapp-bridge.service << EOF
[Unit]
Description=WhatsApp ElevenLabs Bridge
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/whatsapp-bridge
ExecStart=/home/ec2-user/.nvm/versions/node/v18.*/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable whatsapp-bridge
sudo systemctl start whatsapp-bridge
```

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install audio processing dependencies
RUN apk add --no-cache \
    build-base \
    python3 \
    py3-pip \
    alsa-lib-dev

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build if TypeScript
RUN npm run build || true

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  whatsapp-bridge:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    env_file:
      - .env.production
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
    networks:
      - bridge-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - whatsapp-bridge
    networks:
      - bridge-network

networks:
  bridge-network:
    driver: bridge
```

### Load Balancing Configuration

#### Nginx Configuration
```nginx
# nginx.conf
upstream whatsapp_bridge {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location /webhook/whatsapp {
        proxy_pass http://whatsapp_bridge;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for voice processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /ws {
        proxy_pass http://whatsapp_bridge;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Integration Setup

### WhatsApp Business API Integration

#### 1. Webhook Configuration
```javascript
// src/webhooks/whatsapp.js
const express = require('express');
const crypto = require('crypto');

const router = express.Router();

// Webhook verification
router.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook message handler
router.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-hub-signature-256'];
    if (!verifySignature(req.body, signature)) {
      return res.sendStatus(403);
    }

    const { entry } = req.body;
    
    for (const changes of entry) {
      for (const change of changes.changes) {
        if (change.field === 'messages') {
          await handleWhatsAppMessage(change.value);
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error);
    res.sendStatus(500);
  }
});

module.exports = router;
```

#### 2. Voice Message Processing
```javascript
// src/services/whatsappVoiceHandler.js
const fetch = require('node-fetch');
const FormData = require('form-data');

class WhatsAppVoiceHandler {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  async handleVoiceMessage(message) {
    try {
      // Download voice message from WhatsApp
      const audioBuffer = await this.downloadVoiceMessage(message.audio.id);
      
      // Convert to format suitable for ElevenLabs
      const convertedAudio = await this.convertAudioFormat(audioBuffer);
      
      // Start ElevenLabs conversation
      const conversationId = await this.startElevenLabsConversation(
        message.from,
        convertedAudio
      );
      
      return conversationId;
    } catch (error) {
      console.error('Error handling voice message:', error);
      throw error;
    }
  }

  async downloadVoiceMessage(mediaId) {
    // Get media URL
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      }
    );

    const mediaData = await mediaResponse.json();
    
    // Download actual media file
    const audioResponse = await fetch(mediaData.url, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    return await audioResponse.buffer();
  }

  async convertAudioFormat(audioBuffer) {
    // Convert OGG/Opus to PCM 16kHz mono
    // Implementation depends on chosen audio processing library
    // Example using ffmpeg-static or node-ffmpeg
    const ffmpeg = require('fluent-ffmpeg');
    
    return new Promise((resolve, reject) => {
      const outputBuffer = [];
      
      ffmpeg(audioBuffer)
        .audioCodec('pcm_s16le')
        .audioFrequency(16000)
        .audioChannels(1)
        .format('s16le')
        .on('end', () => resolve(Buffer.concat(outputBuffer)))
        .on('error', reject)
        .pipe()
        .on('data', chunk => outputBuffer.push(chunk));
    });
  }
}

module.exports = WhatsAppVoiceHandler;
```

### ElevenLabs Conversation Integration

#### 1. WebSocket Connection Manager
```javascript
// src/services/elevenLabsConnection.js
const WebSocket = require('ws');
const EventEmitter = require('events');

class ElevenLabsConnection extends EventEmitter {
  constructor(apiKey, agentId) {
    super();
    this.apiKey = apiKey;
    this.agentId = agentId;
    this.ws = null;
    this.conversationId = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect() {
    try {
      // Get signed URL for conversation
      const signedUrl = await this.getSignedUrl();
      
      this.ws = new WebSocket(signedUrl);
      
      this.ws.on('open', () => {
        console.log('ElevenLabs WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
        
        // Send initial configuration
        this.sendInitialConfig();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(JSON.parse(data.toString()));
      });

      this.ws.on('close', () => {
        console.log('ElevenLabs WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnection();
      });

      this.ws.on('error', (error) => {
        console.error('ElevenLabs WebSocket error:', error);
        this.emit('error', error);
      });

    } catch (error) {
      console.error('Failed to connect to ElevenLabs:', error);
      throw error;
    }
  }

  async getSignedUrl() {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${this.agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': this.apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.signed_url;
  }

  sendInitialConfig() {
    const config = {
      type: 'conversation_initiation_client_data',
      conversation_initiation_client_data: {
        custom_llm_extra_body: {},
        user_info: {
          id: `whatsapp_${Date.now()}`,
          name: 'WhatsApp User'
        }
      }
    };

    this.ws.send(JSON.stringify(config));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'conversation_initiation_metadata':
        this.conversationId = message.conversation_initiation_metadata_event.conversation_id;
        this.emit('conversation_started', this.conversationId);
        break;

      case 'audio':
        if (message.audio_event?.audio_base_64) {
          this.emit('audio_response', message.audio_event.audio_base_64);
        }
        break;

      case 'user_transcript':
        this.emit('user_transcript', message.user_transcription_event);
        break;

      case 'agent_response':
        this.emit('agent_response', message.agent_response_event);
        break;

      case 'interruption':
        this.emit('interruption');
        break;

      case 'ping':
        // Respond to ping
        if (message.ping_event?.event_id) {
          this.ws.send(JSON.stringify({
            type: 'pong',
            event_id: message.ping_event.event_id
          }));
        }
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  sendAudio(audioBase64) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        user_audio_chunk: audioBase64
      }));
    }
  }

  attemptReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, 5000 * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('max_reconnects_reached');
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = ElevenLabsConnection;
```

#### 2. Session Management
```javascript
// src/services/sessionManager.js
const ElevenLabsConnection = require('./elevenLabsConnection');
const WhatsAppVoiceHandler = require('./whatsappVoiceHandler');

class SessionManager {
  constructor() {
    this.activeSessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  async createSession(whatsappUserId, messageData) {
    try {
      // Check if session already exists
      if (this.activeSessions.has(whatsappUserId)) {
        console.log(`Session already exists for user ${whatsappUserId}`);
        return this.activeSessions.get(whatsappUserId);
      }

      // Create new ElevenLabs connection
      const elevenLabsConnection = new ElevenLabsConnection(
        process.env.ELEVENLABS_API_KEY,
        process.env.ELEVENLABS_AGENT_ID
      );

      // Create WhatsApp handler
      const whatsappHandler = new WhatsAppVoiceHandler();

      // Create session object
      const session = {
        id: `session_${whatsappUserId}_${Date.now()}`,
        whatsappUserId,
        elevenLabsConnection,
        whatsappHandler,
        createdAt: new Date(),
        lastActivity: new Date(),
        isActive: true
      };

      // Set up event handlers
      this.setupSessionEvents(session);

      // Connect to ElevenLabs
      await elevenLabsConnection.connect();

      // Store session
      this.activeSessions.set(whatsappUserId, session);

      // Set cleanup timeout
      this.setSessionTimeout(session);

      console.log(`Created session ${session.id} for user ${whatsappUserId}`);
      return session;

    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  setupSessionEvents(session) {
    const { elevenLabsConnection, whatsappHandler, whatsappUserId } = session;

    // Handle audio responses from ElevenLabs
    elevenLabsConnection.on('audio_response', async (audioBase64) => {
      try {
        // Convert audio format for WhatsApp
        const whatsappAudio = await this.convertAudioForWhatsApp(audioBase64);
        
        // Send voice message back to WhatsApp user
        await whatsappHandler.sendVoiceMessage(whatsappUserId, whatsappAudio);
        
        // Update session activity
        session.lastActivity = new Date();
      } catch (error) {
        console.error('Error sending audio response:', error);
      }
    });

    // Handle conversation events
    elevenLabsConnection.on('conversation_started', (conversationId) => {
      session.conversationId = conversationId;
      console.log(`Conversation ${conversationId} started for session ${session.id}`);
    });

    elevenLabsConnection.on('user_transcript', (transcript) => {
      console.log(`User transcript in session ${session.id}:`, transcript.user_transcript);
      session.lastActivity = new Date();
    });

    elevenLabsConnection.on('agent_response', (response) => {
      console.log(`Agent response in session ${session.id}:`, response.agent_response);
      session.lastActivity = new Date();
    });

    // Handle connection errors
    elevenLabsConnection.on('error', (error) => {
      console.error(`ElevenLabs error in session ${session.id}:`, error);
      this.endSession(whatsappUserId, 'connection_error');
    });

    elevenLabsConnection.on('max_reconnects_reached', () => {
      console.error(`Max reconnects reached for session ${session.id}`);
      this.endSession(whatsappUserId, 'connection_failed');
    });
  }

  async convertAudioForWhatsApp(audioBase64) {
    // Convert PCM audio from ElevenLabs to OGG/Opus for WhatsApp
    // Implementation depends on audio processing library choice
    const ffmpeg = require('fluent-ffmpeg');
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    return new Promise((resolve, reject) => {
      const outputBuffer = [];
      
      ffmpeg()
        .input(audioBuffer)
        .inputFormat('s16le')
        .audioCodec('libopus')
        .audioChannels(1)
        .audioFrequency(16000)
        .format('ogg')
        .on('end', () => resolve(Buffer.concat(outputBuffer)))
        .on('error', reject)
        .pipe()
        .on('data', chunk => outputBuffer.push(chunk));
    });
  }

  setSessionTimeout(session) {
    setTimeout(() => {
      const timeSinceLastActivity = Date.now() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity >= this.sessionTimeout) {
        console.log(`Session ${session.id} timed out`);
        this.endSession(session.whatsappUserId, 'timeout');
      } else {
        // Reset timeout for remaining time
        this.setSessionTimeout(session);
      }
    }, this.sessionTimeout);
  }

  getSession(whatsappUserId) {
    return this.activeSessions.get(whatsappUserId);
  }

  async endSession(whatsappUserId, reason = 'manual') {
    const session = this.activeSessions.get(whatsappUserId);
    
    if (session) {
      console.log(`Ending session ${session.id} for user ${whatsappUserId}, reason: ${reason}`);
      
      try {
        // Disconnect ElevenLabs connection
        session.elevenLabsConnection.disconnect();
        
        // Mark session as inactive
        session.isActive = false;
        session.endedAt = new Date();
        session.endReason = reason;
        
        // Remove from active sessions
        this.activeSessions.delete(whatsappUserId);
        
        // Log session metrics
        const duration = session.endedAt - session.createdAt;
        console.log(`Session ${session.id} ended after ${duration}ms`);
        
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  }

  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  getAllSessions() {
    return Array.from(this.activeSessions.values());
  }
}

module.exports = SessionManager;
```

---

*This document continues with sections 6-9. Due to length constraints, the remaining sections (Operational Procedures, Troubleshooting Guide, Testing and Validation, and Maintenance and Updates) would be provided in a separate file or continuation.*