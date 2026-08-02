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
 * Network Tools: Ping, Port Scan, Latency.
 * Java 7 only; no lambdas.
 */
public class NetworkToolsFragment extends Fragment {

    private static final String[] TOOLS = {
            "Ping / Reachability",
            "Port Scanner (common)",
            "HTTP Response Time"
    };

    private android.widget.EditText inputField;
    private Spinner toolSpinner;
    private TextView runBtn;
    private ProgressBar progressBar;
    private TextView progressLabel;
    private LinearLayout resultsContainer;
    private NetworkUtils.Task task;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());

        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        root.addView(UiKit.h1(getActivity(), "Network Tools"));
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

        inputCard.addView(UiKit.label(getActivity(), "Host or IP"));

        inputField = UiKit.input(getActivity(), getString(R.string.hint_host));
        UiKit.bindFieldFocus(getActivity(), inputField);
        LinearLayout.LayoutParams iflp = UiKit.lpMatchWrap();
        iflp.topMargin = dp(6);
        iflp.bottomMargin = dp(8);
        inputField.setLayoutParams(iflp);
        inputCard.addView(inputField);

        TextView pasteBtn = UiKit.ghostButton(getActivity(), getString(R.string.action_paste));
        pasteBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { paste(); }
        });
        inputCard.addView(pasteBtn);

        root.addView(UiKit.gap(getActivity(), 8));

        runBtn = UiKit.primaryButton(getActivity(), getString(R.string.action_run));
        LinearLayout.LayoutParams blp = UiKit.lpMatchWrap();
        blp.bottomMargin = dp(12);
        runBtn.setLayoutParams(blp);
        runBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { startScan(); }
        });
        root.addView(runBtn);

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

        resultsContainer = UiKit.column(getActivity());
        root.addView(resultsContainer);

        sv.addView(root);
        return sv;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (task != null) { task.cancel(); task = null; }
    }

    private void startScan() {
        final String host = NetworkUtils.sanitizeHost(inputField.getText().toString().trim());
        if (!NetworkUtils.isValidHost(host)) {
            Toast.makeText(getActivity(), getString(R.string.err_empty_host), Toast.LENGTH_SHORT).show();
            return;
        }
        PremiumManager pm = PremiumManager.get();
        if (!pm.canScan()) {
            Toast.makeText(getActivity(), pm.quotaLabel(), Toast.LENGTH_LONG).show();
            return;
        }
        resultsContainer.removeAllViews();
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
                    showError(r.getErrorMessage());
                    return;
                }
                renderResult(r);
                ScanHistoryManager.get(getActivity()).save(r);
            }
        };

        switch (tool) {
            case 0: task = NetworkUtils.ping(host, cb);        break;
            case 1: task = NetworkUtils.portScan(host, cb);    break;
            case 2: task = NetworkUtils.httpInspect(host, cb); break;
        }
    }

    private void renderResult(ScanResult r) {
        LinearLayout card = UiKit.card(getActivity());
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        clp.bottomMargin = dp(12);
        card.setLayoutParams(clp);

        LinearLayout hdr = UiKit.row(getActivity());
        hdr.setPadding(0, dp(4), 0, dp(12));
        hdr.addView(UiKit.h2(getActivity(), r.getTypeDisplayName()));
        card.addView(hdr);
        card.addView(UiKit.divider(getActivity()));

        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            card.addView(UiKit.kv(getActivity(), e.getKey(), e.getValue()));
            card.addView(UiKit.divider(getActivity()));
        }

        // Port table
        if (!r.getTableRows().isEmpty()) {
            card.addView(UiKit.gap(getActivity(), 8));
            card.addView(UiKit.label(getActivity(), "Open ports"));
            card.addView(UiKit.gap(getActivity(), 6));

            for (Map<String, String> row : r.getTableRows()) {
                LinearLayout rowView = UiKit.row(getActivity());
                rowView.setPadding(0, dp(5), 0, dp(5));

                String port    = row.get("Port");
                String service = row.get("Service");
                String status  = row.get("Status");

                TextView portTv = UiKit.mono(getActivity(),
                        port != null ? port : "");
                portTv.setLayoutParams(new LinearLayout.LayoutParams(dp(60), ViewGroup.LayoutParams.WRAP_CONTENT));
                rowView.addView(portTv);

                TextView svcTv = UiKit.caption(getActivity(),
                        service != null ? service : "");
                svcTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
                rowView.addView(svcTv);

                boolean open = "open".equalsIgnoreCase(status);
                rowView.addView(UiKit.pill(getActivity(),
                        status != null ? status.toUpperCase() : "-",
                        open ? Palette.success() : Palette.textSecondary()));
                card.addView(rowView);
            }
        }

        card.addView(UiKit.gap(getActivity(), 4));
        final ScanResult capturedResult = r;
        TextView copyBtn = UiKit.ghostButton(getActivity(), getString(R.string.action_copy));
        copyBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { copyToClipboard(capturedResult); }
        });
        card.addView(copyBtn);

        resultsContainer.addView(card);
    }

    private void showError(String msg) {
        LinearLayout card = UiKit.card(getActivity());
        LinearLayout.LayoutParams elp = UiKit.lpMatchWrap();
        elp.bottomMargin = dp(12);
        card.setLayoutParams(elp);
        TextView tv = UiKit.body(getActivity(), TextUtils.isEmpty(msg) ? "Scan failed." : msg);
        tv.setTextColor(Palette.error());
        card.addView(tv);
        resultsContainer.addView(card);
    }

    private void copyToClipboard(ScanResult r) {
        StringBuilder sb = new StringBuilder();
        sb.append(r.getTypeDisplayName()).append(" – ").append(r.getTarget()).append("\n\n");
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            sb.append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        ClipboardManager cm = (ClipboardManager) getActivity()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("network result", sb.toString()));
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
