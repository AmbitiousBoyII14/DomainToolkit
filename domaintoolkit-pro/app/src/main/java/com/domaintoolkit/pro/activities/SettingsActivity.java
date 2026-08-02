package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.PremiumManager;
import com.domaintoolkit.pro.utils.ThemeManager;

/**
 * Settings screen.
 * Theme picker, accent colour picker, quota debug toggle.
 * Java 7 only; no lambdas.
 */
public class SettingsActivity extends Activity {

    private static final int[] ACCENT_COLORS = {
            0xFF1A73E8, // Blue (default)
            0xFF0097A7, // Teal
            0xFF388E3C, // Green
            0xFFF57C00, // Orange
            0xFFD32F2F, // Red
            0xFF7B1FA2, // Purple
            0xFF00838F, // Cyan
            0xFF455A64  // Steel
    };
    private static final String[] ACCENT_NAMES = {
            "Blue", "Teal", "Green", "Orange", "Red", "Purple", "Cyan", "Steel"
    };

    private ThemeManager themeManager;
    private PremiumManager premiumManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Palette.load(this);
        themeManager = ThemeManager.get();
        premiumManager = PremiumManager.get();

        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(this);
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        // Back toolbar
        LinearLayout toolbar = buildToolbar("Settings");
        root.addView(toolbar);
        root.addView(UiKit.gap(this, 16));

        // ---- Theme section ----
        root.addView(UiKit.label(this, "Appearance"));
        root.addView(UiKit.gap(this, 8));

        LinearLayout themeCard = UiKit.card(this);
        themeCard.setLayoutParams(UiKit.lpMatchWrap());
        themeCard.addView(UiKit.body(this, "Theme Mode"));
        root.addView(themeCard);

