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
 * Security Headers / score fragment.
 * Shows a colour-coded score card and per-header status pills.
 * Java 7 only; no lambdas.
 */
public class SecurityToolsFragment extends Fragment {

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

        root.addView(UiKit.h1(getActivity(), "Security Headers"));
        root.addView(UiKit.gap(getActivity(), 4));
        root.addView(UiKit.caption(getActivity(),
                "CSP, HSTS, X-Frame-Options, XSS protection, CORS and cookie flags."));
        root.addView(UiKit.gap(getActivity(), 16));

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

        runBtn = UiKit.primaryButton(getActivity(), "Scan Headers");
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
        runBtn.setText("Scanning…");
        pm.recordScan();

        task = NetworkUtils.securityHeaders(domain, new NetworkUtils.Callback() {
            public void onProgress(int percent, String message) {
                progressBar.setProgress(percent);
                progressLabel.setText(message);
            }

            public void onComplete(ScanResult r) {
                progressBar.setVisibility(View.GONE);
                progressLabel.setVisibility(View.GONE);
                runBtn.setEnabled(true);
                runBtn.setText("Scan Headers");
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
        // ---- Score card ----
        String scoreStr = r.getField("Score");
        if (!TextUtils.isEmpty(scoreStr)) {
            LinearLayout scoreCard = UiKit.card(getActivity());
            LinearLayout.LayoutParams sclp = UiKit.lpMatchWrap();
            sclp.bottomMargin = dp(12);
            scoreCard.setLayoutParams(sclp);
            scoreCard.setGravity(android.view.Gravity.CENTER);

            int score = 0;
            try { score = Integer.parseInt(scoreStr); } catch (Exception ignored) {}
            int scoreColor = score >= 70 ? Palette.success() : score >= 40 ? Palette.warning() : Palette.error();
            String grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F";

            TextView scoreTv = new TextView(getActivity());
            scoreTv.setText(grade);
            scoreTv.setTextSize(48);
            scoreTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            scoreTv.setTextColor(scoreColor);
            scoreTv.setGravity(android.view.Gravity.CENTER);
            scoreCard.addView(scoreTv);

            TextView scoreNum = UiKit.caption(getActivity(), "Score: " + scoreStr + " / 100");
            scoreNum.setGravity(android.view.Gravity.CENTER);
            scoreCard.addView(scoreNum);

            // Progress bar for score
            ProgressBar scorePb = new ProgressBar(getActivity(), null,
                    android.R.attr.progressBarStyleHorizontal);
            scorePb.setMax(100);
            scorePb.setProgress(score);
            LinearLayout.LayoutParams pblp = UiKit.lpMatchWrap();
            pblp.topMargin = dp(8);
            scorePb.setLayoutParams(pblp);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                scorePb.setProgressTintList(android.content.res.ColorStateList.valueOf(scoreColor));
            }
            scoreCard.addView(scorePb);

            resultsContainer.addView(scoreCard);
        }

        // ---- Headers card ----
        LinearLayout card = UiKit.card(getActivity());
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        clp.bottomMargin = dp(12);
        card.setLayoutParams(clp);

        LinearLayout hdr = UiKit.row(getActivity());
        hdr.setPadding(0, dp(4), 0, dp(12));
        hdr.addView(UiKit.h2(getActivity(), "Security Headers"));
        card.addView(hdr);
        card.addView(UiKit.divider(getActivity()));

        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            if ("Score".equalsIgnoreCase(e.getKey())) continue;
            LinearLayout kvRow = UiKit.row(getActivity());
            kvRow.setPadding(0, dp(9), 0, dp(9));

            TextView k = UiKit.caption(getActivity(), e.getKey());
            k.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.5f));
            kvRow.addView(k);

            String val = e.getValue();
            boolean present = !TextUtils.isEmpty(val) && !"missing".equalsIgnoreCase(val)
                    && !"not set".equalsIgnoreCase(val) && !"none".equalsIgnoreCase(val);
            int pillColor = present ? Palette.success() : Palette.error();
            String pillText = present ? "PRESENT" : "MISSING";
            kvRow.addView(UiKit.pill(getActivity(), pillText, pillColor));
            card.addView(kvRow);
            card.addView(UiKit.divider(getActivity()));
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
        sb.append("Security Headers – ").append(r.getTarget()).append("\n\n");
        for (Map.Entry<String, String> e : r.getAllFields().entrySet()) {
            sb.append(e.getKey()).append(": ").append(e.getValue()).append("\n");
        }
        ClipboardManager cm = (ClipboardManager) getActivity()
                .getSystemService(Context.CLIPBOARD_SERVICE);
        if (cm != null) {
            cm.setPrimaryClip(ClipData.newPlainText("security result", sb.toString()));
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
