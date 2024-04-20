
# WhatsApp-OpenAI Chatbot Integration

## Overview

This project is a TypeScript-based application that integrates WhatsApp messaging with OpenAI's API to enable intelligent conversational capabilities. The application allows users to interact with an AI-driven chatbot directly through WhatsApp, leveraging the advanced natural language understanding provided by OpenAI.

## Features

-   **WhatsApp Integration**: Users can send and receive messages via WhatsApp to communicate with the chatbot.
-   **OpenAI API**: Incorporates OpenAI's powerful language models to process and respond to user queries with relevant and contextually aware answers.
-   **Command Prefixes**: Utilizes specific command prefixes to trigger different types of responses:
    -   `!t`: Handle text-based commands.
    -   `!i`: Handle image-related requests.
    -   `!a`: Handle audio messages.
    -   `!tta`: Convert text to audio.

## Branches

The project repository contains two main branches catering to different storage and search functionalities:

-   **`main`**: This branch includes functionality to store chat histories in a JSON file. It provides a simple way to log conversations and retrieve them for analysis or review.
    
-   **`elasticsearch-embeddings`**: Integrates Elasticsearch to store and search through conversation using embeddings. This branch is ideal for implementing advanced search capabilities and analytics.
    

## Getting Started

### Prerequisites

-   Node.js and npm installed
-   A WhatsApp account and the necessary API keys for integration
-   Access to OpenAI API
-   Elasticsearch setup (for the `elasticsearch-embeddings` branch)

### Installation

1.  Clone the repository:

    `git  clone  https://github.com/yourusername/whatsapp-openai-chatbot.git  cd  whatsapp-openai-chatbot`
    
3.  Switch to the desired branch:    

    `git checkout json-history  # For JSON storage  # or  git checkout elasticsearch-embeddings  # For Elasticsearch integration`
    
4.  Install dependencies:
    
    `npm install`
    
5.  Configure environment variables:
    
    -   Create a `.env` file in the root directory.
    -   Add the necessary configuration for WhatsApp API and OpenAI API keys.
6.  Run the application:
    
    `npm start`
    

## Usage

### Connecting to WhatsApp

To begin interacting with the chatbot, you need to connect your WhatsApp account by scanning a QR Code:

1.  Upon starting the application, a QR Code will be displayed in the terminal or command prompt.
2.  Open WhatsApp on your mobile device.
3.  Navigate to 'Settings' > 'Linked Devices' > 'Link a Device'.
4.  Scan the QR Code displayed by the application.
5.  Once scanned, your WhatsApp will be connected to the chatbot, and you can start sending commands using the designated prefixes.

### Command Prefixes

To interact with the chatbot via WhatsApp, users must start their messages with one of the following command prefixes:

-   `!t`: For sending text commands to the chatbot.
-   `!i`: For requesting images from the chatbot.
-   `!a`: For sending audio clips to the chatbot.
-   `!tta`: For converting text input into audio responses.

These prefixes help the bot to understand the type of request being made and respond appropriately.
