package com.domaintoolkit.pro.utils;

import android.content.Context;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Manages premium tiers, usage limits, and feature gates.
 * Now with server-verified activation via PurchaseManager.
 * Java 7 compatible.
 */
public class PremiumManager {

    private static PremiumManager sInstance;
    private final SharedPreferences mPrefs;

    private PremiumManager(Context context) {
        mPrefs = context.getSharedPreferences(Constants.PREFS_NAME, Context.MODE_PRIVATE);
        resetDailyCountsIfNeeded();
    }

    public static synchronized PremiumManager getInstance(Context context) {
        if (sInstance == null) {
            sInstance = new PremiumManager(context.getApplicationContext());
        }
        return sInstance;
    }

    // ---- Premium Tier ----

    public boolean isPremium() {
        String tier = getPremiumTier();
        return tier != null && !tier.isEmpty() && !tier.equals("free") && isPremiumValid();
    }

    public String getPremiumTier() {
        // First check UserManager for server-synced tier
        UserManager um = UserManager.getInstance(
                android.app.Application.class.cast(null)); // Will be replaced with actual context
        // Use SharedPreferences directly for standalone access
        return mPrefs.getString(Constants.KEY_PREMIUM_TIER, "free");
    }

    public void setPremiumTier(String tier) {
        mPrefs.edit().putString(Constants.KEY_PREMIUM_TIER, tier).apply();
    }

    public void setPremiumExpiry(String expiry) {
        mPrefs.edit().putString("premium_expiry", expiry).apply();
    }

    public String getPremiumExpiry() {
        return mPrefs.getString("premium_expiry", "");
    }

    /**
     * Check if the premium subscription is still valid.
     */
    public boolean isPremiumValid() {
        String expiry = getPremiumExpiry();
        if (expiry == null || expiry.isEmpty()) {
            // No expiry set — if tier is set, assume valid (for legacy/demo users)
            String tier = getPremiumTier();
            return tier != null && !tier.isEmpty() && !tier.equals("free");
        }
        try {
            String now = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            return expiry.compareTo(now) >= 0;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isUltimate() {
        return Constants.PREMIUM_ULTIMATE.equals(getPremiumTier());
    }

    public boolean isPlusOrAbove() {
        String tier = getPremiumTier();
        return Constants.PREMIUM_PLUS.equals(tier) || Constants.PREMIUM_ULTIMATE.equals(tier);
    }

    // ---- Daily Limits ----

    public void resetDailyCountsIfNeeded() {
        long today = System.currentTimeMillis() / 86400000L;
        long lastReset = mPrefs.getLong(Constants.KEY_LAST_RESET_DATE, 0);
        if (today != lastReset) {
            mPrefs.edit()
                    .putLong(Constants.KEY_LAST_RESET_DATE, today)
                    .putInt(Constants.KEY_DAILY_SCAN_COUNT, 0)
                    .putInt(Constants.KEY_DAILY_WS_COUNT, 0)
                    .putInt(Constants.KEY_DAILY_PORT_COUNT, 0)
                    .putInt(Constants.KEY_DAILY_EXPORT_COUNT, 0)
                    .apply();
        }
    }

    // ---- Scan Limits ----

    public boolean canPerformScan() {
        if (isPremium()) return true;
        int count = mPrefs.getInt(Constants.KEY_DAILY_SCAN_COUNT, 0);
        return count < Constants.FREE_DAILY_SCAN_LIMIT;
    }

    public void recordScan() {
        int count = mPrefs.getInt(Constants.KEY_DAILY_SCAN_COUNT, 0);
        mPrefs.edit().putInt(Constants.KEY_DAILY_SCAN_COUNT, count + 1).apply();
    }

    public int getRemainingScans() {
        if (isPremium()) return Integer.MAX_VALUE;
        int count = mPrefs.getInt(Constants.KEY_DAILY_SCAN_COUNT, 0);
        return Math.max(0, Constants.FREE_DAILY_SCAN_LIMIT - count);
    }

    // ---- WebSocket Limits ----

    public boolean canPerformWsScan() {
        if (isPremium()) return true;
        int count = mPrefs.getInt(Constants.KEY_DAILY_WS_COUNT, 0);
        return count < Constants.FREE_DAILY_WS_SCAN_LIMIT;
    }

    public void recordWsScan() {
        int count = mPrefs.getInt(Constants.KEY_DAILY_WS_COUNT, 0);
        mPrefs.edit().putInt(Constants.KEY_DAILY_WS_COUNT, count + 1).apply();
    }

    // ---- Port Scan Limits ----

    public boolean canPerformPortScan() {
        if (isPlusOrAbove()) return true;
        int count = mPrefs.getInt(Constants.KEY_DAILY_PORT_COUNT, 0);
        return count < Constants.FREE_DAILY_PORT_SCAN_LIMIT;
    }

    public void recordPortScan() {
        int count = mPrefs.getInt(Constants.KEY_DAILY_PORT_COUNT, 0);
        mPrefs.edit().putInt(Constants.KEY_DAILY_PORT_COUNT, count + 1).apply();
    }

    // ---- Export Limits ----

    public boolean canExport() {
        if (isPremium()) return true;
        int count = mPrefs.getInt(Constants.KEY_DAILY_EXPORT_COUNT, 0);
        return count < Constants.FREE_DAILY_EXPORT_LIMIT;
    }

    public void recordExport() {
        int count = mPrefs.getInt(Constants.KEY_DAILY_EXPORT_COUNT, 0);
        mPrefs.edit().putInt(Constants.KEY_DAILY_EXPORT_COUNT, count + 1).apply();
    }

    // ---- Feature Gates ----

    public boolean canBulkScan() { return isPlusOrAbove(); }
    public boolean canExportPdf() { return isPremium(); }
    public boolean canScheduleScans() { return isUltimate(); }
    public boolean canUseAiAnalysis() { return isUltimate(); }
    public boolean canBulkWebSocketScan() { return isPlusOrAbove(); }
    public boolean canAccessAdvancedSecurity() { return isPlusOrAbove(); }
    public boolean canUseGeoIp() { return isPlusOrAbove(); }
    public boolean canVerifyEmail() { return isPlusOrAbove(); }
    public boolean canCheckBreaches() { return isUltimate(); }
    public boolean canTraceRedirects() { return isPremium(); }
}
