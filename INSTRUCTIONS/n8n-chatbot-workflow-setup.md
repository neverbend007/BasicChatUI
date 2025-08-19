# N8N Chatbot Workflow Setup Guide

This comprehensive guide explains how to set up and configure the N8N ChatBot workflow that acts as a secure gateway between your chat application and OpenAI Assistant. The workflow provides user authorization, conversation memory, and clean API integration.

## What You'll Need

- An N8N account (free tier available)
- A Google account for Google Sheets integration
- An OpenAI account with API access (see [OpenAI Assistant Setup Guide](./openai-assistant-setup.md))
- About 60-90 minutes to complete the setup

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Node-by-Node Breakdown](#node-by-node-breakdown)
3. [Prerequisites Setup](#prerequisites-setup)
4. [Google Sheets Authorization Setup](#google-sheets-authorization-setup)
5. [OpenAI Integration Setup](#openai-integration-setup)
6. [N8N Workflow Configuration](#n8n-workflow-configuration)
7. [Testing and Deployment](#testing-and-deployment)
8. [Troubleshooting](#troubleshooting)

## Workflow Overview

### What This Workflow Does

This N8N workflow creates a secure chatbot system with the following features:

- **User Authorization**: Only approved users (listed in Google Sheets) can access the chatbot
- **Conversation Memory**: Each user maintains their own chat history using their email as a session key
- **OpenAI Integration**: Routes authorized requests to your OpenAI Assistant
- **Clean Response Handling**: Processes and returns structured responses to your chat application

### Workflow Flow Diagram

```
Incoming Webhook Request
         ↓
   Check Google Sheets (User Authorization)
         ↓
    [Is User Authorized?]
         ├─ NO → Send "Not Authorized" Response
         ├─ YES → Continue to OpenAI Assistant
                    ↓
            Send Message to Assistant (with Memory)
                    ↓
            Process & Clean Response
                    ↓
            Return Response to Chat App
```

## Node-by-Node Breakdown

### 1. Webhook Node (Entry Point)
- **Purpose**: Receives incoming requests from your chat application
- **Type**: `n8n-nodes-base.webhook`
- **Configuration**: 
  - HTTP Method: POST
  - Path: `7365a5cd-d9f3-4050-9c27-ec382d77b6e6` (unique identifier)
- **Expected Input**: 
  ```json
  {
    "message": "User's chat message",
    "userEmail": "user@example.com"
  }
  ```
- **Output**: Passes the entire webhook payload to the next node

### 2. CheckAuthList Node (Google Sheets Lookup)
- **Purpose**: Verifies if the user's email exists in the authorization spreadsheet
- **Type**: `n8n-nodes-base.googleSheets`
- **Input**: User email from webhook body (`{{ $json.body.userEmail }}`)
- **Function**: Searches for matching email in "Email" column
- **Possible Outputs**:
  - **Found**: Returns row data with user information
  - **Not Found**: Returns empty result

### 3. If Node (Authorization Decision)
- **Purpose**: Determines if user is authorized based on Google Sheets lookup
- **Type**: `n8n-nodes-base.if`
- **Input**: Result from CheckAuthList node
- **Condition**: Checks if Email field exists in the response
- **Outputs**:
  - **TRUE Branch**: User is authorized → Continue to Assistant
  - **FALSE Branch**: User not authorized → Send denial message

### 4. Message a Model Node (OpenAI Assistant)
- **Purpose**: Sends user message to OpenAI Assistant for processing
- **Type**: `@n8n/n8n-nodes-langchain.openAi`
- **Input**: 
  - User message: `{{ $('Webhook').item.json.body.message }}`
  - User email: `{{ $('Webhook').item.json.body.userEmail }}`
- **Configuration**:
  - Resource: Assistant
  - Assistant ID: Your specific assistant ID
- **Output**: Assistant response with metadata

### 5. Simple Memory Node (Conversation History)
- **Purpose**: Maintains conversation context for each user
- **Type**: `@n8n/n8n-nodes-langchain.memoryBufferWindow`
- **Session Key**: User's email address (`{{ $('Webhook').item.json.body.userEmail }}`)
- **Function**: Stores and retrieves conversation history per user

### 6. Edit Fields Node (Response Processing)
- **Purpose**: Extracts and formats the assistant response
- **Type**: `n8n-nodes-base.set`
- **Input**: Raw assistant response
- **Processing**: Extracts:
  - `output`: The actual response text
  - `threadId`: Conversation thread identifier
- **Output**: Clean, structured response data

### 7. Respond to Webhook Node (Success Response)
- **Purpose**: Returns the assistant's response to your chat application
- **Type**: `n8n-nodes-base.respondToWebhook`
- **Input**: Processed response from Edit Fields node
- **Output**: HTTP response sent back to your chat app

### 8. SetDenyMessage Node (Authorization Denial)
- **Purpose**: Creates denial message for unauthorized users
- **Type**: `n8n-nodes-base.set`
- **Function**: Sets output to "You are not authorized to use this Agent"
- **Triggers**: When user email not found in Google Sheets

### 9. Respond to Webhook1 Node (Denial Response)
- **Purpose**: Returns denial message to unauthorized users
- **Type**: `n8n-nodes-base.respondToWebhook`
- **Input**: Denial message from SetDenyMessage node
- **Output**: HTTP response with authorization denial

## Prerequisites Setup

### N8N Account Setup

1. **Create N8N Account**
   - Go to https://n8n.cloud
   - Click "Sign up for free"
   - Complete registration and verify email
   - Choose a workspace name

2. **Access Your Dashboard**
   - Log into your N8N dashboard
   - Familiarize yourself with the interface
   - Note your workspace URL (you'll need this later)

## Google Sheets Authorization Setup

### Step 1: Create the Authorization Spreadsheet

1. **Create New Google Sheet**
   - Go to https://sheets.google.com
   - Click "Blank" to create a new spreadsheet
   - Name it "BasicChatAuthList" or similar

2. **Set Up Sheet Structure**
   - In cell A1, enter: `User`
   - In cell B1, enter: `Email` (optional, for your reference)

3. **Add Authorized Users**
   - Row 2, Column B: Enter first authorized email (e.g., `john@example.com`)
   - Row 2, Column A: Enter name (e.g., `John Smith`)
   - Continue adding users in subsequent rows

4. **Example Sheet Format**:
   ```
   B              | A           
   Email          | Name        
   john@test.com  | John Smith  
   jane@test.com  | Jane Doe    
   admin@test.com | Admin User  
   ```

5. **Share and Get Sheet ID**
   - Click "Share" button in top-right
   - Set sharing to "Anyone with the link can view"
   - Copy the sheet URL
   - Extract the sheet ID from the URL (long string between `/d/` and `/edit`)

### Step 2: Set Up Google OAuth Credentials in N8N

#### Create Google Cloud Project and OAuth Credentials

1. **Create/Access Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project or select an existing one
   - Name your project (e.g., "N8N Chatbot Integration")

2. **Enable Google Sheets API**
   - In your Google Cloud project, go to "APIs & Services" → "Library"
   - Search for "Google Sheets API"
   - Click on it and click "Enable"
   - This is crucial - without enabling the API, your credentials won't work

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" as user type (unless you're in a Google Workspace organization)
   - Fill in required fields:
     - App name: "N8N Chatbot" (or your preferred name)
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes: 
     - Click "Add or Remove Scopes"
     - Search for "Google Sheets API"
     - Add the scope: `.../auth/spreadsheets.readonly` (for reading sheets)
   - Save and continue through the remaining steps

4. **Create OAuth Client Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: "N8N Google Sheets Client"
   - **Important**: Add authorized redirect URIs:
     - For N8N Cloud: `https://app.n8n.cloud/rest/oauth2-credential/callback`
     - For self-hosted: Replace with your N8N instance URL + `/rest/oauth2-credential/callback`
   - Click "Create"
   - **Save the Client ID and Client Secret** - you'll need these for N8N

#### Configure N8N Credentials

5. **Access N8N Credentials**
   - In your N8N dashboard, click "Credentials" in the left sidebar
   - Click "Add Credential"
   - Search for "Google Sheets"
   - Select "Google Sheets OAuth2 API"

6. **Simple OAuth Setup**
   
   - **Client ID**: Paste your Google OAuth Client ID from step 4
   - **Client Secret**: Paste your Google OAuth Client Secret from step 4
   - Leave other fields as default (N8N will handle the OAuth URLs automatically)

7. **Authenticate with Google**
   - Click "Sign in with Google" or "Connect my account"
   - A Google OAuth popup will appear
   - Select your Google account from the list
   - Click "Continue" to grant permissions
   - The authentication should complete automatically
   - Name your credential (e.g., "Google Sheets Auth")
   - Save the credential

## OpenAI Integration Setup

### Step 1: OpenAI API Key (Reference Existing Guide)

For detailed OpenAI account setup and API key generation, follow steps 1-3 in the [OpenAI Assistant Setup Guide](./openai-assistant-setup.md#step-1-set-up-your-openai-account-and-api-access).

**Quick Summary**:
- Create OpenAI account at https://platform.openai.com
- Add billing information (required for API access)
- Generate API key and save it securely

### Step 2: Create N8N OpenAI Credentials

1. **Add OpenAI Credentials in N8N**
   - In N8N dashboard, go to "Credentials" → "Add Credential"
   - Search for "OpenAI"
   - Select "OpenAI API"

2. **Configure OpenAI Credentials**
   - **API Key**: Paste your OpenAI API key (starts with `sk-`)
   - **Name**: Give it a descriptive name (e.g., "OpenAI ChatBot API")
   - **Save** the credential

### Step 3: Assistant Selection (No ID Required)

With your OpenAI credentials set up, N8N will automatically detect your available assistants:

1. **Dynamic Assistant Detection**
   - N8N will automatically fetch your available assistants from your OpenAI account
   - You can select your assistant from a dropdown menu in the workflow node

2. **Assistant Selection Process**
   - This will be done directly in the workflow node configuration
   - Your assistants will appear in a dropdown list for easy selection

## N8N Workflow Configuration

### Step 1: Import the Workflow

1. **Access N8N Workflows**
   - In your N8N dashboard, click "Workflows"
   - Click "Add Workflow"
   - Choose "Import from file" or "Import from URL"

2. **Import the ChatBot Workflow**
   - Upload the `ChatBot.json` file from your INSTRUCTIONS/N8N-WORKFLOW/ folder
   - The workflow will appear in your editor
   - You'll see all the connected nodes

### Step 2: Configure Google Sheets Node

1. **Select CheckAuthList Node**
   - Click on the "CheckAuthList" node in the workflow
   - This opens the node configuration panel

2. **Set Up Credentials**
   - In the "Credential for Google Sheets OAuth2 API" dropdown
   - Select the Google Sheets credential you created earlier

3. **Configure Document Selection**
   - **Document**: Click the dropdown and select your "BasicChatAuthList" spreadsheet
   - If it doesn't appear, paste the sheet ID manually
   - **Sheet**: Select "Sheet1" (or your sheet name)

4. **Set Up Filter Configuration**
   - **Operation**: Should be set to "Look up"
   - **Filters**:
     - **Lookup Column**: Select "Email" from dropdown
     - **Lookup Value**: `={{ $json.body.userEmail }}`
   - **Options**:
     - Enable "Return first match" (should be checked)

5. **Test the Configuration**
   - Use the "Test step" button to verify it can access your sheet
   - It should return data if everything is configured correctly

### Step 3: Configure OpenAI Assistant Node

1. **Select Message a Model Node**
   - Click on the "Message a model" node
   - This opens the OpenAI configuration panel

2. **Set Up Credentials**
   - **Credential for OpenAI API**: Select your OpenAI credential from dropdown

3. **Configure Assistant Settings**
   - **Resource**: Should be set to "Assistant"
   - **Assistant**: 
     - Click the dropdown to see your available assistants
     - Select your assistant by name from the dropdown list
     - N8N automatically fetches your assistants using your OpenAI credentials
     - No need to manually enter Assistant IDs

4. **Configure Message Input**
   - **Prompt**: Should be set to "Define"
   - **Text**: The current configuration should be:
     ```
     UserMessage: {{ $('Webhook').item.json.body.message }}
     Email: {{ $('Webhook').item.json.body.userEmail }}
     ```
   - This formats the input to include both the message and user email

5. **Test Configuration**
   - Use the test function to verify the OpenAI connection
   - Ensure it can communicate with your assistant

### Step 4: Configure Memory Node

1. **Select Simple Memory Node**
   - Click on the "Simple Memory" node
   - This manages conversation history per user

2. **Configure Session Settings**
   - **Session ID Type**: Should be "Custom Key"
   - **Session Key**: `={{ $('Webhook').item.json.body.userEmail }}`
   - This ensures each user gets their own conversation thread

3. **Connect Memory to Assistant**
   - The memory node should be connected to the Assistant node
   - This connection is shown as a dotted line (AI Memory connection)

### Step 5: Configure Response Processing

1. **Edit Fields Node Configuration**
   - This node should already be configured to extract:
     - `output`: `={{ $json.output }}`
     - `threadId`: `={{ $json.threadId }}`
   - These settings clean up the response data

2. **Response Nodes**
   - Both "Respond to Webhook" nodes should be configured to return appropriate responses
   - One for successful assistant responses
   - One for authorization denial messages

### Step 6: Activate the Workflow

1. **Save Your Workflow**
   - Click "Save" in the top-right corner
   - Give your workflow a descriptive name if prompted

2. **Activate the Workflow**
   - Toggle the "Active" switch in the top-right
   - The workflow is now live and ready to receive requests

3. **Get Your Webhook URL**
   - Click on the Webhook node
   - Copy the webhook URL (should end with the path from the configuration)
   - This is the URL your chat application will send requests to

## Testing and Deployment

### Step 1: Test Authorization System

1. **Test with Authorized User**
   - Add your email to the Google Sheet
   - Send a test request to the webhook with your email
   - Should receive a response from the OpenAI Assistant

2. **Test with Unauthorized User**
   - Use an email NOT in your Google Sheet
   - Send a test request
   - Should receive "You are not authorized to use this Agent"

### Step 2: Integration Testing

1. **Update Your Chat Application**
   - Replace the webhook URL in your chat app's environment variables
   - Update `N8N_WEBHOOK_URL` in your `.env.local` file

2. **End-to-End Testing**
   - Test the full flow from chat app to N8N to OpenAI and back
   - Verify conversation memory works across multiple messages
   - Check that different users get separate conversation contexts

### Step 3: Production Deployment

1. **Webhook URL Configuration**
   - Update your production environment with the N8N webhook URL
   - Ensure the URL is accessible from your production environment

2. **Monitor Workflow Execution**
   - Use N8N's execution log to monitor requests
   - Check for any errors or failed executions
   - Monitor Google Sheets and OpenAI API usage

## Troubleshooting

### Common Google Sheets Issues

**Problem**: "Cannot access spreadsheet"
- **Solution**: Check that the Google Sheet is shared with "Anyone with the link can view"
- **Solution**: Verify the Google OAuth credentials are properly set up
- **Solution**: Ensure the sheet ID is correct in the node configuration

**Problem**: "Column 'Email' not found"
- **Solution**: Verify the first row of your sheet contains "Email" in column A
- **Solution**: Check that there are no extra spaces or special characters
- **Solution**: Ensure the sheet name matches what's selected in the node

### Common OpenAI Issues

**Problem**: "Assistant not found"
- **Solution**: Verify the Assistant ID is correct
- **Solution**: Check that the assistant exists in your OpenAI account
- **Solution**: Ensure your OpenAI API key has access to the assistant

**Problem**: "Rate limit exceeded"
- **Solution**: Check your OpenAI account usage limits
- **Solution**: Add billing information to your OpenAI account
- **Solution**: Implement rate limiting in your chat application

### Common N8N Issues

**Problem**: "Workflow execution failed"
- **Solution**: Check the execution log for specific error messages
- **Solution**: Test each node individually using the test function
- **Solution**: Verify all credentials are properly configured

**Problem**: "Webhook not receiving requests"
- **Solution**: Ensure the webhook URL is correct in your chat application
- **Solution**: Check that the workflow is activated
- **Solution**: Verify the HTTP method and path configuration

### Memory and Session Issues

**Problem**: "Users seeing each other's conversations"
- **Solution**: Verify the Memory node session key uses user email
- **Solution**: Check that each user has a unique email address
- **Solution**: Clear the memory cache and restart the workflow

**Problem**: "Conversation history not maintained"
- **Solution**: Ensure the Memory node is properly connected to the Assistant node
- **Solution**: Check that the session key is consistent across requests
- **Solution**: Verify the memory configuration in the node settings

---

**Congratulations!** You've successfully set up a secure N8N chatbot workflow with user authorization and conversation memory. Your chat application can now safely route requests through N8N to OpenAI Assistant while maintaining user-specific contexts and security.

## Best Practices

- **Regular Monitoring**: Check N8N execution logs regularly for errors
- **User Management**: Keep your Google Sheets authorization list up to date
- **Security**: Never share your API keys or webhook URLs publicly
- **Cost Control**: Monitor OpenAI and N8N usage to avoid unexpected charges
- **Backup**: Export your workflow configuration regularly as backup