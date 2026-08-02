package com.domaintoolkit.pro.utils;

import android.app.Activity;
import android.content.Intent;
import android.os.AsyncTask;
import android.widget.Toast;

import com.domaintoolkit.pro.models.User;
import com.domaintoolkit.pro.network.UserApiHelper;

/**
 * Authentication orchestrator for Google & Facebook sign-in.
 * Handles account picker, token validation, and user registration/sync.
 * Java 7 / AIDE compatible.
 *
 * GOOGLE SETUP:
 * 1. Go to https://console.cloud.google.com
 * 2. Create project → APIs & Services → OAuth consent screen
 * 3. Create OAuth 2.0 Client ID (Web application type)
 * 4. Add your SHA-1 fingerprint in Firebase or Cloud Console
 * 5. Put the Web Client ID in Constants.GOOGLE_WEB_CLIENT_ID
 *
 * FACEBOOK SETUP:
 * 1. Go to https://developers.facebook.com
 * 2. Create app → Facebook Login → Quickstart
 * 3. Add your key hash, package name
 * 4. Put App ID in Constants.FACEBOOK_APP_ID
 */
public class AuthManager {

    public interface AuthCallback {
        void onSuccess(User user);
        void onError(String message);
    }

    /**
     * Start Google Sign-In with forced account picker.
     * User will see a dialog to CHOOSE which Google account to use.
     *
     * Usage in Activity:
     *   AuthManager.startGoogleSignIn(this, RC_GOOGLE_SIGN_IN, callback);
     *
     * Then in onActivityResult:
     *   AuthManager.handleGoogleResult(data, callback);
     */
    public static void startGoogleSignIn(Activity activity, int requestCode) {
        // Use GoogleSignIn from Google Play Services Auth
        // This forces the account chooser — user PICKS their account
        try {
            com.google.android.gms.auth.api.signin.GoogleSignInOptions gso =
                    new com.google.android.gms.auth.api.signin.GoogleSignInOptions.Builder(
                            com.google.android.gms.auth.api.signin.GoogleSignInOptions.DEFAULT_SIGN_IN)
                            .requestIdToken(Constants.GOOGLE_WEB_CLIENT_ID)
                            .requestEmail()
                            .requestProfile()
                            .build();

            com.google.android.gms.auth.api.signin.GoogleSignInClient client =
                    com.google.android.gms.auth.api.signin.GoogleSignIn.getClient(activity, gso);

            Intent signInIntent = client.getSignInIntent();
            // Force account chooser by clearing any cached sign-in
            client.signOut();
            activity.startActivityForResult(signInIntent, requestCode);
        } catch (Exception e) {
            // Fallback: Google Play Services not available
            Toast.makeText(activity, "Google Play Services required for sign-in",
                    Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Handle the result from Google Sign-In intent.
     * Extracts user info (email, name, photo, Google ID) and registers/signs in.
     */
    public static void handleGoogleResult(Activity activity, Intent data, final AuthCallback callback) {
        try {
            com.google.android.gms.auth.api.signin.GoogleSignIn
                    .getSignedInAccountFromIntent(data)
                    .addOnCompleteListener(new com.google.android.gms.tasks.OnCompleteListener
                            <com.google.android.gms.auth.api.signin.GoogleSignInAccount>() {
                        @Override
                        public void onComplete(com.google.android.gms.tasks.Task
                                <com.google.android.gms.auth.api.signin.GoogleSignInAccount> task) {
                            if (task.isSuccessful()) {
                                com.google.android.gms.auth.api.signin.GoogleSignInAccount acct =
                                        task.getResult();
                                if (acct != null) {
                                    processSignIn(acct.getEmail(),
                                            acct.getDisplayName(),
                                            acct.getPhotoUrl() != null ?
                                                    acct.getPhotoUrl().toString() : null,
                                            "google",
                                            acct.getId(),
                                            callback);
                                }
                            } else {
                                callback.onError("Google sign-in failed: " +
                                        (task.getException() != null ?
                                                task.getException().getMessage() : "unknown"));
                            }
                        }
                    });
        } catch (Exception e) {
            callback.onError("Google sign-in error: " + e.getMessage());
        }
    }

    /**
     * Start Facebook Login with account picker.
     * Requires Facebook SDK.
     */
    public static void startFacebookSignIn(Activity activity) {
        try {
            // Using reflection to avoid compile-time Facebook SDK dependency
            // In your AIDE project, add facebook-android-sdk.jar to libs/
            Class<?> loginManagerClass = Class.forName("com.facebook.login.LoginManager");
            Object loginManager = loginManagerClass.getMethod("getInstance").invoke(null);

            java.util.List<String> permissions = new java.util.ArrayList<String>();
            permissions.add("public_profile");
            permissions.add("email");

            loginManagerClass.getMethod("logInWithReadPermissions",
                    Activity.class, java.util.Collection.class)
                    .invoke(loginManager, activity, permissions);

        } catch (Exception e) {
            Toast.makeText(activity, "Facebook SDK not available. " +
                    "Add facebook-android-sdk.jar to libs/", Toast.LENGTH_LONG).show();
        }
    }

    /**
     * Handle Facebook login result.
     */
    public static void handleFacebookResult(Activity activity, int requestCode,
                                             int resultCode, Intent data, final AuthCallback callback) {
        try {
            Class<?> callbackManagerClass = Class.forName(
                    "com.facebook.CallbackManager$Factory");
            // Facebook callback is handled via the SDK's callback manager
            // This is a simplified version — full implementation needs the SDK
            callback.onError("Facebook SDK requires facebook-android-sdk.jar in libs/");
        } catch (Exception e) {
            callback.onError("Facebook SDK not found");
        }
    }

    /**
     * Process sign-in: check if user exists on server, register if new.
     */
    private static void processSignIn(final String email, final String displayName,
                                       final String photoUrl, final String provider,
                                       final String providerId, final AuthCallback callback) {
        new AsyncTask<Void, Void, UserApiHelper.ApiResult>() {
            private User mUser;
            private String mError;

            @Override
            protected UserApiHelper.ApiResult doInBackground(Void... params) {
                // First, check if user exists
                UserApiHelper.ApiResult fetchResult = UserApiHelper.fetchUsers();
                if (fetchResult.success) {
                    String userJson = UserApiHelper.findUser(fetchResult.data, email, provider);
                    if (userJson != null) {
                        // Existing user — parse and update last login
                        mUser = parseUserFromJson(userJson);
                        UserApiHelper.updateLastLogin(email, provider);
                        return fetchResult;
                    }
                }

                // New user — register
                UserApiHelper.ApiResult regResult = UserApiHelper.registerUser(
                        email, displayName, photoUrl, provider, providerId);
                if (regResult.success) {
                    mUser = new User();
                    mUser.setEmail(email);
                    mUser.setDisplayName(displayName);
                    mUser.setPhotoUrl(photoUrl);
                    mUser.setProvider(provider);
                    mUser.setProviderId(providerId);
                    mUser.setPremiumTier("free");
                    mUser.setPremiumExpiry("");
                } else {
                    mError = regResult.error;
                }
                return regResult;
            }

            @Override
            protected void onPostExecute(UserApiHelper.ApiResult result) {
                if (mUser != null) {
                    callback.onSuccess(mUser);
                } else {
                    // If server fails, still allow offline sign-in
                    if (email != null) {
                        User offlineUser = new User();
                        offlineUser.setEmail(email);
                        offlineUser.setDisplayName(displayName);
                        offlineUser.setPhotoUrl(photoUrl);
                        offlineUser.setProvider(provider);
                        offlineUser.setProviderId(providerId);
                        offlineUser.setPremiumTier("free");
                        callback.onSuccess(offlineUser);
                    } else {
                        callback.onError(mError != null ? mError : "Sign-in failed");
                    }
                }
            }
        }.execute();
    }

    /**
     * Parse a user JSON object into a User model.
     */
    private static User parseUserFromJson(String json) {
        User user = new User();
        user.setId(extractField(json, "id"));
        user.setEmail(extractField(json, "email"));
        user.setDisplayName(extractField(json, "displayName"));
        user.setPhotoUrl(extractField(json, "photoUrl"));
        user.setProvider(extractField(json, "provider"));
        user.setProviderId(extractField(json, "providerId"));
        user.setPremiumTier(extractField(json, "premiumTier"));
        user.setPremiumExpiry(extractField(json, "premiumExpiry"));
        return user;
    }

    private static String extractField(String json, String key) {
        int idx = json.indexOf("\"" + key + "\":\"");
        if (idx < 0) return "";
        int start = idx + key.length() + 4;
        int end = json.indexOf("\"", start);
        if (end < 0) return json.substring(start);
        return json.substring(start, end);
    }
}
