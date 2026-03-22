# Environment Variables — Google Drive Integration

## Required Variables

### GOOGLE_PICKER_API_KEY

- **What:** Google Cloud API Key with Google Drive API v3 enabled
- **Used by:** `/api/drive/list-files` endpoint to list files in public Drive folders
- **Where to add:** Vercel Dashboard > Settings > Environment Variables
- **Environments:** Production, Preview, Development
- **Value:** The API Key from Google Cloud Console (project: meta-ads-manager-490414)

### How to get the API Key

1. Go to https://console.cloud.google.com/apis/credentials
2. Select the project `meta-ads-manager-490414`
3. Copy the existing API Key or create a new one
4. Ensure the Google Drive API is enabled for this project

### Important Notes

- The API Key only works with **public** Google Drive folders (shared as "Anyone with the link")
- For private folders, a Service Account with OAuth would be needed (not implemented)
- The API Key should have referrer restrictions set to your production domain for security
- Never commit the API Key to the codebase — always use environment variables
