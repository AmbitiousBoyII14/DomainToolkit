package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.app.Fragment;
import android.app.FragmentTransaction;
import android.content.Intent;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.TranslateAnimation;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.fragments.AllInOneFragment;
import com.domaintoolkit.pro.fragments.DomainToolsFragment;
import com.domaintoolkit.pro.fragments.FavoritesFragment;
import com.domaintoolkit.pro.fragments.HistoryFragment;
import com.domaintoolkit.pro.fragments.HomeFragment;
import com.domaintoolkit.pro.fragments.HostingDetectionFragment;
import com.domaintoolkit.pro.fragments.NetworkToolsFragment;
import com.domaintoolkit.pro.fragments.SSLToolsFragment;
import com.domaintoolkit.pro.fragments.SecurityToolsFragment;
import com.domaintoolkit.pro.fragments.WebSocketFragment;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.PremiumManager;

/**
 * Root Activity: navigation drawer + fragment host.
 *
 * - No AndroidX / AppCompat dependency.
 * - All views built programmatically so Palette dark/light applies at runtime.
 * - Java 7 only; no lambdas.
 */
public class MainActivity extends Activity {

    // ---- Content frame ID (avoids android.R.id.content which belongs to the framework) ----
    private static final int FRAME_ID = 0x7F090001;

    // ---- Navigation items ----
    private static final String[] NAV_TITLES = {
            "Home", "All-In-One Scan", "Domain Tools", "SSL / TLS",
            "WebSocket", "Network Tools", "Hosting / CDN", "Security Headers",
            "History", "Favorites", "Premium", "Settings", "About"
    };
    private static final int[] NAV_ICONS = {
            R.drawable.ic_home, R.drawable.ic_scan, R.drawable.ic_domain, R.drawable.ic_ssl,
            R.drawable.ic_websocket, R.drawable.ic_network, R.drawable.ic_hosting,
            R.drawable.ic_security, R.drawable.ic_history, R.drawable.ic_favorite,
            R.drawable.ic_premium, R.drawable.ic_settings, R.drawable.ic_about
    };

    private LinearLayout drawerPanel;
    private View scrimOverlay;
    private TextView toolbarTitle;
    private boolean drawerOpen;
    private int currentIndex = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Palette.load(this);

        // ---- Root: FrameLayout so drawer slides on top of content ----
        FrameLayout root = new FrameLayout(this);
        root.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.setBackgroundColor(Palette.bg());

        // ---- Main column (toolbar + content) ----
        LinearLayout mainCol = UiKit.column(this);
        mainCol.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        mainCol.setBackgroundColor(Palette.bg());

        mainCol.addView(buildToolbar());

        FrameLayout contentFrame = new FrameLayout(this);
        contentFrame.setId(FRAME_ID);
        contentFrame.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        mainCol.addView(contentFrame);
        root.addView(mainCol);

