package com.domaintoolkit.pro.utils;

import android.content.Context;
import android.os.AsyncTask;

import com.domaintoolkit.pro.network.PayPalHelper;
import com.domaintoolkit.pro.network.UserApiHelper;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/**
 * Manages the purchase flow — creates orders, captures payments,
 * and activates premium on the server.
 * Java 7 / AIDE compatible.
 */
public class PurchaseManager {

    /**
     * Tier pricing configuration.
     */
    public static class TierInfo {
        public String tierConstant;
        public String tierName;
        public String amount;
        public String currency;
        public int durationMonths; // 0 = lifetime

        public TierInfo(String constant, String name, String amount,
                          String currency, int months) {
            this.tierConstant = constant;
            this.tierName = name;
            this.amount = amount;
            this.currency = currency;
            this.durationMonths = months;
        }
    }

    public static final TierInfo[] TIERS = {
            new TierInfo(Constants.PREMIUM_LITE, "Pro Lite", "4.99", "USD", 1),
            new TierInfo(Constants.PREMIUM_PLUS, "Pro Plus", "9.99", "USD", 1),
            new TierInfo(Constants.PREMIUM_ULTIMATE, "Pro Ultimate", "19.99", "USD", 1),
            new TierInfo(Constants.PREMIUM_ULTIMATE, "Lifetime", "199.99", "USD", 0),
    };

    public interface PurchaseCallback {
        void onOrderCreated(String orderId, String approvalUrl);
        void onPaymentSuccess(String tier, String expiry);
        void onError(String message);
    }

    /**
     * Initiate a purchase — creates PayPal order and returns approval URL.
     */
    public static void startPurchase(final Context context, final TierInfo tier,
                                      final PurchaseCallback callback) {
        new AsyncTask<Void, Void, String[]>() {
            private String mError;

            @Override
            protected String[] doInBackground(Void... params) {
                UserManager um = UserManager.getInstance(context);
                String userId = um.isLoggedIn() ? um.getCurrentUser().getEmail() : "guest";
                String[] result = PayPalHelper.createOrder(
                        tier.amount, tier.currency, tier.tierName, userId);
                if (result == null) {
                    mError = "Failed to create PayPal order. Check your API keys.";
                } else if (result[1] == null) {
                    mError = "No approval URL returned.";
                }
                return result;
            }

            @Override
            protected void onPostExecute(String[] result) {
                if (result != null && result[1] != null) {
                    callback.onOrderCreated(result[0], result[1]);
                } else {
                    callback.onError(mError != null ? mError : "Unknown error");
                }
            }
        }.execute();
    }

    /**
     * Capture a PayPal payment after user approval.
     */
    public static void capturePayment(final Context context, final String orderId,
                                       final TierInfo tier, final PurchaseCallback callback) {
        new AsyncTask<Void, Void, Boolean>() {
            private String mError;

            @Override
            protected Boolean doInBackground(Void... params) {
                boolean captured = PayPalHelper.captureOrder(orderId);
                if (!captured) {
                    mError = "Payment capture failed.";
                    return false;
                }

                // Calculate expiry date
                String expiry = "";
                if (tier.durationMonths > 0) {
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.MONTH, tier.durationMonths);
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                    expiry = sdf.format(cal.getTime());
                } else {
                    // Lifetime
                    Calendar cal = Calendar.getInstance();
                    cal.add(Calendar.YEAR, 99);
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                    expiry = sdf.format(cal.getTime());
                }

                // Update server (JSONBin)
                UserManager um = UserManager.getInstance(context);
                if (um.isLoggedIn()) {
                    UserApiHelper.ApiResult apiResult = UserApiHelper.updateUserPremium(
                            um.getCurrentUser().getEmail(),
                            um.getCurrentUser().getProvider(),
                            tier.tierConstant,
                            expiry);
                    if (!apiResult.success) {
                        // Payment succeeded but server update failed — still activate locally
                        // In production, queue this for retry
                    }
                }

                // Update local PremiumManager
                PremiumManager pm = PremiumManager.getInstance(context);
                pm.setPremiumTier(tier.tierConstant);
                pm.setPremiumExpiry(expiry);

                // Update UserManager
                um.updatePremiumLocally(tier.tierConstant, expiry);

                return true;
            }

            @Override
            protected void onPostExecute(Boolean success) {
                if (success) {
                    // Calculate expiry for callback
                    String expiry = "";
                    if (tier.durationMonths > 0) {
                        Calendar cal = Calendar.getInstance();
                        cal.add(Calendar.MONTH, tier.durationMonths);
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                        expiry = sdf.format(cal.getTime());
                    } else {
                        Calendar cal = Calendar.getInstance();
                        cal.add(Calendar.YEAR, 99);
                        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
                        expiry = sdf.format(cal.getTime());
                    }
                    callback.onPaymentSuccess(tier.tierName, expiry);
                } else {
                    callback.onError(mError != null ? mError : "Payment failed");
                }
            }
        }.execute();
    }
}
