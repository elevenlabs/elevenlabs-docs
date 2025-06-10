---
title: Burst pricing
subtitle: Optimize call capacity with burst concurrency to handle traffic spikes.
---

## Overview

Burst pricing allows your conversational AI agents to temporarily exceed your workspace's subscription concurrency limit during high-demand periods. When enabled, your agents can handle up to 3 times your normal concurrency limit, with excess calls charged at double the standard rate.

This feature helps prevent missed calls during traffic spikes while maintaining cost predictability for your regular usage patterns.

## How burst pricing works

When burst pricing is enabled for an agent:

1. **Normal capacity**: Calls within your subscription limit are charged at standard rates
2. **Burst capacity**: Additional calls (up to 3x your limit or 300 concurrent calls, whichever is lower) are accepted but charged at 2x the normal rate
3. **Over-capacity rejection**: Calls exceeding the burst limit are rejected with an error

### Capacity calculations

| Subscription limit | Burst capacity | Maximum concurrent calls |
| ------------------ | -------------- | ------------------------ |
| 10 calls           | 30 calls       | 30 calls                 |
| 50 calls           | 150 calls      | 150 calls                |
| 100 calls          | 300 calls      | 300 calls                |
| 200 calls          | 300 calls      | 300 calls (capped)       |

<Note>Burst capacity is capped at 300 concurrent calls regardless of your subscription limit.</Note>

## Cost implications

Burst pricing follows a tiered charging model:

- **Within subscription limit**: Standard per-minute rates apply
- **Burst calls**: Charged at 2x the standard rate
- **Deprioritized processing**: Burst calls receive lower priority for speech-to-text and text-to-speech processing

### Example pricing scenario

For a workspace with a 20-call subscription limit:

- Calls 1-20: Standard rate (e.g., $0.08/minute)
- Calls 21-60: Double rate (e.g., $0.16/minute)
- Calls 61+: Rejected

<Warning>
  Burst calls are deprioritized and may experience higher latency for speech processing, similar to
  anonymous-tier requests.
</Warning>

## Configuration

Burst pricing is configured per agent in the call limits settings.

### Dashboard configuration

1. Navigate to your agent settings
2. Go to the **Call Limits** section
3. Enable the **Burst pricing** toggle
4. Save your agent configuration

### API configuration

Burst pricing can be configured via the API, as shown in the examples below

<CodeBlocks>

```python title="Python"
from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
import os

load_dotenv()

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

# Update agent with burst pricing enabled
response = elevenlabs.conversational_ai.agents.update(
    agent_id="your-agent-id",
    agent_config={
        "platform_settings": {
            "call_limits": {
                "agent_concurrency_limit": -1,  # Use workspace limit
                "daily_limit": 1000,
                "bursting_enabled": True
            }
        }
    }
)
```

```javascript title="JavaScript"
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';

const elevenlabs = new ElevenLabsClient();

// Configure agent with burst pricing enabled
const updatedConfig = {
  platformSettings: {
    callLimits: {
      agentConcurrencyLimit: -1, // Use workspace limit
      dailyLimit: 1000,
      burstingEnabled: true,
    },
  },
};

// Update the agent configuration
const response = await elevenlabs.conversationalAi.agents.update('your-agent-id', updatedConfig);
```

</CodeBlocks>
