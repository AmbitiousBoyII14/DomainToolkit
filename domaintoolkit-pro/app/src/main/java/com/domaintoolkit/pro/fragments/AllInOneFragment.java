package com.domaintoolkit.pro.fragments;

import android.app.Fragment;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.activities.SettingsActivity;
import com.domaintoolkit.pro.models.ScanResult;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.ExportUtils;
import com.domaintoolkit.pro.utils.NetworkUtils;
import com.domaintoolkit.pro.utils.PremiumManager;
import com.domaintoolkit.pro.utils.ScanHistoryManager;

import java.io.File;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * All-In-One scanner: runs every supported check and displays results in
 * labelled, collapsible section cards.
 *
 * Java 7 compatible; no lambdas.
 */
public class AllInOneFragment extends Fragment {

    private android.widget.EditText inputField;
    private TextView primaryBtn;
    private ProgressBar progressBar;
    private TextView progressLabel;
    private LinearLayout resultsContainer;
    private ScanResult currentResult;
    private NetworkUtils.Task task;

    // Section cards – map keyed by section name so rows append to the right card
    private final Map<String, LinearLayout> sections = new LinkedHashMap<String, LinearLayout>();
    private final Map<String, String> sectionForKey = new LinkedHashMap<String, String>();

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());

        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        // ---- Heading ----
        root.addView(UiKit.h1(getActivity(), "All-In-One Scan"));
        root.addView(UiKit.gap(getActivity(), 4));
        root.addView(UiKit.caption(getActivity(), "Runs every supported check in one pass."));
        root.addView(UiKit.gap(getActivity(), 16));

        // ---- Input card ----
        LinearLayout inputCard = UiKit.card(getActivity());
        inputCard.setLayoutParams(UiKit.lpMatchWrap());

        root.addView(inputCard);

        inputField = UiKit.input(getActivity(), getString(R.string.hint_domain));
        UiKit.bindFieldFocus(getActivity(), inputField);
        LinearLayout.LayoutParams ielp = UiKit.lpMatchWrap();
        ielp.bottomMargin = dp(10);
        inputField.setLayoutParams(ielp);
        inputCard.addView(inputField);

        // Paste button row
        LinearLayout btnRow = UiKit.row(getActivity());
        TextView pasteBtn = UiKit.ghostButton(getActivity(), getString(R.string.action_paste));
        pasteBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                paste();
            }
        });
        btnRow.addView(pasteBtn);
        btnRow.addView(UiKit.spacer(getActivity()));
        inputCard.addView(btnRow);
        root.addView(UiKit.gap(getActivity(), 8));

        // ---- Scan button ----
        primaryBtn = UiKit.primaryButton(getActivity(), getString(R.string.action_scan));
        LinearLayout.LayoutParams blp = UiKit.lpMatchWrap();
        blp.bottomMargin = dp(12);
        primaryBtn.setLayoutParams(blp);
        primaryBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                startScan();
            }
        });
        root.addView(primaryBtn);

        // ---- Progress ----
        progressBar = UiKit.progress(getActivity());
        progressBar.setVisibility(View.GONE);
        root.addView(progressBar);

        progressLabel = UiKit.caption(getActivity(), "");
        progressLabel.setVisibility(View.GONE);
        LinearLayout.LayoutParams plp = UiKit.lpMatchWrap();
        plp.topMargin = dp(4);
        plp.bottomMargin = dp(12);
        progressLabel.setLayoutParams(plp);
        root.addView(progressLabel);

        // ---- Results ----
        resultsContainer = UiKit.column(getActivity());
        root.addView(resultsContainer);

        sv.addView(root);
        return sv;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (task != null) {
            task.cancel();
            task = null;
        }
    }

    // ============================================================
    // Scan lifecycle
    // ============================================================

    private void startScan() {
        final String domain = NetworkUtils.sanitizeHost(inputField.getText().toString().trim());
        if (!NetworkUtils.isValidDomain(domain)) {
            Toast.makeText(getActivity(), getString(R.string.err_invalid_domain), Toast.LENGTH_SHORT).show();
            return;
        }
        PremiumManager pm = PremiumManager.get();
        if (!pm.canScan()) {
            Toast.makeText(getActivity(), pm.quotaLabel(), Toast.LENGTH_LONG).show();
            return;
        }

        resultsContainer.removeAllViews();
        sections.clear();
        sectionForKey.clear();
        currentResult = null;

        progressBar.setVisibility(View.VISIBLE);
        progressLabel.setVisibility(View.VISIBLE);
        progressBar.setProgress(0);
        primaryBtn.setEnabled(false);
        primaryBtn.setText("Scanning…");

        pm.recordScan();

        task = NetworkUtils.allInOne(domain, new NetworkUtils.Callback() {
            public void onProgress(int percent, String message) {
                progressBar.setProgress(percent);
                progressLabel.setText(message);
            }

            public void onComplete(ScanResult result) {
                progressBar.setVisibility(View.GONE);
                progressLabel.setVisibility(View.GONE);
                primaryBtn.setEnabled(true);
                primaryBtn.setText(getString(R.string.action_scan));
                task = null;

                if (getActivity() == null) return;

                if (!result.isSuccess()) {
                    showError(result.getErrorMessage());
                    return;
                }

                currentResult = result;
                renderResult(result);
                ScanHistoryManager.get(getActivity()).save(result);
            }
        });
    }

    private void renderResult(ScanResult r) {
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            String section = detectSection(e.getKey());
            addResultRow(section, e.getKey(), e.getValue());
        }
        showActionRow();
    }

    /** Heuristically assigns a field key to a display section. */
    private String detectSection(String key) {
        String k = key.toLowerCase();
        if (k.equals("domain") || k.equals("ip address") || k.equals("all addresses")
                || k.equals("reverse dns") || k.equals("asn") || k.equals("nameservers")) {
            return "General";
        }
        if (k.startsWith("a ") || k.startsWith("aaaa") || k.equals("mx") || k.equals("ns")
                || k.equals("txt") || k.equals("cname") || k.equals("soa") || k.equals("caa")
                || k.contains("record") || k.contains("dns")) {
            return "DNS";
        }
        if (k.contains("ssl") || k.contains("tls") || k.contains("cert")
                || k.contains("cipher") || k.contains("issuer") || k.contains("subject")
                || k.contains("expiry") || k.contains("hsts") || k.contains("ocsp")) {
            return "SSL / TLS";
        }
        if (k.contains("ws") || k.contains("websocket") || k.contains("socket")) {
            return "WebSocket";
        }
        if (k.contains("status") || k.contains("redirect") || k.contains("header")
                || k.contains("server") || k.contains("content") || k.contains("final url")) {
            return "HTTP";
        }
        if (k.contains("csp") || k.contains("xss") || k.contains("frame")
                || k.contains("cors") || k.contains("score") || k.contains("security")) {
            return "Security";
        }
        if (k.contains("cloud") || k.contains("cdn") || k.contains("host")
                || k.contains("provider") || k.contains("platform")) {
            return "Hosting / CDN";
        }
        if (k.contains("ping") || k.contains("latency") || k.contains("port")) {
            return "Network";
        }
        return "General";
    }

    private void addResultRow(String section, String key, String value) {
        LinearLayout card = sections.get(section);
        if (card == null) {
            card = buildSectionCard(section);
            sections.put(section, card);
            resultsContainer.addView(card);
        }
        card.addView(UiKit.kv(getActivity(), key, value));
        card.addView(UiKit.divider(getActivity()));
    }

    private LinearLayout buildSectionCard(String title) {
        LinearLayout outer = UiKit.column(getActivity());
        LinearLayout.LayoutParams olp = UiKit.lpMatchWrap();
        olp.bottomMargin = dp(12);
        outer.setLayoutParams(olp);

        LinearLayout card = UiKit.card(getActivity());
        card.setPadding(dp(16), dp(4), dp(16), dp(8));

        // Section header
        LinearLayout hdr = UiKit.row(getActivity());
        hdr.setPadding(0, dp(12), 0, dp(10));

        View accent = new View(getActivity());
        LinearLayout.LayoutParams alp = new LinearLayout.LayoutParams(dp(3), dp(18));
        alp.rightMargin = dp(10);
        accent.setLayoutParams(alp);
        android.graphics.drawable.GradientDrawable ag = new android.graphics.drawable.GradientDrawable();
        ag.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
        ag.setColor(Palette.primary());
        ag.setCornerRadius(dp(2));
        accent.setBackground(ag);
        hdr.addView(accent);

        TextView sectionTitle = UiKit.h2(getActivity(), title);
        hdr.addView(sectionTitle);
        card.addView(hdr);
        card.addView(UiKit.divider(getActivity()));

        outer.addView(card);
        return card;
    }

    private void showError(String msg) {
        LinearLayout errCard = UiKit.card(getActivity());
        LinearLayout.LayoutParams elp = UiKit.lpMatchWrap();
        elp.bottomMargin = dp(12);
        errCard.setLayoutParams(elp);

        ImageView icon = new ImageView(getActivity());
        icon.setImageResource(R.drawable.ic_error);
        icon.setColorFilter(Palette.error());
        LinearLayout.LayoutParams ilp = new LinearLayout.LayoutParams(dp(24), dp(24));
        ilp.bottomMargin = dp(8);
        icon.setLayoutParams(ilp);
        errCard.addView(icon);

        TextView tv = UiKit.body(getActivity(), TextUtils.isEmpty(msg) ? "Scan failed." : msg);
        tv.setTextColor(Palette.error());
        errCard.addView(tv);
        resultsContainer.addView(errCard);
    }

    private void showActionRow() {
        LinearLayout row = UiKit.row(getActivity());
        LinearLayout.LayoutParams rlp = UiKit.lpMatchWrap();
        rlp.topMargin = dp(8);
        row.setLayoutParams(rlp);

        // Share button
        TextView shareBtn = UiKit.secondaryButton(getActivity(), getString(R.string.action_share));
        shareBtn.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        shareBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                if (currentResult == null) return;
                File f = ExportUtils.toTxt(getActivity(), currentResult);
                if (f == null) {
                    Toast.makeText(getActivity(), "Export failed", Toast.LENGTH_SHORT).show();
                    return;
                }
                ExportUtils.share(getActivity(), f, ExportUtils.MIME_TXT);
            }
        });
        row.addView(shareBtn);

        row.addView(UiKit.gap(getActivity(), 8));

        // Export button
        TextView exportBtn = UiKit.primaryButton(getActivity(), getString(R.string.action_export));
        exportBtn.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        exportBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                if (currentResult == null) return;
                PremiumManager pm = PremiumManager.get();
                if (!pm.canExport()) {
                    Toast.makeText(getActivity(),
                            "Export limit reached. Upgrade to Pro.", Toast.LENGTH_SHORT).show();
                    return;
                }
                File f = ExportUtils.toTxt(getActivity(), currentResult);
                pm.recordExport();
                if (f != null) {
                    Toast.makeText(getActivity(),
                            "Exported: " + f.getName(), Toast.LENGTH_SHORT).show();
                    ExportUtils.share(getActivity(), f, ExportUtils.MIME_TXT);
                } else {
                    Toast.makeText(getActivity(), "Export failed", Toast.LENGTH_SHORT).show();
                }
            }
        });
        row.addView(exportBtn);
        resultsContainer.addView(row);
    }

    // ============================================================
    // Clipboard
    // ============================================================

    private void paste() {
        ClipboardManager cm = (ClipboardManager) getActivity()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm == null || !cm.hasPrimaryClip()) return;
        ClipData.Item item = cm.getPrimaryClip().getItemAt(0);
        if (item == null) return;
        CharSequence text = item.getText();
        if (!TextUtils.isEmpty(text)) {
            inputField.setText(text.toString().trim());
            inputField.setSelection(inputField.getText().length());
        }
    }

    private int dp(int v) {
        return UiKit.dp(getActivity(), v);
    }
}