        // ---- Scrim overlay ----
        scrimOverlay = new View(this);
        scrimOverlay.setBackgroundColor(Palette.scrim());
        scrimOverlay.setVisibility(View.GONE);
        scrimOverlay.setLayoutParams(new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        scrimOverlay.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                closeDrawer();
            }
        });
        root.addView(scrimOverlay);

        // ---- Navigation drawer panel ----
        drawerPanel = buildDrawer();
        FrameLayout.LayoutParams dlp = new FrameLayout.LayoutParams(
                dp(296), ViewGroup.LayoutParams.MATCH_PARENT);
        dlp.gravity = Gravity.START;
        drawerPanel.setLayoutParams(dlp);
        drawerPanel.setTranslationX(-dp(296)); // start off-screen
        root.addView(drawerPanel);

        setContentView(root);
        selectNav(0);
    }

    // ============================================================
    // Toolbar
    // ============================================================

    private LinearLayout buildToolbar() {
        LinearLayout tb = UiKit.row(this);
        tb.setBackgroundColor(Palette.primary());
        tb.setPadding(dp(4), dp(2), dp(12), dp(2));
        tb.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(56)));

        ImageView menuBtn = UiKit.iconButton(this, R.drawable.ic_menu,
                Palette.onPrimary(), getString(R.string.action_open_menu));
        menuBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                toggleDrawer();
            }
        });
        tb.addView(menuBtn);

        toolbarTitle = new TextView(this);
        toolbarTitle.setText(NAV_TITLES[0]);
        toolbarTitle.setTextColor(Palette.onPrimary());
        toolbarTitle.setTextSize(18);
        toolbarTitle.setTypeface(Typeface.DEFAULT_BOLD);
        toolbarTitle.setPadding(dp(8), 0, 0, 0);
        toolbarTitle.setLayoutParams(new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        tb.addView(toolbarTitle);

        return tb;
    }

    // ============================================================
    // Drawer
    // ============================================================

    private LinearLayout buildDrawer() {
        LinearLayout panel = UiKit.column(this);
        panel.setBackgroundColor(Palette.surface());

        // Header
        LinearLayout header = UiKit.column(this);
        header.setBackgroundColor(Palette.primaryDark());
        header.setPadding(dp(20), dp(40), dp(20), dp(20));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher_fg);
        logo.setColorFilter(Palette.onPrimary());
        LinearLayout.LayoutParams logoLp = new LinearLayout.LayoutParams(dp(48), dp(48));
        logoLp.bottomMargin = dp(10);
        logo.setLayoutParams(logoLp);
        logo.setContentDescription(getString(R.string.app_name));
        header.addView(logo);

        TextView appName = new TextView(this);
        appName.setText(getString(R.string.app_name));
        appName.setTextSize(18);
        appName.setTypeface(Typeface.DEFAULT_BOLD);
        appName.setTextColor(Palette.onPrimary());
        header.addView(appName);

        TextView tagline = new TextView(this);
        tagline.setText(getString(R.string.app_tagline));
        tagline.setTextSize(12);
        tagline.setTextColor(0xCCFFFFFF);
        tagline.setPadding(0, dp(2), 0, 0);
        header.addView(tagline);

        PremiumManager pm = PremiumManager.get();
        if (pm.isPro()) {
            TextView badge = new TextView(this);
            badge.setText("PRO");
            badge.setTextSize(10);
            badge.setTypeface(Typeface.DEFAULT_BOLD);
            badge.setTextColor(getResources().getColor(R.color.gold));
            badge.setPadding(dp(8), dp(3), dp(8), dp(3));
            GradientDrawable bg = new GradientDrawable();
            bg.setShape(GradientDrawable.RECTANGLE);
            bg.setColor(0x33F9A825);
            bg.setCornerRadius(dp(999));
            badge.setBackground(bg);
            LinearLayout.LayoutParams blp = UiKit.lpWrapWrap();
            blp.topMargin = dp(6);
            badge.setLayoutParams(blp);
            header.addView(badge);
        }
        panel.addView(header);

        // Nav items in a scroll view
        ScrollView sv = new ScrollView(this);
        sv.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        LinearLayout list = UiKit.column(this);
        list.setPadding(0, dp(8), 0, dp(24));
        for (int i = 0; i < NAV_TITLES.length; i++) {
            list.addView(buildNavItem(i));
        }
        sv.addView(list);
        panel.addView(sv);

        return panel;
    }

    private View buildNavItem(final int index) {
        LinearLayout row = UiKit.row(this);
        row.setPadding(dp(16), dp(13), dp(16), dp(13));
        row.setClickable(true);
        row.setFocusable(true);
        row.setBackground(UiKit.pressable(this,
                UiKit.solid(this, Palette.surface(), 0), Palette.primary()));

        ImageView icon = new ImageView(this);
        icon.setImageResource(NAV_ICONS[index]);
        icon.setColorFilter(index == currentIndex ? Palette.primary() : Palette.textSecondary());
        icon.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        int iconSz = dp(22);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(iconSz, iconSz);
        ilp.rightMargin = dp(14);
        icon.setLayoutParams(ilp);
        icon.setContentDescription(NAV_TITLES[index]);
        row.addView(icon);

        TextView label = new TextView(this);
        label.setText(NAV_TITLES[index]);
        label.setTextSize(14.5f);
        label.setTextColor(index == currentIndex ? Palette.primary() : Palette.textPrimary());
        if (index == currentIndex) {
            label.setTypeface(Typeface.DEFAULT_BOLD);
        }
        row.addView(label);

        // Active indicator bar on the left
        if (index == currentIndex) {
            View indicator = new View(this);
            FrameLayout wrap = new FrameLayout(this);
            wrap.setLayoutParams(new LinearLayout.LayoutParams(dp(4), ViewGroup.LayoutParams.MATCH_PARENT));
            GradientDrawable ind = new GradientDrawable();
            ind.setShape(GradientDrawable.RECTANGLE);
            ind.setColor(Palette.primary());
            ind.setCornerRadius(dp(2));
            indicator.setBackground(ind);
            indicator.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            wrap.addView(indicator);
            // Prepend to row — but since we can't prepend easily, just color the text
        }

        row.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                selectNav(index);
                closeDrawer();
            }
        });
        return row;
    }

    // ============================================================
    // Drawer animation
    // ============================================================

    private void toggleDrawer() {
        if (drawerOpen) {
            closeDrawer();
        } else {
            openDrawer();
        }
    }

    private void openDrawer() {
        if (drawerOpen) return;
        drawerOpen = true;
        scrimOverlay.setVisibility(View.VISIBLE);
        scrimOverlay.setAlpha(0f);
        scrimOverlay.animate().alpha(1f).setDuration(220)
                .setInterpolator(new DecelerateInterpolator()).start();
        drawerPanel.animate().translationX(0).setDuration(260)
                .setInterpolator(new DecelerateInterpolator()).start();
    }

    private void closeDrawer() {
        if (!drawerOpen) return;
        drawerOpen = false;
        scrimOverlay.animate().alpha(0f).setDuration(200)
                .setInterpolator(new DecelerateInterpolator()).withEndAction(new Runnable() {
                    public void run() {
                        scrimOverlay.setVisibility(View.GONE);
                    }
                }).start();
        drawerPanel.animate().translationX(-dp(296)).setDuration(240)
                .setInterpolator(new DecelerateInterpolator()).start();
    }

    // ============================================================
    // Navigation
    // ============================================================

    /** Navigate to a drawer item by index. Called from fragments (Home cards). */
    public void selectNav(int index) {
        if (index == currentIndex) {
            return;
        }
        currentIndex = index;

        // Special cases that launch a separate Activity
        if (index == 11) { // Settings
            startActivity(new Intent(this, SettingsActivity.class));
            return;
        }
        if (index == 12) { // About
            startActivity(new Intent(this, AboutActivity.class));
            return;
        }
        if (index == 10) { // Premium
            startActivity(new Intent(this, PremiumActivity.class));
            return;
        }

        Fragment frag = createFragment(index);
        if (frag == null) return;

        toolbarTitle.setText(NAV_TITLES[index]);

        FragmentTransaction ft = getFragmentManager().beginTransaction();
        ft.setTransition(FragmentTransaction.TRANSIT_FRAGMENT_FADE);
        ft.replace(FRAME_ID, frag);
        ft.commit();

        // Rebuild drawer to update active indicator
        rebuildDrawerList();
    }

    private void rebuildDrawerList() {
        // The drawer panel's second child is the ScrollView containing the list.
        if (drawerPanel.getChildCount() < 2) return;
        View sv = drawerPanel.getChildAt(1);
        if (!(sv instanceof ScrollView)) return;
        LinearLayout list = (LinearLayout) ((ScrollView) sv).getChildAt(0);
        if (list == null) return;
        list.removeAllViews();
        for (int i = 0; i < NAV_TITLES.length; i++) {
            list.addView(buildNavItem(i));
        }
    }

    private Fragment createFragment(int index) {
        switch (index) {
            case 0:  return new HomeFragment();
            case 1:  return new AllInOneFragment();
            case 2:  return new DomainToolsFragment();
            case 3:  return new SSLToolsFragment();
            case 4:  return new WebSocketFragment();
            case 5:  return new NetworkToolsFragment();
            case 6:  return new HostingDetectionFragment();
            case 7:  return new SecurityToolsFragment();
            case 8:  return new HistoryFragment();
            case 9:  return new FavoritesFragment();
            default: return null;
        }
    }

    @Override
    public void onBackPressed() {
        if (drawerOpen) {
            closeDrawer();
        } else {
            super.onBackPressed();
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private int dp(int v) {
        return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
    }
}
