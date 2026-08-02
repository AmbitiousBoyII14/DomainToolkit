package com.domaintoolkit.pro.fragments;

import android.app.Fragment;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.models.ScanResult;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.NetworkUtils;
import com.domaintoolkit.pro.utils.PremiumManager;
import com.domaintoolkit.pro.utils.ScanHistoryManager;

import java.util.Map;

/**
 * Domain Tools fragment.
 * Tool picker + domain input + results card.
 * Java 7 only; no lambdas.
 */
public class DomainToolsFragment extends Fragment {

    private static final String[] TOOLS = {
            "DNS Lookup",
            "Domain Overview",
            "HTTP Inspect",
            "WHOIS Lookup",
            "Subdomain Finder"
    };

    private android.widget.EditText inputField;
    private Spinner toolSpinner;
    private TextView runBtn;
    private ProgressBar progressBar;
    private TextView progressLabel;
    private LinearLayout resultsCard;
    private NetworkUtils.Task task;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());

        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        root.addView(UiKit.h1(getActivity(), "Domain Tools"));
        root.addView(UiKit.gap(getActivity(), 16));

        // ---- Input card ----
        LinearLayout inputCard = UiKit.card(getActivity());
        inputCard.setLayoutParams(UiKit.lpMatchWrap());

        inputCard.addView(UiKit.label(getActivity(), "Tool"));
        root.addView(inputCard);

        toolSpinner = new Spinner(getActivity());
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(
                getActivity(), android.R.layout.simple_spinner_dropdown_item, TOOLS);
        toolSpinner.setAdapter(adapter);
        LinearLayout.LayoutParams slp = UiKit.lpMatchWrap();
        slp.topMargin = dp(6);
        slp.bottomMargin = dp(14);
        toolSpinner.setLayoutParams(slp);
        inputCard.addView(toolSpinner);

        inputCard.addView(UiKit.label(getActivity(), "Domain"));
        root.addView(UiKit.gap(getActivity(), 6));

        inputField = UiKit.input(getActivity(), getString(R.string.hint_domain));
        UiKit.bindFieldFocus(getActivity(), inputField);
        LinearLayout.LayoutParams iflp = UiKit.lpMatchWrap();
        iflp.topMargin = dp(6);
        iflp.bottomMargin = dp(10);
        inputField.setLayoutParams(iflp);
        inputCard.addView(inputField);

        // Paste row
        TextView pasteBtn = UiKit.ghostButton(getActivity(), getString(R.string.action_paste));
        pasteBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                paste();
            }
        });
        inputCard.addView(pasteBtn);

        root.addView(UiKit.gap(getActivity(), 8));

        // ---- Run button ----
        runBtn = UiKit.primaryButton(getActivity(), getString(R.string.action_run));
        LinearLayout.LayoutParams rblp = UiKit.lpMatchWrap();
        rblp.bottomMargin = dp(12);
        runBtn.setLayoutParams(rblp);
        runBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                startScan();
            }
        });
        root.addView(runBtn);

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

        // ---- Results card (initially hidden) ----
        resultsCard = UiKit.card(getActivity());
        resultsCard.setVisibility(View.GONE);
        LinearLayout.LayoutParams rclp = UiKit.lpMatchWrap();
        rclp.bottomMargin = dp(12);
        resultsCard.setLayoutParams(rclp);
        root.addView(resultsCard);

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

        resultsCard.removeAllViews();
        resultsCard.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);
        progressLabel.setVisibility(View.VISIBLE);
        progressBar.setProgress(0);
        runBtn.setEnabled(false);
        runBtn.setText("Running…");
        pm.recordScan();

        final int tool = toolSpinner.getSelectedItemPosition();
        NetworkUtils.Callback cb = new NetworkUtils.Callback() {
            public void onProgress(int percent, String message) {
                progressBar.setProgress(percent);
                progressLabel.setText(message);
            }

            public void onComplete(ScanResult r) {
                progressBar.setVisibility(View.GONE);
                progressLabel.setVisibility(View.GONE);
                runBtn.setEnabled(true);
                runBtn.setText(getString(R.string.action_run));
                task = null;

                if (getActivity() == null) return;

                if (!r.isSuccess()) {
                    Toast.makeText(getActivity(), r.getErrorMessage(), Toast.LENGTH_LONG).show();
                    return;
                }

                renderResult(r);
                ScanHistoryManager.get(getActivity()).save(r);
            }
        };

        switch (tool) {
            case 0: task = NetworkUtils.dnsRecords(domain, cb);      break;
            case 1: task = NetworkUtils.domainOverview(domain, cb);  break;
            case 2: task = NetworkUtils.httpInspect(domain, cb);     break;
            case 3: task = NetworkUtils.whois(domain, cb);           break;
            case 4: task = NetworkUtils.subdomains(domain, cb);      break;
        }
    }

    private void renderResult(ScanResult r) {
        resultsCard.removeAllViews();

        // Card header
        LinearLayout hdr = UiKit.row(getActivity());
        hdr.setPadding(0, dp(4), 0, dp(12));
        TextView title = UiKit.h2(getActivity(), r.getTypeDisplayName());
        hdr.addView(title);
        resultsCard.addView(hdr);
        resultsCard.addView(UiKit.divider(getActivity()));

        // Fields
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            resultsCard.addView(UiKit.kv(getActivity(), e.getKey(), e.getValue()));
            resultsCard.addView(UiKit.divider(getActivity()));
        }

        // Table rows (DNS record table, redirect hops, etc.)
        if (!r.getTableRows().isEmpty()) {
            resultsCard.addView(UiKit.gap(getActivity(), 8));
            resultsCard.addView(UiKit.label(getActivity(), "Records"));
            resultsCard.addView(UiKit.gap(getActivity(), 6));

            for (Map<String, String> row : r.getTableRows()) {
                StringBuilder sb = new StringBuilder();
                for (Map.Entry<String, String> e : row.entrySet()) {
                    if (sb.length() > 0) sb.append("  •  ");
                    sb.append(e.getKey()).append(": ").append(e.getValue());
                }
                TextView tv = UiKit.mono(getActivity(), sb.toString());
                tv.setPadding(0, dp(3), 0, dp(3));
                resultsCard.addView(tv);
            }
        }

        // Copy results button
        resultsCard.addView(UiKit.gap(getActivity(), 8));
        final ScanResult capturedResult = r;
        TextView copyBtn = UiKit.ghostButton(getActivity(), getString(R.string.action_copy));
        copyBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                copyToClipboard(capturedResult);
            }
        });
        resultsCard.addView(copyBtn);
        resultsCard.setVisibility(View.VISIBLE);
    }

    private void copyToClipboard(ScanResult r) {
        StringBuilder sb = new StringBuilder();
        sb.append(r.getTypeDisplayName()).append(" - ").append(r.getTarget()).append("\n\n");
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            sb.append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        ClipboardManager cm = (ClipboardManager) getActivity()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("scan result", sb.toString()));
            Toast.makeText(getActivity(), getString(R.string.msg_copied), Toast.LENGTH_SHORT).show();
        }
    }

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
