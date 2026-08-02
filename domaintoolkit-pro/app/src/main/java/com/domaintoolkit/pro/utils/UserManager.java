package com.domaintoolkit.pro.utils;

import android.content.Context;
import android.content.SharedPreferences;

import com.domaintoolkit.pro.models.User;

/**
 * Local user session manager + sync with JSONBin backend.
 * Stores current user in SharedPreferences for offline access.
 * Java 7 compatible.
 */
public class UserManager {

    private static final String PREFS_USER = "domaintoolkit_user";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_EMAIL = "user_email";
    private static final String KEY_DISPLAY_NAME = "user_display_name";
    private static final String KEY_PHOTO_URL = "user_photo_url";
    private static final String KEY_PROVIDER = "user_provider";
    private static final String KEY_PROVIDER_ID = "user_provider_id";
    private static final String KEY_PREMIUM_TIER = "user_premium_tier";
    private static final String KEY_PREMIUM_EXPIRY = "user_premium_expiry";
    private static final String KEY_IS_LOGGED_IN = "user_logged_in";

    private static UserManager sInstance;
    private final SharedPreferences mPrefs;
    private User mCurrentUser;

    private UserManager(Context context) {
        mPrefs = context.getSharedPreferences(PREFS_USER, Context.MODE_PRIVATE);
        loadFromPrefs();
    }

    public static synchronized UserManager getInstance(Context context) {
        if (sInstance == null) {
            sInstance = new UserManager(context.getApplicationContext());
        }
        return sInstance;
    }

    /**
     * Save user to local prefs after successful sign-in or registration.
     */
    public void saveUser(User user) {
        mCurrentUser = user;
        SharedPreferences.Editor editor = mPrefs.edit();
        editor.putBoolean(KEY_IS_LOGGED_IN, true);
        editor.putString(KEY_USER_ID, user.getId());
        editor.putString(KEY_EMAIL, user.getEmail());
        editor.putString(KEY_DISPLAY_NAME, user.getDisplayName());
        editor.putString(KEY_PHOTO_URL, user.getPhotoUrl());
        editor.putString(KEY_PROVIDER, user.getProvider());
        editor.putString(KEY_PROVIDER_ID, user.getProviderId());
        editor.putString(KEY_PREMIUM_TIER, user.getPremiumTier());
        editor.putString(KEY_PREMIUM_EXPIRY, user.getPremiumExpiry());
        editor.apply();
    }

    /**
     * Update premium locally (also sync to server via PurchaseManager).
     */
    public void updatePremiumLocally(String tier, String expiry) {
        if (mCurrentUser != null) {
            mCurrentUser.setPremiumTier(tier);
            mCurrentUser.setPremiumExpiry(expiry);
        }
        mPrefs.edit()
                .putString(KEY_PREMIUM_TIER, tier)
                .putString(KEY_PREMIUM_EXPIRY, expiry)
                .apply();
    }

    /**
     * Get currently logged-in user.
     */
    public User getCurrentUser() {
        return mCurrentUser;
    }

    /**
     * Check if a user is signed in.
     */
    public boolean isLoggedIn() {
        return mPrefs.getBoolean(KEY_IS_LOGGED_IN, false) && mCurrentUser != null;
    }

    /**
     * Sign out — clear local session.
     */
    public void signOut() {
        mCurrentUser = null;
        mPrefs.edit().clear().apply();
    }

    /**
     * Get stored premium tier (synced with PremiumManager).
     */
    public String getPremiumTier() {
        if (mCurrentUser != null && mCurrentUser.getPremiumTier() != null) {
            return mCurrentUser.getPremiumTier();
        }
        return mPrefs.getString(KEY_PREMIUM_TIER, "free");
    }

    /**
     * Check if the stored premium is still valid.
     */
    public boolean isPremiumValid() {
        String expiry = mPrefs.getString(KEY_PREMIUM_EXPIRY, "");
        if (expiry == null || expiry.isEmpty()) return false;
        try {
            // Simple date comparison for ISO dates
            String now = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US)
                    .format(new java.util.Date());
            return expiry.compareTo(now) >= 0;
        } catch (Exception e) {
            return false;
        }
    }

    private void loadFromPrefs() {
        if (!mPrefs.getBoolean(KEY_IS_LOGGED_IN, false)) return;

        mCurrentUser = new User();
        mCurrentUser.setId(mPrefs.getString(KEY_USER_ID, ""));
        mCurrentUser.setEmail(mPrefs.getString(KEY_EMAIL, ""));
        mCurrentUser.setDisplayName(mPrefs.getString(KEY_DISPLAY_NAME, ""));
        mCurrentUser.setPhotoUrl(mPrefs.getString(KEY_PHOTO_URL, ""));
        mCurrentUser.setProvider(mPrefs.getString(KEY_PROVIDER, ""));
        mCurrentUser.setProviderId(mPrefs.getString(KEY_PROVIDER_ID, ""));
        mCurrentUser.setPremiumTier(mPrefs.getString(KEY_PREMIUM_TIER, "free"));
        mCurrentUser.setPremiumExpiry(mPrefs.getString(KEY_PREMIUM_EXPIRY, ""));
    }
}
