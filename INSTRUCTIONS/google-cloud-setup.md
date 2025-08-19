# Google Cloud Project Setup Guide

This guide will walk you through creating a Google Cloud project and setting up Google authentication for your chat application. Follow these steps carefully - each step is important for making your app work properly.

## What You'll Need

- A Google account (Gmail account)
- Access to a web browser
- About 15-20 minutes of time

## Step 1: Create a Google Cloud Project

1. **Go to Google Cloud Console**
   - Open your web browser
   - Visit: https://console.cloud.google.com
   - Sign in with your Google account if you haven't already

2. **Accept Terms (First Time Only)**
   - If this is your first time using Google Cloud, you'll see terms and conditions
   - Read and accept them to continue
   - You may also see a welcome screen - click "Continue" or "Get Started"

3. **Create a New Project**
   - Look for a dropdown menu at the top of the page that says "Select a project" or shows a project name
   - Click on it to open the project selector
   - Click the "NEW PROJECT" button (usually in the top-right of the popup)

4. **Name Your Project**
   - Enter a project name (example: "My Chat App" or "BasicChatUI")
   - The project name can be anything you want - it's just for you to remember
   - Google will automatically create a "Project ID" below your name
   - You can change the Project ID if you want, but the name you choose is fine
   - Leave "Organization" as "No organization" unless you work for a company
   - Click "CREATE"

5. **Wait for Project Creation**
   - Google will take a few seconds to create your project
   - You'll see a notification when it's ready
   - Make sure your new project is selected (check the dropdown at the top)

## Step 2: Enable the Google+ API

The Google+ API is what allows people to sign in to your app using their Google accounts.

1. **Open the API Library**
   - In the left sidebar, look for "APIs & Services"
   - Click on it, then click "Library"
   - You might need to click the hamburger menu (three horizontal lines) first if the sidebar is collapsed

2. **Search for Google+ API**
   - In the search box at the top, type "Google+ API"
   - Click on "Google+ API" from the search results
   - You should see a page about the Google+ API

3. **Enable the API**
   - Click the blue "ENABLE" button
   - Wait for it to process (this takes a few seconds)
   - You'll see a confirmation that the API is now enabled

## Step 3: Create Credentials

Credentials are like a special key that allows your app to use Google's sign-in service.

1. **Go to Credentials**
   - In the left sidebar, click "APIs & Services" then "Credentials"
   - You'll see a page with different types of credentials

2. **Create OAuth Client ID**
   - Click the "+ CREATE CREDENTIALS" button at the top
   - Select "OAuth client ID" from the dropdown menu

3. **Configure OAuth Consent Screen (If Required)**
   - If this is your first time, Google might ask you to configure the "OAuth consent screen" first
   - If you see this screen, follow these steps:
     - Click "CONFIGURE CONSENT SCREEN"
     - Choose "External" (this allows anyone with a Google account to sign in)
     - Click "CREATE"
     - Fill out the required fields:
       - **App name**: Same as your project name (e.g., "My Chat App")
       - **User support email**: Your email address
       - **Developer contact email**: Your email address again
     - Leave other fields empty for now
     - Click "SAVE AND CONTINUE"
     - Skip the "Scopes" section by clicking "SAVE AND CONTINUE"
     - Skip the "Test users" section by clicking "SAVE AND CONTINUE"
     - Review your settings and click "BACK TO DASHBOARD"

4. **Create the OAuth Client ID (Continued)**
   - Go back to "Credentials" in the left sidebar
   - Click "+ CREATE CREDENTIALS" then "OAuth client ID"
   - Choose "Web application" as the application type

5. **Configure Your Web Application**
   - **Name**: Give it a name like "Chat App Web Client"
   - **Authorized JavaScript origins**: 
     - Click "ADD URI"
     - Enter: `http://localhost:3000`
     - If you plan to deploy your app, also add your website URL (e.g., `https://yourapp.com`)
   - **Authorized redirect URIs**:
     - Click "ADD URI" 
     - Enter: `http://localhost:3000/api/auth/callback/google`
     - If you added a website URL above, also add: `https://yourapp.com/api/auth/callback/google`
   - Click "CREATE"

6. **Save Your Credentials**
   - Google will show you a popup with your credentials
   - You'll see two important pieces of information:
     - **Client ID**: A long string that starts with numbers
     - **Client Secret**: Another long string
   - **IMPORTANT**: Copy both of these and save them somewhere safe
   - You can also download them as a JSON file by clicking "DOWNLOAD JSON"
   - Click "OK" to close the popup

## Step 4: Set Up Your Environment Variables

Now you need to add these credentials to your chat application.

1. **Find Your Project Folder**
   - Open your project folder on your computer
   - Look for a file called `.env.local.example` - this is a template file

2. **Create Your Environment File**
   - Copy the `.env.local.example` file
   - Rename the copy to `.env.local` (remove the ".example" part)
   - Open the `.env.local` file in a text editor

3. **Add Your Google Credentials**
   - Find the lines that say:
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
   - Replace `your-google-client-id` with your actual Client ID from Step 3
   - Replace `your-google-client-secret` with your actual Client Secret from Step 3

4. **Example of Complete .env.local File**
   After adding your credentials, your file should look something like this:
```
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database
DATABASE_URL="file:./dev.db"

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ABCDEF-1234567890-abcdefghijk

# Webhook Configuration
N8N_WEBHOOK_URL=your-n8n-webhook-url
```

5. **Save the File**
   - Save your `.env.local` file
   - Make sure it's in the root folder of your project (same level as package.json)

## Step 5: Test Your Setup

1. **Start Your Application**
   - Open a terminal/command prompt in your project folder
   - Run: `npm run dev`
   - Your app should start at http://localhost:3000

2. **Test Google Sign-In**
   - Open your web browser and go to http://localhost:3000
   - Try to sign in with your Google account
   - You should see a Google sign-in popup
   - After signing in, you should be taken to your chat interface

## Troubleshooting Common Issues

### "Error 400: redirect_uri_mismatch"
- Check that your redirect URI in Google Cloud exactly matches: `http://localhost:3000/api/auth/callback/google`
- Make sure there are no extra spaces or typos

### "This app isn't verified"
- This is normal for new apps
- Click "Advanced" then "Go to [Your App Name] (unsafe)"
- This warning will go away once your app is published

### Sign-in popup doesn't appear
- Check that you've enabled the Google+ API
- Verify your Client ID and Client Secret are correct in your .env.local file
- Make sure your .env.local file is saved

### Still having problems?
- Double-check all the URIs in your Google Cloud credentials
- Make sure your project is selected in Google Cloud Console
- Try creating new credentials if the old ones don't work

## Security Notes

- Never share your Client Secret with anyone
- Don't commit your .env.local file to version control (Git)
- If you think your credentials are compromised, create new ones in Google Cloud Console

## Next Steps

Once Google authentication is working:
- You can add your production website URLs to the authorized origins
- Consider setting up other OAuth providers (GitHub, etc.)
- Configure your OAuth consent screen with more details for production use

---

**Congratulations!** You've successfully set up Google Cloud authentication for your chat application. Users can now sign in with their Google accounts to use your app.