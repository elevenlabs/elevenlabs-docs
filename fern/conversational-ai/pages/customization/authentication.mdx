---
title: Authentication
subtitle: Learn how to secure access to your conversational AI agents
---

## Overview

When building conversational AI agents, you may need to restrict access to certain agents or conversations. ElevenLabs provides multiple authentication mechanisms to ensure only authorized users can interact with your agents.

## Authentication methods

ElevenLabs offers two primary methods to secure your conversational AI agents:

<CardGroup cols={2}>
  <Card title="Signed URLs" icon="signature" href="#using-signed-urls">
    Generate temporary authenticated URLs for secure client-side connections without exposing API
    keys.
  </Card>
  <Card title="Allowlists" icon="list-check" href="#using-allowlists">
    Restrict access to specific domains or hostnames that can connect to your agent.
  </Card>
</CardGroup>

## Using signed URLs

Signed URLs are the recommended approach for client-side applications. This method allows you to authenticate users without exposing your API key.

<Note>
  The guides below uses the [JS client](https://www.npmjs.com/package/@elevenlabs/client) and
  [Python SDK](https://github.com/elevenlabs/elevenlabs-python/).
</Note>

### How signed URLs work

1. Your server requests a signed URL from ElevenLabs using your API key.
2. ElevenLabs generates a temporary token and returns a signed WebSocket URL.
3. Your client application uses this signed URL to establish a WebSocket connection.
4. The signed URL expires after 15 minutes.

<Warning>Never expose your ElevenLabs API key client-side.</Warning>

### Generate a signed URL via the API

To obtain a signed URL, make a request to the `get_signed_url` [endpoint](/docs/conversational-ai/api-reference/conversations/get-signed-url) with your agent ID:

<CodeBlocks>
```python
# Server-side code using the Python SDK
from elevenlabs.client import ElevenLabs
async def get_signed_url():
    try:
        elevenlabs = ElevenLabs(api_key="your-api-key")
        response = await elevenlabs.conversational_ai.conversations.get_signed_url(agent_id="your-agent-id")
        return response.signed_url
    except Exception as error:
        print(f"Error getting signed URL: {error}")
        raise
```

```javascript
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

// Server-side code using the JavaScript SDK
const elevenlabs = new ElevenLabsClient({ apiKey: 'your-api-key' });
async function getSignedUrl() {
  try {
    const response = await elevenlabs.conversationalAi.conversations.getSignedUrl({
      agentId: 'your-agent-id',
    });

    return response.signed_url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}
```

```bash
curl -X GET "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=your-agent-id" \
-H "xi-api-key: your-api-key"
```

</CodeBlocks>

The curl response has the following format:

```json
{
  "signed_url": "wss://api.elevenlabs.io/v1/convai/conversation?agent_id=your-agent-id&conversation_signature=your-token"
}
```

### Connecting to your agent using a signed URL

Retrieve the server generated signed URL from the client and use the signed URL to connect to the websocket.

<CodeBlocks>

```python
# Client-side code using the Python SDK
from elevenlabs.conversational_ai.conversation import (
    Conversation,
    AudioInterface,
    ClientTools,
    ConversationInitiationData
)
import os
from elevenlabs.client import ElevenLabs
api_key = os.getenv("ELEVENLABS_API_KEY")

elevenlabs = ElevenLabs(api_key=api_key)

conversation = Conversation(
  client=elevenlabs,
  agent_id=os.getenv("AGENT_ID"),
  requires_auth=True,
  audio_interface=AudioInterface(),
  config=ConversationInitiationData()
)

async def start_conversation():
  try:
    signed_url = await get_signed_url()
    conversation = Conversation(
      client=elevenlabs,
      url=signed_url,
    )

    conversation.start_session()
  except Exception as error:
    print(f"Failed to start conversation: {error}")

```

```javascript
// Client-side code using the JavaScript SDK
import { Conversation } from '@elevenlabs/client';

async function startConversation() {
  try {
    const signedUrl = await getSignedUrl();
    const conversation = await Conversation.startSession({
      signedUrl,
    });

    return conversation;
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
}
```

</CodeBlocks>

### Signed URL expiration

Signed URLs are valid for 15 minutes. The conversation session can last longer, but the conversation must be initiated within the 15 minute window.

## Using allowlists

Allowlists provide a way to restrict access to your conversational AI agents based on the origin domain. This ensures that only requests from approved domains can connect to your agent.

### How allowlists work

1. You configure a list of approved hostnames for your agent.
2. When a client attempts to connect, ElevenLabs checks if the request's origin matches an allowed hostname.
3. If the origin is on the allowlist, the connection is permitted; otherwise, it's rejected.

### Configuring allowlists

Allowlists are configured as part of your agent's authentication settings. You can specify up to 10 unique hostnames that are allowed to connect to your agent.

### Example: setting up an allowlist

<CodeBlocks>

```python
from elevenlabs.client import ElevenLabs
import os
from elevenlabs.types import *

api_key = os.getenv("ELEVENLABS_API_KEY")
elevenlabs = ElevenLabs(api_key=api_key)

agent = elevenlabs.conversational_ai.agents.create(
  conversation_config=ConversationalConfig(
    agent=AgentConfig(
      first_message="Hi. I'm an authenticated agent.",
    )
  ),
  platform_settings=AgentPlatformSettingsRequestModel(
  auth=AuthSettings(
    enable_auth=False,
    allowlist=[
      AllowlistItem(hostname="example.com"),
      AllowlistItem(hostname="app.example.com"),
      AllowlistItem(hostname="localhost:3000")
      ]
    )
  )
)
```

```javascript
async function createAuthenticatedAgent(client) {
  try {
    const agent = await elevenlabs.conversationalAi.agents.create({
      conversationConfig: {
        agent: {
          firstMessage: "Hi. I'm an authenticated agent.",
        },
      },
      platformSettings: {
        auth: {
          enableAuth: false,
          allowlist: [
            { hostname: 'example.com' },
            { hostname: 'app.example.com' },
            { hostname: 'localhost:3000' },
          ],
        },
      },
    });

    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}
```

</CodeBlocks>

## Combining authentication methods

For maximum security, you can combine both authentication methods:

1. Use `enable_auth` to require signed URLs.
2. Configure an allowlist to restrict which domains can request those signed URLs.

This creates a two-layer authentication system where clients must:

- Connect from an approved domain
- Possess a valid signed URL

<CodeBlocks>

```python
from elevenlabs.client import ElevenLabs
import os
from elevenlabs.types import *
api_key = os.getenv("ELEVENLABS_API_KEY")
elevenlabs = ElevenLabs(api_key=api_key)
agent = elevenlabs.conversational_ai.agents.create(
  conversation_config=ConversationalConfig(
    agent=AgentConfig(
      first_message="Hi. I'm an authenticated agent that can only be called from certain domains.",
    )
  ),
platform_settings=AgentPlatformSettingsRequestModel(
  auth=AuthSettings(
    enable_auth=True,
    allowlist=[
      AllowlistItem(hostname="example.com"),
      AllowlistItem(hostname="app.example.com"),
      AllowlistItem(hostname="localhost:3000")
    ]
  )
)
```

```javascript
async function createAuthenticatedAgent(elevenlabs) {
  try {
    const agent = await elevenlabs.conversationalAi.agents.create({
      conversationConfig: {
        agent: {
          firstMessage: "Hi. I'm an authenticated agent.",
        },
      },
      platformSettings: {
        auth: {
          enableAuth: true,
          allowlist: [
            { hostname: 'example.com' },
            { hostname: 'app.example.com' },
            { hostname: 'localhost:3000' },
          ],
        },
      },
    });

    return agent;
  } catch (error) {
    console.error('Error creating agent:', error);
    throw error;
  }
}
```

</CodeBlocks>

## FAQ

<AccordionGroup>
  <Accordion title="Can I use the same signed URL for multiple users?">
    This is possible but we recommend generating a new signed URL for each user session.
  </Accordion>
  <Accordion title="What happens if the signed URL expires during a conversation?">
    If the signed URL expires (after 15 minutes), any WebSocket connection created with that signed
    url will **not** be closed, but trying to create a new connection with that signed URL will
    fail.
  </Accordion>
  <Accordion title="Can I restrict access to specific users?">
    The signed URL mechanism only verifies that the request came from an authorized source. To
    restrict access to specific users, implement user authentication in your application before
    requesting the signed URL.
  </Accordion>
  <Accordion title="Is there a limit to how many signed URLs I can generate?">
    There is no specific limit on the number of signed URLs you can generate.
  </Accordion>
  <Accordion title="How do allowlists handle subdomains?">
    Allowlists perform exact matching on hostnames. If you want to allow both a domain and its
    subdomains, you need to add each one separately (e.g., "example.com" and "app.example.com").
  </Accordion>
  <Accordion title="Do I need to use both authentication methods?">
    No, you can use either signed URLs or allowlists independently based on your security
    requirements. For highest security, we recommend using both.
  </Accordion>
  <Accordion title="What other security measures should I implement?">
    Beyond signed URLs and allowlists, consider implementing:

    - User authentication before requesting signed URLs
    - Rate limiting on API requests
    - Usage monitoring for suspicious patterns
    - Proper error handling for auth failures

  </Accordion>
</AccordionGroup>