        Spinner themeSpinner = new Spinner(this);
        ArrayAdapter<String> themeAdapter = new ArrayAdapter<String>(
                this, android.R.layout.simple_spinner_dropdown_item,
                new String[]{"Light", "Dark", "System Default"});
        themeSpinner.setAdapter(themeAdapter);
        themeSpinner.setSelection(themeManager.getMode());
        LinearLayout.LayoutParams tslp = UiKit.lpMatchWrap();
        tslp.topMargin = dp(8);
        themeSpinner.setLayoutParams(tslp);
        themeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            public void onItemSelected(AdapterView<?> parent, View view, int pos, long id) {
                themeManager.setMode(pos);
                Palette.load(SettingsActivity.this);
            }
            public void onNothingSelected(AdapterView<?> parent) {}
        });
        themeCard.addView(themeSpinner);

        // ---- Accent colour section ----
        root.addView(UiKit.gap(this, 16));
        root.addView(UiKit.label(this, "Accent Color"));
        root.addView(UiKit.gap(this, 8));

        LinearLayout accentCard = UiKit.card(this);
        accentCard.setLayoutParams(UiKit.lpMatchWrap());

        TextView currentAccentLabel = UiKit.caption(this,
                "Current: " + nameForAccent(themeManager.getAccent()));
        accentCard.addView(currentAccentLabel);
        accentCard.addView(UiKit.gap(this, 10));

        // Colour swatches
        LinearLayout swatchRow = new LinearLayout(this);
        swatchRow.setOrientation(LinearLayout.HORIZONTAL);
        swatchRow.setLayoutParams(UiKit.lpMatchWrap());

        final TextView accentLabelRef = currentAccentLabel;
        for (int i = 0; i < ACCENT_COLORS.length; i++) {
            final int color = ACCENT_COLORS[i];
            final String name = ACCENT_NAMES[i];
            View swatch = new View(this);
            int sz = dp(36);
            LinearLayout.LayoutParams slp = new LinearLayout.LayoutParams(sz, sz);
            slp.rightMargin = dp(8);
            slp.bottomMargin = dp(8);
            swatch.setLayoutParams(slp);
            GradientDrawable bg = new GradientDrawable();
            bg.setShape(GradientDrawable.OVAL);
            bg.setColor(color);
            if (color == themeManager.getAccent()) {
                bg.setStroke(dp(2), Palette.textPrimary());
            }
            swatch.setBackground(bg);
            swatch.setClickable(true);
            swatch.setFocusable(true);
            swatch.setContentDescription(name);
            swatch.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    themeManager.setAccent(color);
                    accentLabelRef.setText("Current: " + name);
                    Toast.makeText(SettingsActivity.this,
                            "Accent set to " + name + ". Restart app to apply fully.",
                            Toast.LENGTH_SHORT).show();
                }
            });
            swatchRow.addView(swatch);
        }
        accentCard.addView(swatchRow);
        root.addView(accentCard);

        // ---- Export settings ----
        root.addView(UiKit.gap(this, 16));
        root.addView(UiKit.label(this, "Export"));
        root.addView(UiKit.gap(this, 8));

        LinearLayout exportCard = UiKit.card(this);
        exportCard.setLayoutParams(UiKit.lpMatchWrap());

        exportCard.addView(UiKit.kv(this,
                "Exports left today", String.valueOf(premiumManager.exportsLeft())));
        exportCard.addView(UiKit.divider(this));
        exportCard.addView(UiKit.kv(this,
                "Export folder", "Android/data/com.domaintoolkit.pro/files/exports"));

        root.addView(exportCard);

        // ---- Account section ----
        root.addView(UiKit.gap(this, 16));
        root.addView(UiKit.label(this, "Account"));
        root.addView(UiKit.gap(this, 8));

        LinearLayout accountCard = UiKit.card(this);
        accountCard.setLayoutParams(UiKit.lpMatchWrap());

        accountCard.addView(UiKit.kv(this, "Plan", premiumManager.tierName()));
        accountCard.addView(UiKit.divider(this));
        accountCard.addView(UiKit.kv(this, "Scans left today",
                premiumManager.isPro() ? "Unlimited" : String.valueOf(premiumManager.scansLeft())));
        accountCard.addView(UiKit.divider(this));

        // Debug toggle (developers only; harmless in release builds)
        TextView debugBtn = UiKit.ghostButton(this,
                premiumManager.isPro() ? "Remove Pro (debug)" : "Simulate Pro (debug)");
        debugBtn.setTextSize(12);
        debugBtn.setTextColor(Palette.textSecondary());
        debugBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                premiumManager.setPro(!premiumManager.isPro());
                Toast.makeText(SettingsActivity.this,
                        "Pro = " + premiumManager.isPro(), Toast.LENGTH_SHORT).show();
                recreate();
            }
        });
        accountCard.addView(debugBtn);
        root.addView(accountCard);

        // ---- App info ----
        root.addView(UiKit.gap(this, 16));
        root.addView(UiKit.label(this, "About"));
        root.addView(UiKit.gap(this, 8));

        LinearLayout infoCard = UiKit.card(this);
        infoCard.setLayoutParams(UiKit.lpMatchWrap());
        infoCard.addView(UiKit.kv(this, "App", getString(R.string.app_name)));
        infoCard.addView(UiKit.divider(this));
        infoCard.addView(UiKit.kv(this, "Version", "2.0"));
        root.addView(infoCard);

        sv.addView(root);
        setContentView(sv);
    }

    private LinearLayout buildToolbar(String title) {
        LinearLayout tb = UiKit.row(this);
        tb.setBackgroundColor(Palette.primary());
        tb.setPadding(dp(4), dp(4), dp(12), dp(4));
        LinearLayout.LayoutParams tblp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(56));
        tblp.bottomMargin = dp(4);
        tb.setLayoutParams(tblp);

        android.widget.ImageView back = UiKit.iconButton(this, R.drawable.ic_back,
                Palette.onPrimary(), "Back");
        back.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { finish(); }
        });
        tb.addView(back);

        TextView titleTv = new TextView(this);
        titleTv.setText(title);
        titleTv.setTextColor(Palette.onPrimary());
        titleTv.setTextSize(18);
        titleTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        titleTv.setPadding(dp(8), 0, 0, 0);
        tb.addView(titleTv);

        return tb;
    }

    private String nameForAccent(int color) {
        for (int i = 0; i < ACCENT_COLORS.length; i++) {
            if (ACCENT_COLORS[i] == color) return ACCENT_NAMES[i];
        }
        return "Custom";
    }

    private void recreate() {
        finish();
        startActivity(getIntent());
    }

    private int dp(int v) {
        return UiKit.dp(this, v);
    }
}
