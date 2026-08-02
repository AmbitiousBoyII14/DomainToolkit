package com.domaintoolkit.pro.fragments;

import android.app.Fragment;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Typeface;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
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
 * WebSocket detection fragment.
 * Scans standard WS paths and shows handshake details.
 * Java 7 only; no lambdas.
 */
public class WebSocketFragment extends Fragment {

    private android.widget.EditText inputField;
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

        root.addView(UiKit.h1(getActivity(), "WebSocket Tools"));
        root.addView(UiKit.gap(getActivity(), 4));
        root.addView(UiKit.caption(getActivity(),
                "Detects WS/WSS support, common paths, and RFC 6455 handshake headers."));
        root.addView(UiKit.gap(getActivity(), 16));

        // ---- Paths info chip ----
        LinearLayout infoCard = UiKit.card(getActivity());
        LinearLayout.LayoutParams iclp = UiKit.lpMatchWrap();
        iclp.bottomMargin = dp(12);
        infoCard.setLayoutParams(iclp);
        infoCard.addView(UiKit.label(getActivity(), "Scanned paths"));
        root.addView(infoCard);

        String[] paths = {"/", "/ws", "/socket", "/socket.io", "/websocket", "/live", "/api/ws", "/chat"};
        StringBuilder pathsStr = new StringBuilder();
        for (int i = 0; i < paths.length; i++) {
            if (i > 0) pathsStr.append("  ");
            pathsStr.append(paths[i]);
        }
        TextView pathsTv = UiKit.mono(getActivity(), pathsStr.toString());
        pathsTv.setTextColor(Palette.textSecondary());
        pathsTv.setPadding(0, dp(4), 0, 0);
        infoCard.addView(pathsTv);

        // ---- Input ----
        LinearLayout inputCard = UiKit.card(getActivity());
        inputCard.setLayoutParams(UiKit.lpMatchWrap());
        inputCard.addView(UiKit.label(getActivity(), "Domain"));
        root.addView(inputCard);

        inputField = UiKit.input(getActivity(), getString(R.string.hint_domain));
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

        // ---- Check button ----
        runBtn = UiKit.primaryButton(getActivity(), "Check WebSocket");
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
        progressBar.setVisibility(View.VISIBLE);
        progressLabel.setVisibility(View.VISIBLE);
        progressBar.setProgress(0);
        runBtn.setEnabled(false);
        runBtn.setText("Checking…");
        pm.recordScan();

        task = NetworkUtils.webSocket(domain, new NetworkUtils.Callback() {
            public void onProgress(int percent, String message) {
                progressBar.setProgress(percent);
                progressLabel.setText(message);
            }

            public void onComplete(ScanResult r) {
                progressBar.setVisibility(View.GONE);
                progressLabel.setVisibility(View.GONE);
                runBtn.setEnabled(true);
                runBtn.setText("Check WebSocket");
                task = null;
                if (getActivity() == null) return;
                if (!r.isSuccess()) {
                    showError(r.getErrorMessage());
                    return;
                }
                renderResult(r);
                ScanHistoryManager.get(getActivity()).save(r);
            }
        });
    }

    private void renderResult(ScanResult r) {
        // Status pill row
        String wsFound = r.getField("WebSocket Found");
        boolean detected = "Yes".equalsIgnoreCase(wsFound) || "true".equalsIgnoreCase(wsFound);
        LinearLayout pillRow = UiKit.row(getActivity());
        pillRow.setPadding(0, 0, 0, dp(12));
        int pillColor = detected ? Palette.success() : Palette.warning();
        String pillText = detected ? "WS DETECTED" : "NOT FOUND";
        pillRow.addView(UiKit.pill(getActivity(), pillText, pillColor));
        resultsContainer.addView(pillRow);

        // Details card
        LinearLayout card = UiKit.card(getActivity());
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        clp.bottomMargin = dp(12);
        card.setLayoutParams(clp);

        LinearLayout hdr = UiKit.row(getActivity());
        hdr.setPadding(0, dp(4), 0, dp(12));
        hdr.addView(UiKit.h2(getActivity(), "Handshake Details"));
        card.addView(hdr);
        card.addView(UiKit.divider(getActivity()));

        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            card.addView(UiKit.kv(getActivity(), e.getKey(), e.getValue()));
            card.addView(UiKit.divider(getActivity()));
        }

        // Table (per-path results)
        if (!r.getTableRows().isEmpty()) {
            card.addView(UiKit.gap(getActivity(), 8));
            card.addView(UiKit.label(getActivity(), "Path results"));

            for (Map<String, String> row : r.getTableRows()) {
                LinearLayout rowView = UiKit.row(getActivity());
                rowView.setPadding(0, dp(6), 0, dp(6));

                String path   = row.get("Path");
                String status = row.get("Status");
                String accept = row.get("Sec-WebSocket-Accept");

                boolean ok = "101".equals(status) || (accept != null && !accept.isEmpty());
                int sc = ok ? Palette.success() : Palette.textSecondary();

                TextView pathTv = UiKit.mono(getActivity(), path != null ? path : "");
                pathTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
                rowView.addView(pathTv);

                rowView.addView(UiKit.pill(getActivity(),
                        ok ? "OK " + status : status != null ? status : "-",
                        sc));
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
        TextView tv = UiKit.body(getActivity(), TextUtils.isEmpty(msg) ? "Check failed." : msg);
        tv.setTextColor(Palette.error());
        card.addView(tv);
        resultsContainer.addView(card);
    }

    private void copyToClipboard(ScanResult r) {
        StringBuilder sb = new StringBuilder();
        sb.append("WebSocket – ").append(r.getTarget()).append("\n\n");
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            sb.append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        ClipboardManager cm = (ClipboardManager) getActivity()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("ws result", sb.toString()));
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
