package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;

/**
 * About screen – app info, version, links.
 * Java 7 only; no lambdas.
 */
public class AboutActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Palette.load(this);

        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(this);
        root.setPadding(dp(16), 0, dp(16), dp(80));

        // ---- Hero ----
        LinearLayout hero = buildHero();
        root.addView(hero);
        root.addView(UiKit.gap(this, 20));

        // ---- App info card ----
        LinearLayout infoCard = UiKit.card(this);
        infoCard.setLayoutParams(UiKit.lpMatchWrap());

        infoCard.addView(UiKit.kv(this, "App Name",    getString(R.string.app_name)));
        infoCard.addView(UiKit.divider(this));
        infoCard.addView(UiKit.kv(this, "Version",     "2.0"));
        infoCard.addView(UiKit.divider(this));
        infoCard.addView(UiKit.kv(this, "Minimum SDK", "Android 7.0 (API 24)"));
        infoCard.addView(UiKit.divider(this));
        infoCard.addView(UiKit.kv(this, "Language",    "Java 7"));
        infoCard.addView(UiKit.divider(this));
        infoCard.addView(UiKit.kv(this, "License",     "Proprietary"));
        root.addView(infoCard);
        root.addView(UiKit.gap(this, 16));

        // ---- Features card ----
        root.addView(UiKit.label(this, "What this app does"));
        root.addView(UiKit.gap(this, 8));
        LinearLayout featuresCard = UiKit.card(this);
        featuresCard.setLayoutParams(UiKit.lpMatchWrap());

        String[] features = {
                "DNS over HTTPS lookups (A, AAAA, MX, TXT, CNAME, NS, SOA, CAA)",
                "Full TLS/SSL certificate inspection with trust verdict",
                "RFC 6455 WebSocket detection across common paths",
                "Hosting and CDN provider fingerprinting",
                "Security headers scoring (CSP, HSTS, X-Frame, XSS)",
                "Port scanner with common service mapping",
                "WHOIS via RDAP API",
                "Subdomain discovery",
                "HTTP redirect chain walk",
                "Export to TXT, CSV, JSON",
                "Offline-safe SQLite history"
        };
        for (int i = 0; i < features.length; i++) {
            LinearLayout row = UiKit.row(this);
            row.setPadding(0, dp(6), 0, dp(6));
            TextView bullet = new TextView(this);
            bullet.setText("\u2022");
            bullet.setTextSize(14);
            bullet.setTextColor(Palette.primary());
            LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(dp(20), ViewGroup.LayoutParams.WRAP_CONTENT);
            bullet.setLayoutParams(blp);
            row.addView(bullet);
            TextView tv = UiKit.body(this, features[i]);
            tv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            row.addView(tv);
            featuresCard.addView(row);
            if (i < features.length - 1) {
                featuresCard.addView(UiKit.divider(this));
            }
        }
        root.addView(featuresCard);
        root.addView(UiKit.gap(this, 16));

        // ---- Privacy + Back ----
        root.addView(UiKit.label(this, "Privacy"));
        root.addView(UiKit.gap(this, 8));
        LinearLayout privacyCard = UiKit.card(this);
        privacyCard.setLayoutParams(UiKit.lpMatchWrap());
        TextView privacyBody = UiKit.body(this,
                "Domain Toolkit Pro does not collect personal data. "
                + "All scan results are stored locally on your device. "
                + "Network requests are made only when you explicitly start a scan.");
        privacyBody.setLineSpacing(0, 1.4f);
        privacyCard.addView(privacyBody);
        root.addView(privacyCard);
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

    private LinearLayout buildHero() {
        LinearLayout hero = UiKit.column(this);
        hero.setGravity(Gravity.CENTER);
        hero.setBackgroundColor(Palette.primary());
        hero.setPadding(dp(20), dp(48), dp(20), dp(32));
        hero.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher_fg);
        logo.setColorFilter(Palette.onPrimary());
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(64), dp(64));
        ilp.bottomMargin = dp(14);
        logo.setLayoutParams(ilp);
        logo.setContentDescription(getString(R.string.app_name));
        hero.addView(logo);

        TextView name = new TextView(this);
        name.setText(getString(R.string.app_name));
        name.setTextSize(22);
        name.setTypeface(Typeface.DEFAULT_BOLD);
        name.setTextColor(Palette.onPrimary());
        name.setGravity(Gravity.CENTER);
        hero.addView(name);

        TextView tagline = new TextView(this);
        tagline.setText(getString(R.string.app_tagline));
        tagline.setTextSize(13);
        tagline.setTextColor(0xCCFFFFFF);
        tagline.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams tlp = UiKit.lpWrapWrap();
        tlp.topMargin = dp(4);
        tagline.setLayoutParams(tlp);
        hero.addView(tagline);

        return hero;
    }

    private int dp(int v) {
        return UiKit.dp(this, v);
    }
}
