# SaaS Tour Mobile - Operations App

React Native mobile application for vehicle checkout and return operations.

## Features

- ✅ Multi-tenant authentication
- ✅ Vehicle checkout flow (8 photos + video, license/passport verification)
- ✅ Vehicle return flow (photos, fuel level, mileage, damage notes)
- ✅ Offline-tolerant upload queue with retry
- ✅ Thermal printer support (ESC/POS)
- ✅ Document verification (license, passport)
- ✅ Privacy-first: Only customer name exposed, no PII

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Environment

Create a `.env` file (or use `app.json` extra config):

```env
API_BASE_URL=http://localhost:4001/api
```

For production, use your tenant subdomain:
```env
API_BASE_URL=https://yourtenant.saastour360.com/api
```

### 3. Start Development Server

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Main app entry
│   ├── config/
│   │   └── env.ts             # Environment config
│   ├── services/
│   │   ├── api.ts             # API client with auth
│   │   ├── auth.service.ts    # Authentication
│   │   ├── ops.service.ts     # Operations API
│   │   ├── upload.service.ts  # File upload
│   │   ├── upload-queue.service.ts  # Offline upload queue
│   │   └── printer.service.ts # Thermal printer
│   ├── store/
│   │   ├── auth.store.ts      # Auth state (Zustand)
│   │   └── tasks.store.ts     # Tasks state
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── TodayTasksScreen.tsx
│   │   ├── SearchTasksScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   ├── CheckoutFlowScreen.tsx
│   │   ├── ReturnFlowScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── navigation/
│       └── HomeTabs.tsx        # Bottom tab navigation
├── app.json                    # Expo config
├── package.json
└── tsconfig.json
```

## API Endpoints Used

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Operations
- `GET /api/ops/tasks` - List tasks (with filters)
- `GET /api/ops/tasks/:id` - Get task details
- `POST /api/ops/tasks` - Create/get task
- `POST /api/ops/tasks/:id/media` - Update media
- `POST /api/ops/tasks/:id/verify-docs` - Verify documents
- `POST /api/ops/tasks/:id/finalize` - Finalize checkout
- `POST /api/ops/tasks/:id/return/finalize` - Finalize return
- `GET /api/ops/tasks/:id/print` - Get print payload

### Upload
- `POST /api/settings/upload` - Upload file (multipart/form-data)

## Key Features Implementation

### Offline Upload Queue

The app uses `upload-queue.service.ts` to handle uploads with:
- Automatic retry (up to 3 attempts)
- Progress tracking
- Queue persistence (AsyncStorage)
- Network state detection

### Privacy Protection

Backend endpoints return minimal data:
- Only `customerName` (no email, phone, address, ID number)
- Vehicle info (plate, brand, model, year)
- Reservation dates

### Thermal Printer

The printer service supports ESC/POS commands. For production:
1. Install a proper Bluetooth/USB library
2. Update `printer.service.ts` with actual device connection
3. Test with your thermal printer model

Recommended libraries:
- `react-native-esc-pos-printer` (if compatible with Expo)
- `react-native-bluetooth-serial` (may require bare RN)

## Building for Production

### iOS

```bash
eas build --platform ios
```

### Android

```bash
eas build --platform android
```

## Troubleshooting

### Camera Permissions

If camera doesn't work:
1. Check `app.json` permissions
2. On iOS: Add to `Info.plist`
3. On Android: Permissions are auto-handled

### Upload Queue Not Working

- Check network connection
- Verify API endpoint is correct
- Check AsyncStorage permissions

### Printer Not Connecting

- Ensure Bluetooth/USB permissions are granted
- Check printer is in pairing mode
- Verify library compatibility with Expo

## Notes

- The app uses Expo managed workflow for faster development
- If you need native modules not available in Expo, consider ejecting to bare RN
- All sensitive data is stored in SecureStore (encrypted)
- Upload queue survives app restarts

## Development

### Running on Device

1. Install Expo Go app
2. Run `npm start`
3. Scan QR code
4. App will load on device

### Debugging

- Use React Native Debugger
- Check Expo logs in terminal
- Use `console.log` (visible in Expo DevTools)

## License

Same as main project.

