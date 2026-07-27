# Firebase Service Account Credentials

To connect the backend to your live Firebase project (`bingoplusbch`):

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **bingoplusbch**.
3. Go to **Project Settings** (gear icon) -> **Service accounts**.
4. Click **Generate new private key**.
5. Save the downloaded JSON file to this folder as:
   `backend/secrets/firebase-service-account.json`

Alternatively, set the environment variables in `backend/.env`:
```env
FIREBASE_CLIENT_EMAIL=your-service-account@bingoplusbch.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

For local offline development with Firebase Emulators, run:
```bash
npm run firebase:emulators
```
