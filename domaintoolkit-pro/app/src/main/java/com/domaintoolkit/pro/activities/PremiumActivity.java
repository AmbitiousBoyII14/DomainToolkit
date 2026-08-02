package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.models.User;
import com.domaintoolkit.pro.utils.Constants;
import com.domaintoolkit.pro.utils.PremiumManager;
import com.domaintoolkit.pro.utils.PurchaseManager;
import com.domaintoolkit.pro.utils.ThemeManager;
import com.domaintoolkit.pro.utils.UserManager;

/**
 * Premium subscription page with REAL PayPal payments.
 * Replaces old demo mode. Java 7 / AIDE compatible.
 */
public class PremiumActivity extends Activity {

    private PremiumManager mPremiumManager;
    private ThemeManager mThemeManager;
    private UserManager mUserManager;
    private ProgressDialog mProgressDialog;
    private String mPendingOrderId;
    private PurchaseManager.TierInfo mPendingTier;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        mThemeManager = ThemeManager.getInstance(this);
        mThemeManager.applyTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_premium);

        if (getActionBar() != null) {
            getActionBar().setDisplayHomeAsUpEnabled(true);
            getActionBar().setTitle("Premium");
        }

        mPremiumManager = PremiumManager.getInstance(this);
        mUserManager = UserManager.getInstance(this);

        setupCardButton(R.id.card_lite,
                new PurchaseManager.TierInfo(Constants.PREMIUM_LITE, "Pro Lite", "4.99", "USD", 1));
        setupCardButton(R.id.card_plus,
                new PurchaseManager.TierInfo(Constants.PREMIUM_PLUS, "Pro Plus", "9.99", "USD", 1));
        setupCardButton(R.id.card_ultimate,
                new PurchaseManager.TierInfo(Constants.PREMIUM_ULTIMATE, "Pro Ultimate", "19.99", "USD", 1));
        setupCardButton(R.id.card_lifetime,
                new PurchaseManager.TierInfo(Constants.PREMIUM_ULTIMATE, "Lifetime", "199.99", "USD", 0));
    }

    private void setupCardButton(int cardLayoutId, final PurchaseManager.TierInfo tier) {
        View cardLayout = findViewById(cardLayoutId);
        if (cardLayout == null) return;

        final Button btn = findButtonRecursive(cardLayout);
        if (btn == null) return;

        boolean isCurrent = mPremiumManager.getPremiumTier().equals(tier.tierConstant) &&
                mPremiumManager.isPremiumValid();
        if (isCurrent) {
            btn.setText("Current Plan");
            btn.setEnabled(false);
            btn.setAlpha(0.5f);
        } else {
            btn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    startRealPurchase(tier);
                }
            });
        }
    }

    /**
     * Start real PayPal purchase flow.
     */
    private void startRealPurchase(final PurchaseManager.TierInfo tier) {
        // Check if user is signed in
        if (!mUserManager.isLoggedIn()) {
            new AlertDialog.Builder(this)
                    .setTitle("Sign In Required")
                    .setMessage("Please sign in before purchasing to sync your premium across devices.")
                    .setPositiveButton("Sign In", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            startActivity(new Intent(PremiumActivity.this, SignInActivity.class));
                        }
                    })
                    .setNegativeButton("Continue as Guest", new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            proceedWithPurchase(tier);
                        }
                    })
                    .show();
            return;
        }
        proceedWithPurchase(tier);
    }

    private void proceedWithPurchase(final PurchaseManager.TierInfo tier) {
        mProgressDialog = ProgressDialog.show(this, "Creating Order",
                "Connecting to PayPal...", true, false);

        PurchaseManager.startPurchase(this, tier, new PurchaseManager.PurchaseCallback() {
            @Override
            public void onOrderCreated(String orderId, String approvalUrl) {
                mProgressDialog.dismiss();
                mPendingOrderId = orderId;
                mPendingTier = tier;

                // Open PayPal checkout in browser
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(approvalUrl));
                startActivityForResult(browserIntent, Constants.RC_PAYPAL_CHECKOUT);

                Toast.makeText(PremiumActivity.this,
                        "Complete payment in your browser, then return here.",
                        Toast.LENGTH_LONG).show();
            }

            @Override
            public void onPaymentSuccess(String tierName, String expiry) {
                // Not used here — handled after browser returns
            }

            @Override
            public void onError(String message) {
                mProgressDialog.dismiss();
                new AlertDialog.Builder(PremiumActivity.this)
                        .setTitle("Payment Error")
                        .setMessage(message + "\n\nMake sure you have set your PayPal API keys in Constants.java")
                        .setPositiveButton("OK", null)
                        .show();
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == Constants.RC_PAYPAL_CHECKOUT) {
            // User returned from PayPal browser checkout
            if (mPendingOrderId != null && mPendingTier != null) {
                mProgressDialog = ProgressDialog.show(this, "Processing Payment",
                        "Capturing payment...", true, false);

                PurchaseManager.capturePayment(this, mPendingOrderId, mPendingTier,
                        new PurchaseManager.PurchaseCallback() {
                            @Override
                            public void onOrderCreated(String orderId, String approvalUrl) {}

                            @Override
                            public void onPaymentSuccess(String tierName, String expiry) {
                                mProgressDialog.dismiss();
                                new AlertDialog.Builder(PremiumActivity.this)
                                        .setTitle("Payment Successful!")
                                        .setMessage("Welcome to " + tierName + "!\n" +
                                                "Your premium is active until " + expiry + ".")
                                        .setPositiveButton("Awesome!", new DialogInterface.OnClickListener() {
                                            @Override
                                            public void onClick(DialogInterface dialog, int which) {
                                                finish();
                                            }
                                        })
                                        .show();
                            }

                            @Override
                            public void onError(String message) {
                                mProgressDialog.dismiss();
                                new AlertDialog.Builder(PremiumActivity.this)
                                        .setTitle("Payment Issue")
                                        .setMessage(message + "\n\n" +
                                                "If payment was completed, it may take a moment to process. " +
                                                "Please try again or contact support.")
                                        .setPositiveButton("Try Again", new DialogInterface.OnClickListener() {
                                            @Override
                                            public void onClick(DialogInterface dialog, int which) {
                                                proceedWithPurchase(mPendingTier);
                                            }
                                        })
                                        .setNegativeButton("Cancel", null)
                                        .show();
                            }
                        });
            }
        }
    }

    private Button findButtonRecursive(View parent) {
        if (parent instanceof Button) return (Button) parent;
        if (parent instanceof ViewGroup) {
            ViewGroup vg = (ViewGroup) parent;
            for (int i = 0; i < vg.getChildCount(); i++) {
                Button found = findButtonRecursive(vg.getChildAt(i));
                if (found != null) return found;
            }
        }
        return null;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
