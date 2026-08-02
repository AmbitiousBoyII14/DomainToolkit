package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.PremiumManager;

/**
 * Premium upgrade screen.
 * Displays tier comparison and upgrade buttons.
 * Java 7 only; no lambdas.
 */
public class PremiumActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Palette.load(this);

        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(this);
        root.setPadding(dp(16), 0, dp(16), dp(80));

        // ---- Hero banner ----
        LinearLayout hero = buildHero();
        root.addView(hero);
        root.addView(UiKit.gap(this, 20));

        // ---- Current plan chip ----
        PremiumManager pm = PremiumManager.get();
        LinearLayout planRow = UiKit.row(this);
        planRow.setGravity(Gravity.CENTER);
        planRow.setPadding(0, 0, 0, dp(16));
        if (pm.isPro()) {
            planRow.addView(UiKit.pill(this, "PRO ACTIVE", Palette.success()));
        } else {
            planRow.addView(UiKit.pill(this, "FREE PLAN", Palette.textSecondary()));
        }
        root.addView(planRow);

        // ---- Tier cards ----
        root.addView(buildTierCard(
                "Pro Lite",
                "per month",
                getResources().getColor(R.color.blue_premium),
                new String[]{
                        "Remove ads",
                        "Unlimited scans per day",
                        "Unlimited exports",
                        "Unlimited history",
                        "Extra themes",
                        "Priority updates"
                },
                false
        ));
        root.addView(UiKit.gap(this, 12));

        root.addView(buildTierCard(
                "Pro Plus",
                "per month",
                getResources().getColor(R.color.purple_premium),
                new String[]{
                        "Everything in Pro Lite",
                        "Bulk WebSocket scanner",
                        "Bulk SSL checker",
                        "Bulk domain scanner",
                        "Unlimited port scans",
                        "Batch export",
                        "Advanced security score",
                        "Performance reports"
                },
                false
        ));
        root.addView(UiKit.gap(this, 12));

        root.addView(buildTierCard(
                "Pro Ultimate",
                "lifetime",
                getResources().getColor(R.color.gold),
                new String[]{
                        "Everything in Pro Plus",
                        "All future features",
                        "Scheduled scans",
                        "Background scanning",
                        "Advanced analytics",
                        "AI-powered scan summaries",
                        "Cloud backup & sync",
                        "Custom report branding",
                        "Priority support",
                        "Exclusive UI themes",
                        "Early beta access"
                },
                true
        ));

        // ---- Feature comparison table ----
        root.addView(UiKit.gap(this, 20));
        root.addView(UiKit.label(this, "Feature comparison"));
        root.addView(UiKit.gap(this, 8));
        root.addView(buildComparisonTable());

        // ---- Back button ----
        root.addView(UiKit.gap(this, 20));
        TextView backBtn = UiKit.secondaryButton(this, "Back");
        backBtn.setLayoutParams(UiKit.lpMatchWrap());
        backBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { finish(); }
        });
        root.addView(backBtn);

        sv.addView(root);
        setContentView(sv);
    }

    // ============================================================
    // Hero
    // ============================================================

    private LinearLayout buildHero() {
        LinearLayout hero = new LinearLayout(this);
        hero.setOrientation(LinearLayout.VERTICAL);
        hero.setGravity(Gravity.CENTER);
        hero.setPadding(dp(20), dp(48), dp(20), dp(32));

        GradientDrawable bg = new GradientDrawable(
                GradientDrawable.Orientation.TOP_BOTTOM,
                new int[]{getResources().getColor(R.color.gold),
                          getResources().getColor(R.color.card_premium_end)});
        hero.setBackground(bg);
        hero.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Animated crown icon
        ImageView crown = new ImageView(this);
        crown.setImageResource(R.drawable.ic_premium);
        crown.setColorFilter(Color.WHITE);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(56), dp(56));
        ilp.bottomMargin = dp(16);
        crown.setLayoutParams(ilp);
        crown.setContentDescription("Premium crown");
        hero.addView(crown);

        TextView h1 = new TextView(this);
        h1.setText("Unlock Domain Toolkit Pro");
        h1.setTextSize(24);
        h1.setTypeface(Typeface.DEFAULT_BOLD);
        h1.setTextColor(Color.WHITE);
        h1.setGravity(Gravity.CENTER);
        hero.addView(h1);

        TextView sub = new TextView(this);
        sub.setText("Professional-grade network analysis tools");
        sub.setTextSize(13);
        sub.setTextColor(0xCCFFFFFF);
        sub.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams slp = UiKit.lpWrapWrap();
        slp.topMargin = dp(6);
        sub.setLayoutParams(slp);
        hero.addView(sub);

        return hero;
    }

    // ============================================================
    // Tier card
    // ============================================================

    private LinearLayout buildTierCard(String tier, String period,
                                       int accentColor, String[] features,
                                       boolean highlight) {
        LinearLayout outer = UiKit.column(this);
        outer.setLayoutParams(UiKit.lpMatchWrap());

        LinearLayout card = UiKit.card(this);
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        card.setLayoutParams(clp);

        if (highlight) {
            // Gold border for the top tier
            GradientDrawable bg = new GradientDrawable();
            bg.setShape(GradientDrawable.RECTANGLE);
            bg.setColor(Palette.surface());
            bg.setCornerRadius(dp(16));
            bg.setStroke(dp(2), accentColor);
            card.setBackground(bg);
        }

        // Tier name + badge
        LinearLayout nameRow = UiKit.row(this);
        nameRow.setPadding(0, 0, 0, dp(4));

        TextView nameTv = new TextView(this);
        nameTv.setText(tier);
        nameTv.setTextSize(18);
        nameTv.setTypeface(Typeface.DEFAULT_BOLD);
        nameTv.setTextColor(accentColor);
        nameTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        nameRow.addView(nameTv);

        if (highlight) {
            nameRow.addView(UiKit.pill(this, "BEST VALUE", accentColor));
        }
        card.addView(nameRow);

        // Period
        TextView periodTv = UiKit.caption(this, "Billed " + period);
        LinearLayout.LayoutParams ptlp = UiKit.lpWrapWrap();
        ptlp.bottomMargin = dp(12);
        periodTv.setLayoutParams(ptlp);
        card.addView(periodTv);

        card.addView(UiKit.divider(this));
        card.addView(UiKit.gap(this, 10));

        // Feature list
        for (String feature : features) {
            LinearLayout featureRow = UiKit.row(this);
            featureRow.setPadding(0, dp(4), 0, dp(4));

            TextView check = new TextView(this);
            check.setText("\u2713");
            check.setTextSize(14);
            check.setTextColor(accentColor);
            check.setTypeface(Typeface.DEFAULT_BOLD);
            LinearLayout.LayoutParams fclp = new LinearLayout.LayoutParams(dp(24), ViewGroup.LayoutParams.WRAP_CONTENT);
            check.setLayoutParams(fclp);
            featureRow.addView(check);

            TextView featureTv = UiKit.body(this, feature);
            featureTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            featureRow.addView(featureTv);

            card.addView(featureRow);
        }

        card.addView(UiKit.gap(this, 14));

        // Upgrade button
        TextView upgradeBtn = UiKit.primaryButton(this, "Upgrade to " + tier);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setShape(GradientDrawable.RECTANGLE);
        btnBg.setColor(accentColor);
        btnBg.setCornerRadius(dp(12));
        upgradeBtn.setBackground(UiKit.pressable(this, btnBg, accentColor));
        upgradeBtn.setTextColor(Color.WHITE);
        upgradeBtn.setLayoutParams(UiKit.lpMatchWrap());
        final String tierName = tier;
        upgradeBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                // In production: launch Play Billing flow here.
                Toast.makeText(PremiumActivity.this,
                        "In-app purchase for " + tierName + " coming soon!",
                        Toast.LENGTH_SHORT).show();
            }
        });
        card.addView(upgradeBtn);

        outer.addView(card);
        return outer;
    }

    // ============================================================
    // Feature comparison table
    // ============================================================

    private LinearLayout buildComparisonTable() {
        LinearLayout card = UiKit.card(this);
        card.setLayoutParams(UiKit.lpMatchWrap());

        String[][] rows = {
                {"Feature",         "Free",   "Lite",    "Plus",    "Ultimate"},
                {"Scans / day",     "15",     "Unlimited","Unlimited","Unlimited"},
                {"Exports / day",   "2",      "Unlimited","Unlimited","Unlimited"},
                {"History items",   "25",     "5000",    "5000",    "Unlimited"},
                {"Bulk scans",      "No",     "No",      "Yes",     "Yes"},
                {"Port scans / day","5",      "Unlimited","Unlimited","Unlimited"},
                {"PDF export",      "No",     "No",      "Yes",     "Yes"},
                {"Ads",             "Yes",    "No",      "No",      "No"},
                {"Scheduled scans", "No",     "No",      "No",      "Yes"},
                {"AI summaries",    "No",     "No",      "No",      "Yes"},
        };

        for (int i = 0; i < rows.length; i++) {
            String[] row = rows[i];
            LinearLayout rowView = UiKit.row(this);
            rowView.setPadding(0, dp(8), 0, dp(8));

            boolean isHeader = i == 0;
            for (int j = 0; j < row.length; j++) {
                TextView cell = new TextView(this);
                cell.setText(row[j]);
                cell.setTextSize(isHeader ? 10 : 12);
                cell.setTextColor(isHeader ? Palette.textSecondary() : Palette.textPrimary());
                if (isHeader) cell.setTypeface(Typeface.DEFAULT_BOLD);
                cell.setGravity(j == 0 ? Gravity.START : Gravity.CENTER);
                float weight = j == 0 ? 2f : 1f;
                cell.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, weight));
                rowView.addView(cell);
            }
            card.addView(rowView);
            if (i < rows.length - 1) {
                card.addView(UiKit.divider(this));
            }
        }
        return card;
    }

    private int dp(int v) {
        return UiKit.dp(this, v);
    }
}
