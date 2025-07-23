# ElevenLabs Conversational AI Swift SDK

A Swift SDK for integrating ElevenLabs' conversational AI capabilities into your iOS and macOS applications. Built on top of LiveKit WebRTC for real-time audio streaming and communication.

## Installation

Add to your project using Swift Package Manager:

```swift
dependencies: [
    .package(url: "https://github.com/elevenlabs/elevenlabs-swift-sdk.git", from: "2.0.0")
]
```

## Requirements

- iOS 14.0+ / macOS 11.0+
- Swift 5.9+
- Add `NSMicrophoneUsageDescription` to your Info.plist

## Quick Start

```swift
import ElevenLabs

// 1. Start a conversation with your agent
let conversation = try await ElevenLabs.startConversation(
    agentId: "your-agent-id",
    config: ConversationConfig()
)

// 2. Observe conversation state and messages
conversation.$state
    .sink { state in
        print("Connection state: \(state)")
    }
    .store(in: &cancellables)

conversation.$messages
    .sink { messages in
        for message in messages {
            print("\(message.role): \(message.content)")
        }
    }
    .store(in: &cancellables)

// 3. Send messages and control the conversation
try await conversation.sendMessage("Hello!")
try await conversation.toggleMute()
await conversation.endConversation()
```

## Core Features

### Real-time Conversation Management

The SDK provides a streamlined `Conversation` class that handles all aspects of real-time communication:

```swift
@MainActor
class ConversationManager: ObservableObject {
    @Published var conversation: Conversation?
    private var cancellables = Set<AnyCancellable>()
    
    func startConversation(agentId: String) async throws {
        let config = ConversationConfig(
            conversationOverrides: ConversationOverrides(textOnly: false)
        )
        
        conversation = try await ElevenLabs.startConversation(
            agentId: agentId,
            config: config
        )
        
        setupObservers()
    }
    
    private func setupObservers() {
        guard let conversation else { return }
        
        // Monitor connection state
        conversation.$state
            .sink { state in print("State: \(state)") }
            .store(in: &cancellables)
            
        // Monitor messages
        conversation.$messages
            .sink { messages in print("Messages: \(messages.count)") }
            .store(in: &cancellables)
    }
}
```

### Client Tool Support

Handle tool calls from your agent with full parameter support:

```swift
private func handleToolCall(_ toolCall: ClientToolCallEvent) async {
    do {
        let parameters = try toolCall.getParameters()
        let result = await executeClientTool(
            name: toolCall.toolName,
            parameters: parameters
        )
        
        if toolCall.expectsResponse {
            try await conversation?.sendToolResult(
                for: toolCall.toolCallId,
                result: result
            )
        } else {
            conversation?.markToolCallCompleted(toolCall.toolCallId)
        }
    } catch {
        // Handle tool execution errors
        if toolCall.expectsResponse {
            try? await conversation?.sendToolResult(
                for: toolCall.toolCallId,
                result: ["error": error.localizedDescription],
                isError: true
            )
        }
    }
}
```

## Authentication

### Public Agents
```swift
let conversation = try await ElevenLabs.startConversation(
    agentId: "your-public-agent-id",
    config: ConversationConfig()
)
```

### Private Agents with Conversation Token
```swift
// Get token from your backend (never store API keys in your app)
let token = try await fetchConversationToken()
let conversation = try await ElevenLabs.startConversation(
    auth: .conversationToken(token),
    config: ConversationConfig()
)
```

## Voice and Text Modes

```swift
// Voice conversation (default)
let voiceConfig = ConversationConfig(
    conversationOverrides: ConversationOverrides(textOnly: false)
)

// Text-only conversation
let textConfig = ConversationConfig(
    conversationOverrides: ConversationOverrides(textOnly: true)
)
```

## Audio Controls

```swift
// Microphone control
try await conversation.toggleMute()
try await conversation.setMuted(true)

// Check microphone state
let isMuted = conversation.isMuted

// Access audio tracks for advanced use cases
let inputTrack = conversation.inputTrack
let agentAudioTrack = conversation.agentAudioTrack
```

## Architecture

The SDK is built with modern Swift patterns and reactive programming:

```
ElevenLabs (Main Module)
├── Conversation (Core conversation management)
├── ConnectionManager (LiveKit WebRTC integration)
├── DataChannelReceiver (Real-time message handling)
├── EventParser/EventSerializer (Protocol implementation)
├── TokenService (Authentication and connection details)
└── Dependencies (Dependency injection container)
```

### Key Components

- **Conversation**: Main class providing `@Published` properties for reactive UI updates
- **ConnectionManager**: Manages LiveKit room connections and audio streaming
- **DataChannelReceiver**: Handles incoming protocol events from ElevenLabs agents
- **EventParser/EventSerializer**: Handles protocol event parsing and serialization
- **ClientToolCallEvent**: Represents tool calls from agents with parameter extraction

## SwiftUI Integration

```swift
import SwiftUI
import ElevenLabs

struct ConversationView: View {
    @StateObject private var viewModel = ConversationViewModel()
    
    var body: some View {
        VStack {
            // Chat messages
            ScrollView {
                LazyVStack {
                    ForEach(viewModel.messages) { message in
                        MessageView(message: message)
                    }
                }
            }
            
            // Controls
            HStack {
                Button(viewModel.isConnected ? "End" : "Start") {
                    Task {
                        if viewModel.isConnected {
                            await viewModel.endConversation()
                        } else {
                            await viewModel.startConversation()
                        }
                    }
                }
                
                Button(viewModel.isMuted ? "Unmute" : "Mute") {
                    Task { await viewModel.toggleMute() }
                }
                .disabled(!viewModel.isConnected)
            }
        }
        .task {
            await viewModel.setup()
        }
    }
}

@MainActor
class ConversationViewModel: ObservableObject {
    @Published var messages: [Message] = []
    @Published var isConnected = false
    @Published var isMuted = false
    
    private var conversation: Conversation?
    private var cancellables = Set<AnyCancellable>()
    
    func startConversation() async {
        do {
            conversation = try await ElevenLabs.startConversation(
                agentId: "your-agent-id",
                config: ConversationConfig()
            )
            setupObservers()
        } catch {
            print("Failed to start conversation: \(error)")
        }
    }
    
    private func setupObservers() {
        guard let conversation else { return }
        
        conversation.$messages
            .assign(to: &$messages)
            
        conversation.$state
            .map { $0.isActive }
            .assign(to: &$isConnected)
            
        conversation.$isMuted
            .assign(to: &$isMuted)
    }
}
```

## Advanced Usage

### Connection State Management

```swift
conversation.$state
    .sink { state in
        switch state {
        case .idle:
            // Not connected
            break
        case .connecting:
            // Show connecting indicator
            break
        case .active(let callInfo):
            // Connected to agent: \(callInfo.agentId)
            break
        case .ended(let reason):
            // Handle disconnection: \(reason)
            break
        case .error(let error):
            // Handle error: \(error)
            break
        }
    }
    .store(in: &cancellables)
```

### Agent State Monitoring

```swift
conversation.$agentState
    .sink { state in
        switch state {
        case .listening:
            // Agent is listening, show listening indicator
            break
        case .speaking:
            // Agent is speaking, show speaking indicator
            break
        }
    }
    .store(in: &cancellables)
```