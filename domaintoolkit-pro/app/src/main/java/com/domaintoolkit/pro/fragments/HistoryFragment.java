package com.domaintoolkit.pro.fragments;

import android.app.AlertDialog;
import android.app.Fragment;
import android.content.DialogInterface;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.models.ScanResult;
import com.domaintoolkit.pro.ui.Palette;
import com.domaintoolkit.pro.ui.UiKit;
import com.domaintoolkit.pro.utils.ScanHistoryManager;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Scan history screen.
 * Search bar, clear all, per-item favourite/delete/share.
 * Java 7 only; no lambdas.
 */
public class HistoryFragment extends Fragment {

    private LinearLayout listContainer;
    private EditText searchField;
    private TextView countLabel;
    private ScanHistoryManager manager;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());
        manager = ScanHistoryManager.get(getActivity());

        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        // ---- Header row ----
        LinearLayout headerRow = UiKit.row(getActivity());
        TextView title = UiKit.h1(getActivity(), "History");
        title.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        headerRow.addView(title);

        TextView clearBtn = UiKit.ghostButton(getActivity(), "Clear All");
        clearBtn.setTextColor(Palette.error());
        clearBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) { confirmClear(); }
        });
        headerRow.addView(clearBtn);
        root.addView(headerRow);
        root.addView(UiKit.gap(getActivity(), 12));

        // ---- Search ----
        searchField = UiKit.input(getActivity(), "Search history…");
        UiKit.bindFieldFocus(getActivity(), searchField);
        searchField.addTextChangedListener(new TextWatcher() {
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            public void afterTextChanged(Editable s) { reload(s.toString()); }
        });
        LinearLayout.LayoutParams sflp = UiKit.lpMatchWrap();
        sflp.bottomMargin = dp(8);
        searchField.setLayoutParams(sflp);
        root.addView(searchField);

        // ---- Count label ----
        countLabel = UiKit.caption(getActivity(), "");
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        clp.bottomMargin = dp(12);
        countLabel.setLayoutParams(clp);
        root.addView(countLabel);

        // ---- List ----
        listContainer = UiKit.column(getActivity());
        root.addView(listContainer);

        sv.addView(root);
        reload("");
        return sv;
    }

    @Override
    public void onResume() {
        super.onResume();
        reload(searchField != null ? searchField.getText().toString() : "");
    }

    // ============================================================

    private void reload(String query) {
        if (listContainer == null) return;
        listContainer.removeAllViews();

        List<ScanResult> results = (query == null || query.isEmpty())
                ? manager.getHistory(200)
                : manager.search(query);

        int total = manager.getCount();
        countLabel.setText(total + " scan" + (total == 1 ? "" : "s") + " recorded");

        if (results.isEmpty()) {
            listContainer.addView(UiKit.emptyState(getActivity(),
                    R.drawable.ic_history, "No history yet",
                    "Completed scans will appear here."));
            return;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("MMM d, HH:mm", Locale.US);
        for (final ScanResult sr : results) {
            listContainer.addView(buildItem(sr, sdf));
            listContainer.addView(UiKit.divider(getActivity()));
        }
    }

    private View buildItem(final ScanResult sr, SimpleDateFormat sdf) {
        LinearLayout card = UiKit.card(getActivity());
        LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
        clp.bottomMargin = dp(2);
        card.setLayoutParams(clp);

        // Title row
        LinearLayout titleRow = UiKit.row(getActivity());
        titleRow.setPadding(0, 0, 0, dp(4));

        TextView typeTv = UiKit.body(getActivity(), sr.getTypeDisplayName());
        typeTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        typeTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        titleRow.addView(typeTv);

        TextView dateTv = UiKit.caption(getActivity(), sdf.format(new Date(sr.getTimestamp())));
        titleRow.addView(dateTv);
        card.addView(titleRow);

        // Target
        TextView targetTv = UiKit.caption(getActivity(), sr.getTarget());
        targetTv.setTextColor(Palette.primary());
        LinearLayout.LayoutParams ttlp = UiKit.lpMatchWrap();
        ttlp.bottomMargin = dp(8);
        targetTv.setLayoutParams(ttlp);
        card.addView(targetTv);

        // Status pill
        LinearLayout statusRow = UiKit.row(getActivity());
        statusRow.setPadding(0, 0, 0, dp(8));
        int statusColor = sr.isSuccess() ? Palette.success() : Palette.error();
        String statusText = sr.isSuccess() ? "OK" : "FAILED";
        statusRow.addView(UiKit.pill(getActivity(), statusText, statusColor));
        if (sr.isFavorite()) {
            LinearLayout.LayoutParams flp = UiKit.lpWrapWrap();
            flp.leftMargin = dp(6);
            TextView favChip = UiKit.pill(getActivity(), "STARRED", Palette.warning());
            favChip.setLayoutParams(flp);
            statusRow.addView(favChip);
        }
        card.addView(statusRow);

        // Action buttons
        LinearLayout actions = UiKit.row(getActivity());

        final String itemId = sr.getId();
        final boolean isFav = sr.isFavorite();

        TextView favBtn = UiKit.ghostButton(getActivity(), isFav ? "Unstar" : "Star");
        favBtn.setTextSize(12);
        favBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                manager.toggleFavorite(itemId);
                reload(searchField.getText().toString());
            }
        });
        actions.addView(favBtn);

        actions.addView(UiKit.spacer(getActivity()));

        TextView delBtn = UiKit.ghostButton(getActivity(), "Delete");
        delBtn.setTextSize(12);
        delBtn.setTextColor(Palette.error());
        delBtn.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                manager.delete(itemId);
                reload(searchField.getText().toString());
            }
        });
        actions.addView(delBtn);

        card.addView(actions);
        return card;
    }

    private void confirmClear() {
        new AlertDialog.Builder(getActivity())
                .setTitle("Clear History")
                .setMessage("Delete all scan history? Starred items will be kept.")
                .setPositiveButton("Clear", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface d, int w) {
                        manager.clearHistory();
                        reload(searchField != null ? searchField.getText().toString() : "");
                    }
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private int dp(int v) {
        return UiKit.dp(getActivity(), v);
    }
}
