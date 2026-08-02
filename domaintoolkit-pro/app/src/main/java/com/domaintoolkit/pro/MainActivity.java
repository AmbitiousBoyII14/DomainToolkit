package com.domaintoolkit.pro;

import android.app.Activity;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.TranslateAnimation;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.ListView;

import com.domaintoolkit.pro.activities.SignInActivity;
import com.domaintoolkit.pro.utils.Constants;
import com.domaintoolkit.pro.utils.PremiumManager;
import com.domaintoolkit.pro.utils.ThemeManager;
import com.domaintoolkit.pro.utils.UserManager;

/**
 * Main entry point. Native ActionBar with custom slide-in drawer.
 * Now with sign-in integration and new feature navigation.
 * Zero support libraries. Java 7 compatible.
 */
public class MainActivity extends Activity {

    private ListView mDrawerList;
    private ThemeManager mThemeManager;
    private View mDrawerPanel;
    private boolean mDrawerOpen;
    private UserManager mUserManager;
    private PremiumManager mPremiumManager;

    private static final String[] NAV_ITEMS = {
            "\uD83C\uDFE0 Home",
            "\u2B50 All-In-One Scan",
            "\uD83C\uDF10 Domain Tools",
            "\uD83D\uDD12 SSL/TLS Tools",
            "\u26A1 WebSocket Tools",
            "\uD83D\uDCE1 Network Tools",
            "\u2601 Hosting/CDN Detection",
            "\uD83D\uDEE1 Security Tools",
            "\uD83C\uDF0D IP Geolocation",
            "\uD83D\uDCE7 Email Verifier",
            "\uD83D\uDD13 Breach Check",
            "\uD83D\uDD17 Redirect Tracer",
            "\uD83D\uDCC2 History",
            "\u2B50 Favorites",
            "\uD83D\uDC51 Premium",
            "\uD83D\uDC64 Sign In",
            "\u2699 Settings",
            "\u2139 About"
    };

    private static final String[] NAV_ACTIONS = {
            "home", "allinone", "domain", "ssl", "websocket",
            "network", "hosting", "security", "geoip",
            "email", "breach", "redirect",
            "history", "favorites", "premium", "signin",
            "settings", "about"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        mThemeManager = ThemeManager.getInstance(this);
        mThemeManager.applyTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mUserManager = UserManager.getInstance(this);
        mPremiumManager = PremiumManager.getInstance(this);

        // Color the action bar with accent
        android.app.ActionBar ab = getActionBar();
        if (ab != null) {
            ab.setBackgroundDrawable(
                    new ColorDrawable(mThemeManager.getAccentColor()));
            ab.setDisplayHomeAsUpEnabled(true);
        }

        setupDrawer();

        if (savedInstanceState == null) {
            navigateTo("home");
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Add sign-in status to action bar
        if (mUserManager.isLoggedIn()) {
            String name = mUserManager.getCurrentUser().getDisplayName();
            if (name != null && !name.isEmpty()) {
                menu.add(0, 100, 0, name).setShowAsAction(
                        MenuItem.SHOW_AS_ACTION_ALWAYS);
            }
        }
        return true;
    }

    private void setupDrawer() {
        mDrawerPanel = findViewById(R.id.left_drawer);
        mDrawerList = (ListView) findViewById(R.id.left_drawer);
        mDrawerOpen = false;

        ArrayAdapter<String> adapter = new ArrayAdapter<String>(
                this,
                R.layout.item_drawer,
                R.id.drawer_item_text,
                NAV_ITEMS);
        mDrawerList.setAdapter(adapter);

        mDrawerList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view,
                                     int position, long id) {
                String action = NAV_ACTIONS[position];

                // Feature-gate premium features
                if ("geoip".equals(action) && !mPremiumManager.canUseGeoIp()) {
                    showPremiumGate("IP Geolocation", "Pro Plus");
                    return;
                }
                if ("email".equals(action) && !mPremiumManager.canVerifyEmail()) {
                    showPremiumGate("Email Verifier", "Pro Plus");
                    return;
                }
                if ("breach".equals(action) && !mPremiumManager.canCheckBreaches()) {
                    showPremiumGate("Breach Check", "Pro Ultimate");
                    return;
                }
                if ("redirect".equals(action) && !mPremiumManager.canTraceRedirects()) {
                    showPremiumGate("Redirect Tracer", "Premium");
                    return;
                }

                navigateTo(action);
                toggleDrawer();
            }
        });
    }

    private void showPremiumGate(String feature, String requiredTier) {
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
        builder.setTitle("Premium Feature")
                .setMessage(feature + " requires " + requiredTier + ".\n\nUpgrade to unlock this tool.")
                .setPositiveButton("Upgrade", new android.content.DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(android.content.DialogInterface dialog, int which) {
                        navigateTo("premium");
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            toggleDrawer();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void toggleDrawer() {
        if (mDrawerPanel == null) return;
        if (mDrawerOpen) {
            TranslateAnimation out = new TranslateAnimation(
                    0, -mDrawerPanel.getWidth(), 0, 0);
            out.setDuration(250);
            out.setAnimationListener(new Animation.AnimationListener() {
                public void onAnimationStart(Animation a) {}
                public void onAnimationEnd(Animation a) {
                    mDrawerPanel.setVisibility(View.GONE);
                }
                public void onAnimationRepeat(Animation a) {}
            });
            mDrawerPanel.startAnimation(out);
            mDrawerOpen = false;
        } else {
            mDrawerPanel.setVisibility(View.VISIBLE);
            TranslateAnimation in = new TranslateAnimation(
                    -mDrawerPanel.getWidth(), 0, 0, 0);
            in.setDuration(250);
            mDrawerPanel.startAnimation(in);
            mDrawerOpen = true;
        }
    }

    private void navigateTo(String action) {
        Intent intent = null;
        if ("home".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.HomeActivity.class);
        else if ("allinone".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.AllInOneScanActivity.class);
        else if ("domain".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.DomainToolsActivity.class);
        else if ("ssl".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.SslToolsActivity.class);
        else if ("websocket".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.WebSocketToolsActivity.class);
        else if ("network".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.NetworkToolsActivity.class);
        else if ("hosting".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.HostingDetectionActivity.class);
        else if ("security".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.SecurityToolsActivity.class);
        else if ("history".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.HistoryActivity.class);
        else if ("favorites".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.FavoritesActivity.class);
        else if ("premium".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.PremiumActivity.class);
        else if ("signin".equals(action))
            intent = new Intent(this, SignInActivity.class);
        else if ("settings".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.SettingsActivity.class);
        else if ("about".equals(action))
            intent = new Intent(this, com.domaintoolkit.pro.activities.AboutActivity.class);

        if (intent != null) startActivity(intent);
    }
}
