---
title: React SDK
subtitle: 'Conversational AI SDK: deploy customized, interactive voice agents in minutes.'
---

<Info>
  Refer to the [Conversational AI overview](/docs/conversational-ai/overview) for an explanation of
  how Conversational AI works.
</Info>

## Installation

Install the package in your project through package manager.

```shell
npm install @elevenlabs/react
# or
yarn add @elevenlabs/react
# or
pnpm install @elevenlabs/react
```

## Usage

### useConversation

A React hook for managing connection and audio usage for ElevenLabs Conversational AI.

#### Initialize conversation

First, initialize the Conversation instance.

```tsx
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation();
```

Note that Conversational AI requires microphone access. Consider explaining and allowing access in your app's UI before the Conversation starts.

```js
// call after explaining to the user why the microphone access is needed
await navigator.mediaDevices.getUserMedia({ audio: true });
```

#### Options

The Conversation can be initialized with certain options

```tsx
const conversation = useConversation({
  /* options object */
});
```

- **onConnect** - handler called when the conversation websocket connection is established.
- **onDisconnect** - handler called when the conversation websocket connection is ended.
- **onMessage** - handler called when a new message is received. These can be tentative or final transcriptions of user voice, replies produced by LLM, or debug message when a debug option is enabled.
- **onError** - handler called when a error is encountered.

#### Methods

##### startSession

The `startConversation` method kicks off the WebSocket or WebRTC connection and starts using the microphone to communicate with the ElevenLabs Conversational AI agent. The method accepts an options object, with the `signedUrl`, `conversationToken` or `agentId` option being required.

The Agent ID can be acquired through [ElevenLabs UI](https://elevenlabs.io/app/conversational-ai).

We also recommended passing in your own end user IDs to map conversations to your users.

```js
const conversation = useConversation();

// For public agents, pass in the agent ID and the connection type
const conversationId = await conversation.startSession({
  agentId: '<your-agent-id>',
  connectionType: 'webrtc', // either "webrtc" or "websocket"
  user_id: '<your-end-user-id>', // optional field
});
```

For public agents (i.e. agents that don't have authentication enabled), only the `agentId` is required.

In case the conversation requires authorization, use the REST API to generate signed links for a WebSocket connection or a conversation token for a WebRTC connection.

`startSession` returns a promise resolving a `conversationId`. The value is a globally unique conversation ID you can use to identify separate conversations.

<Tabs>
  <Tab title="WebSocket connection">
    ```js maxLines=0
    // Node.js server

    app.get("/signed-url", yourAuthMiddleware, async (req, res) => {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${process.env.AGENT_ID}`,
        {
          headers: {
            // Requesting a signed url requires your ElevenLabs API key
            // Do NOT expose your API key to the client!
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        return res.status(500).send("Failed to get signed URL");
      }

      const body = await response.json();
      res.send(body.signed_url);
    });
    ```

    ```js
    // Client

    const response = await fetch("/signed-url", yourAuthHeaders);
    const signedUrl = await response.text();

    const conversation = await Conversation.startSession({
      signedUrl,
      connectionType: "websocket",
    });
    ```

  </Tab>
  <Tab title="WebRTC connection">
    ```js maxLines=0
    // Node.js server

    app.get("/conversation-token", yourAuthMiddleware, async (req, res) => {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${process.env.AGENT_ID}`,
        {
          headers: {
            // Requesting a conversation token requires your ElevenLabs API key
            // Do NOT expose your API key to the client!
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          }
        }
      );

      if (!response.ok) {
        return res.status(500).send("Failed to get conversation token");
      }

      const body = await response.json();
      res.send(body.token);
    );
    ```

    ```js
    // Client

    const response = await fetch("/conversation-token", yourAuthHeaders);
    const conversationToken = await response.text();

    const conversation = await Conversation.startSession({
      conversationToken,
      connectionType: "webrtc",
    });
    ```

  </Tab>
</Tabs>

##### endSession

A method to manually end the conversation. The method will disconnect and end the conversation.

```js
await conversation.endSession();
```

##### setVolume

Sets the output volume of the conversation. Accepts an object with a `volume` field between 0 and 1.

```js
await conversation.setVolume({ volume: 0.5 });
```

##### status

A React state containing the current status of the conversation.

```js
const { status } = useConversation();
console.log(status); // "connected" or "disconnected"
```

##### isSpeaking

A React state containing information on whether the agent is currently speaking. This is useful for indicating agent status in your UI.

```js
const { isSpeaking } = useConversation();
console.log(isSpeaking); // boolean
```
