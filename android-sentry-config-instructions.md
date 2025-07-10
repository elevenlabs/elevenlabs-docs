# Android Sentry Configuration Override Instructions

## Task: Disable Sentry Error Reporting for Local Builds

### Overview
Create a `productionDebug/AndroidManifest.xml` file to override the Sentry DSN configuration, preventing error reports from being sent during local development builds.

### Implementation Steps

1. **Navigate to the Android app module**
   ```
   cd app/src/
   ```

2. **Create the productionDebug directory**
   ```bash
   mkdir -p productionDebug
   ```

3. **Create the AndroidManifest.xml file**
   Create the file at `app/src/productionDebug/AndroidManifest.xml` with the following content:

   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <manifest xmlns:android="http://schemas.android.com/apk/res/android"
       xmlns:tools="http://schemas.android.com/tools">
       
       <application>
           <!-- Override Sentry DSN with empty value to disable error reporting -->
           <meta-data 
               android:name="io.sentry.dsn" 
               android:value="" 
               tools:replace="android:value" />
       </application>
       
   </manifest>
   ```

### How It Works

- The `productionDebug` variant manifest will be merged with the main manifest during build
- The empty DSN value (`android:value=""`) disables Sentry error reporting
- The `tools:replace="android:value"` ensures this override takes precedence over any DSN defined in the main manifest
- This configuration only applies to `productionDebug` builds, keeping Sentry active for production releases

### Verification

After implementing:
1. Build the app using the `productionDebug` variant
2. Verify in logcat that Sentry initialization shows the DSN as empty or disabled
3. Confirm that no errors are being sent to Sentry dashboard from local builds

### Note
This approach ensures that:
- Local development builds don't pollute production error tracking
- Production releases maintain full error reporting capability
- The configuration is isolated to the specific build variant