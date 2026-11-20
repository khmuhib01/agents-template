# Lifecycle, process death, permissions, background limits

- **Process death:** the OS can kill the app in the background; test with "Don't keep activities" and `adb shell am kill <package>`. Restore user-visible state with `SavedStateHandle` / saved instance state; large data is reloaded from storage, not saved in state bundles (size limit).
- **Configuration changes:** a ViewModel survives them; a composable's `remember` does not.
- **Lifecycle:** register/unregister observers in matching lifecycle callbacks; never launch work in `onStart` that is not cancelled in `onStop` unless intended.
- **Permissions:** request at the point of use, explain why before the system dialog, handle denied and permanently denied (link to settings), degrade gracefully. Some permissions and APIs (notifications, media access, exact alarms, foreground service types, background location) changed across Android versions; read the docs for the project's targetSdk before implementing.
- **Background execution:** assume the app is not running. Use WorkManager for deferrable work, foreground services only for user-visible ongoing tasks with the correct declared type, `AlarmManager` exact alarms only when truly required. Doze and App Standby delay work; test with `adb shell dumpsys deviceidle`.
- **Notifications:** create channels, request the runtime permission where the OS requires it, use `PendingIntent` with explicit mutability flags.
- **Intents / deep links:** exported components need an intentional `android:exported`; validate incoming extras and URIs.
- **Back handling:** use the back-handling APIs of the installed AndroidX version; predictive back needs opt-in and testing.
