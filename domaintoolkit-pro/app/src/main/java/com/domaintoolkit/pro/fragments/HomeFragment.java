package com.domaintoolkit.pro.fragments;

import android.app.Fragment;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.GridLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.activities.MainActivity;
import com.domaintoolkit.pro.activities.PremiumActivity;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.PremiumManager;

/**
 * Home screen: quota chip + 2-column gradient card grid.
 * Java 7 only, no lambdas.
 */
public class HomeFragment extends Fragment {

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());
        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        // ---- Heading ----
        TextView h1 = UiKit.h1(getActivity(), "Domain Toolkit Pro");
        root.addView(h1);
        root.addView(UiKit.gap(getActivity(), 4));

        TextView tagline = UiKit.caption(getActivity(), "Professional network & domain analysis");
        tagline.setPadding(0, 0, 0, dp(16));
        root.addView(tagline);

        // ---- Quota / upgrade chip ----
        PremiumManager pm = PremiumManager.get();
        if (!pm.isPro()) {
            LinearLayout chipRow = UiKit.row(getActivity());
            chipRow.setPadding(0, 0, 0, dp(12));

            ImageView iconWarn = new ImageView(getActivity());
            iconWarn.setImageResource(R.drawable.ic_premium);
            iconWarn.setColorFilter(Palette.warning());
            LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(16), dp(16));
            ilp.rightMargin = dp(6);
            iconWarn.setLayoutParams(ilp);
            chipRow.addView(iconWarn);

            TextView quota = new TextView(getActivity());
            quota.setText(pm.quotaLabel());
            quota.setTextSize(12);
            quota.setTextColor(Palette.warning());
            quota.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            chipRow.addView(quota);

            final TextView upgradeBtn = UiKit.pill(getActivity(), "Upgrade", Palette.primary());
            upgradeBtn.setClickable(true);
            upgradeBtn.setFocusable(true);
            upgradeBtn.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    startActivity(new Intent(getActivity(), PremiumActivity.class));
                }
            });
            chipRow.addView(upgradeBtn);
            root.addView(chipRow);
        } else {
            TextView proChip = UiKit.pill(getActivity(), "PRO - Unlimited", Palette.success());
            LinearLayout.LayoutParams pclp = UiKit.lpWrapWrap();
            pclp.bottomMargin = dp(12);
            proChip.setLayoutParams(pclp);
            root.addView(proChip);
        }

        // ---- Card grid ----
        GridLayout grid = new GridLayout(getActivity());
        grid.setColumnCount(2);
        grid.setLayoutParams(UiKit.lpMatchWrap());

        addCard(grid, "Domain Scan",    "DNS, WHOIS, IP",        R.color.card_domain_start,   R.color.card_domain_end,   R.drawable.ic_domain,   2);
        addCard(grid, "SSL Checker",    "Certificate & TLS",     R.color.card_ssl_start,      R.color.card_ssl_end,      R.drawable.ic_ssl,      3);
        addCard(grid, "WebSocket",      "WS / WSS detect",       R.color.card_ws_start,       R.color.card_ws_end,       R.drawable.ic_websocket,4);
        addCard(grid, "HTTP Status",    "Headers & cookies",     R.color.card_network_start,  R.color.card_network_end,  R.drawable.ic_http,     2);
        addCard(grid, "DNS Lookup",     "All record types",      R.color.card_hosting_start,  R.color.card_hosting_end,  R.drawable.ic_dns,      2);
        addCard(grid, "WHOIS",          "Owner & registrar",     R.color.card_security_start, R.color.card_security_end, R.drawable.ic_whois,    2);
        addCard(grid, "Subdomain Scan", "Find subdomains",       R.color.card_scan_start,     R.color.card_scan_end,     R.drawable.ic_subdomain,2);
        addCard(grid, "Port Scanner",   "Open ports",            R.color.card_domain_start,   R.color.card_domain_end,   R.drawable.ic_network,  5);
        addCard(grid, "All-In-One",     "Complete analysis",     R.color.card_premium_start,  R.color.card_premium_end,  R.drawable.ic_scan,     1);
        addCard(grid, "History",        "Past results",          R.color.card_ssl_start,      R.color.card_ssl_end,      R.drawable.ic_history,  8);
        addCard(grid, "Favorites",      "Starred scans",         R.color.card_hosting_start,  R.color.card_hosting_end,  R.drawable.ic_favorite, 9);
        addCard(grid, "Premium",        "Unlock everything",     R.color.card_premium_start,  R.color.card_premium_end,  R.drawable.ic_premium,  10);

        root.addView(grid);
        sv.addView(root);
        return sv;
    }

    private void addCard(GridLayout grid,
                         String title, String desc,
                         int colorRes1, int colorRes2,
                         int iconRes,
                         final int navIndex) {
        LinearLayout card = UiKit.column(getActivity());
        card.setGravity(Gravity.CENTER);
        card.setPadding(dp(12), dp(14), dp(12), dp(14));

        GridLayout.LayoutParams lp = new GridLayout.LayoutParams();
        lp.width = 0;
        lp.height = dp(120);
        lp.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1, 1f);
        lp.setMargins(dp(5), dp(5), dp(5), dp(5));
        card.setLayoutParams(lp);

        int c1 = getResources().getColor(colorRes1);
        int c2 = getResources().getColor(colorRes2);
        GradientDrawable gd = new GradientDrawable(
                GradientDrawable.Orientation.TL_BR, new int[]{c1, c2});
        gd.setGradientType(GradientDrawable.LINEAR_GRADIENT);
        gd.setCornerRadius(dp(14));
        card.setBackground(UiKit.pressable(getActivity(), gd, c1));
        card.setClickable(true);
        card.setFocusable(true);

        ImageView icon = new ImageView(getActivity());
        icon.setImageResource(iconRes);
        icon.setColorFilter(0xCCFFFFFF);
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(28), dp(28));
        ilp.bottomMargin = dp(8);
        icon.setLayoutParams(ilp);
        icon.setContentDescription(title);
        card.addView(icon);

        TextView nm = new TextView(getActivity());
        nm.setText(title);
        nm.setTextSize(13.5f);
        nm.setTextColor(Color.WHITE);
        nm.setTypeface(Typeface.DEFAULT_BOLD);
        nm.setGravity(Gravity.CENTER);
        card.addView(nm);

        TextView ds = new TextView(getActivity());
        ds.setText(desc);
        ds.setTextSize(10.5f);
        ds.setTextColor(0xCCFFFFFF);
        ds.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams dlp = UiKit.lpWrapWrap();
        dlp.topMargin = dp(2);
        ds.setLayoutParams(dlp);
        card.addView(ds);

        card.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                MainActivity ma = (MainActivity) getActivity();
                if (ma != null) {
                    ma.selectNav(navIndex);
                }
            }
        });
        grid.addView(card);
    }

    private int dp(int v) {
        return UiKit.dp(getActivity(), v);
    }
}
