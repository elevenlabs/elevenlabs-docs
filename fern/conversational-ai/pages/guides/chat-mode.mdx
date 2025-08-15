---
title: Chat Mode
subtitle: Configure your agent for text-only conversations with chat mode
---

<Info>
  Chat mode allows your agents to act as chat agents, ie to have text-only conversations without
  audio input/output. This is useful for building chat interfaces, testing agents, or when audio is
  not required.
</Info>

## Overview

When your agent is configured for chat mode or when you want to enforce text-only conversations programmatically, you can use the SDKs with specific configuration options. This guide covers how to implement chat mode across different SDKs.

## JavaScript SDK

### Text-Only Configuration

To use the JavaScript SDK in chat mode with text-only conversations, add the `textOnly` override to your conversation configuration:

```javascript
const conversation = await Conversation.startSession({
  agentId: '<your-agent-id>',
  conversation: {
    textOnly: true,
  },
});
```

This configuration ensures that:

- No audio input/output is used
- All communication happens through text messages
- The conversation operates in a chat-like interface mode

## Python SDK

### Text-Only Configuration

For the Python SDK, configure the conversation for text-only mode:

```python
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation

elevenlabs = ElevenLabs(api_key=api_key)

conversation = Conversation(
    elevenlabs,
    agent_id,
    requires_auth=bool(api_key),
    # Configure for text-only mode
    conversation_overrides={
        "textOnly": True
    },
    # Important: Ensure agent_response callback is set
    callback_agent_response=lambda response: print(f"Agent: {response}"),
    callback_user_transcript=lambda transcript: print(f"User: {transcript}"),
)

conversation.start_session()
```

## Important Notes

<Warning>
  **Critical**: When using chat mode, you must ensure the `agent_response` event/callback is
  activated and properly configured. Without this, the agent's text responses will not be sent or
  displayed to the user.
</Warning>

### Key Requirements

1. **Agent Response Event**: Always configure the `agent_response` callback or event handler to receive and display the agent's text messages.

2. **Agent Configuration**: If your agent is specifically set to chat mode in the agent settings, it will automatically use text-only conversations without requiring the override.

3. **No Audio Interface**: When using text-only mode, you don't need to configure audio interfaces or request microphone permissions.

### Example: Handling Agent Responses

<Tabs>
  <Tab title="JavaScript">
  ```javascript
  const conversation = await Conversation.startSession({
    agentId: '<your-agent-id>',
    overrides: {
      conversation: {
        textOnly: true,
      },
    },
    // Critical: Handle agent responses
    onMessage: (message) => {
      if (message.type === 'agent_response') {
        console.log('Agent:', message.text);
        // Display in your UI
        displayAgentMessage(message.text);
      }
    },
  });
  ```
  </Tab>
  <Tab title="Python">
  ```python
  def handle_agent_response(response):
      """Critical handler for displaying agent messages"""
      print(f"Agent: {response}")  # Update your UI with the response
      update_chat_ui(response)

  conversation = Conversation(
    elevenlabs,
    agent_id,
    conversation_overrides={"conversation": {"textOnly": True}},
    callback_agent_response=handle_agent_response,
  )

  conversation.start_session()

```
</Tab>
</Tabs>

## Sending Text Messages

In chat mode, you'll need to send user messages programmatically instead of through audio:

<Tabs>

  <Tab title="JavaScript">
  ```javascript
  // Send a text message to the agent
  conversation.sendUserMessage({
    text: 'Hello, how can you help me today?',
  });
  ```
  </Tab>

  <Tab title="Python">
  ```python
  # Send a text message to the agent
  conversation.send_user_message("Hello, how can you help me today?")
  ```
  </Tab>

</Tabs>

## Use Cases

Chat mode is ideal for:

- **Chat Interfaces**: Building traditional chat UIs without voice
- **Testing**: Testing agent logic without audio dependencies
- **Accessibility**: Providing text-based alternatives for users
- **Silent Environments**: When audio input/output is not appropriate
- **Integration Testing**: Automated testing of agent conversations

## Troubleshooting

### Agent Not Responding

If the agent's responses are not appearing:

1. Verify the `agent_response` callback is properly configured
2. Check that the agent is configured for chat mode or the `textOnly` override is set
3. Ensure the WebSocket connection is established successfully

## Next Steps

- Learn about [customizing agent behavior](/docs/conversational-ai/customization/llm)
- Explore [client events](/docs/conversational-ai/customization/events/client-events) for advanced interactions
- See [authentication setup](/docs/conversational-ai/customization/authentication) for secure conversations
