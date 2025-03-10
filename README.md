<div align="center">
  <h1>EE Chat</h1>
  <p>🚀 Powerful locally deployed AI chat application</p>

  <p>
    <a href="#features">Features</a> •
    <a href="#local-deployment">Local Deployment</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#contribution">Contribution</a> •
    <a href="#license">License</a>
  </p>
  
  <img src="./resources/chat.png" alt="EE Chat Application Screenshot" width="800" />
</div>

## Features

EE Chat is an AI chat application focused on local deployment, providing users with secure, private, and efficient AI conversation experiences.

### 🔒 Fully Local Deployment

- **Data Privacy Protection**: All conversation data is stored locally, eliminating privacy concerns
- **Offline Usage**: Once configured, continuous internet connection is not required
- **Custom API**: Connect to your own AI model API or third-party services

### 💬 Powerful Conversation Features

- **Multi-Session Management**: Easily create and manage multiple independent conversations
- **History Records**: Automatically save all conversation history, view and continue previous conversations anytime
- **Markdown Support**: Perfect rendering of Markdown format, including code blocks, tables, and mathematical formulas
- **Code Highlighting**: Automatically identify and highlight code blocks, supporting multiple programming languages

### 🎨 Personalized Experience

- **Theme Switching**: Built-in light and dark themes to meet different usage scenarios
- **Custom Prompts**: Save and manage frequently used prompts to improve conversation efficiency
- **Model Parameter Adjustment**: Flexibly adjust temperature, maximum output, and other parameters for optimal responses

### 🔌 Extensibility

- **Plugin System**: Support for extended functionality to meet specific scenario requirements
- **API Integration**: Easily integrate various AI model APIs, such as OpenAI, Anthropic, etc.
- **Custom Models**: Configure and use custom local or remote AI models

## Local Deployment

EE Chat is designed for local deployment, ensuring your data security and user experience.

### System Requirements

- Windows 10/11 64-bit
- macOS 10.15+
- Linux (Ubuntu 18.04+, Debian 10+)
- At least 4GB RAM
- 500MB available disk space

### Installation Methods

#### Download Pre-built Packages

Download the installation package suitable for your system from the [release page](https://github.com/yourusername/chater/releases):

- Windows: `EEChat-Setup-x.x.x.exe`
- macOS: `EEChat-x.x.x.dmg`
- Linux: `EEChat-x.x.x.AppImage` or `.deb`

#### Build from Source

```bash
# Clone repository
git clone https://github.com/yourusername/chater.git
cd chater

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build application
npm run build