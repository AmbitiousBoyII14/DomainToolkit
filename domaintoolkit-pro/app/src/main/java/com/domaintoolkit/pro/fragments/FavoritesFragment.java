package com.domaintoolkit.pro.fragments;

import android.app.Fragment;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
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
 * Favorites fragment – shows starred scan results.
 * Java 7 only; no lambdas.
 */
public class FavoritesFragment extends Fragment {

    private LinearLayout listContainer;
    private ScanHistoryManager manager;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        Palette.load(getActivity());
        manager = ScanHistoryManager.get(getActivity());

        ScrollView sv = new ScrollView(getActivity());
        sv.setBackgroundColor(Palette.bg());

        LinearLayout root = UiKit.column(getActivity());
        root.setPadding(dp(16), dp(20), dp(16), dp(80));

        root.addView(UiKit.h1(getActivity(), "Favorites"));
        root.addView(UiKit.gap(getActivity(), 4));
        root.addView(UiKit.caption(getActivity(), "Starred scans you want to keep handy."));
        root.addView(UiKit.gap(getActivity(), 16));

        listContainer = UiKit.column(getActivity());
        root.addView(listContainer);

        sv.addView(root);
        loadFavorites();
        return sv;
    }

    @Override
    public void onResume() {
        super.onResume();
        loadFavorites();
    }

    private void loadFavorites() {
        if (listContainer == null) return;
        listContainer.removeAllViews();

        List<ScanResult> favorites = manager.getFavorites();

        if (favorites.isEmpty()) {
            listContainer.addView(UiKit.emptyState(getActivity(),
                    R.drawable.ic_favorite_outline,
                    "No favorites yet",
                    "Star any scan from the History screen."));
            return;
        }

        SimpleDateFormat sdf = new SimpleDateFormat("MMM d, HH:mm", Locale.US);

        for (final ScanResult sr : favorites) {
            LinearLayout card = UiKit.card(getActivity());
            LinearLayout.LayoutParams clp = UiKit.lpMatchWrap();
            clp.bottomMargin = dp(10);
            card.setLayoutParams(clp);

            // Type + date row
            LinearLayout headerRow = UiKit.row(getActivity());
            headerRow.setPadding(0, 0, 0, dp(4));

            TextView typeTv = UiKit.body(getActivity(), sr.getTypeDisplayName());
            typeTv.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            typeTv.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
            headerRow.addView(typeTv);

            TextView dateTv = UiKit.caption(getActivity(), sdf.format(new Date(sr.getTimestamp())));
            headerRow.addView(dateTv);
            card.addView(headerRow);

            // Target
            TextView targetTv = UiKit.caption(getActivity(), sr.getTarget());
            targetTv.setTextColor(Palette.primary());
            LinearLayout.LayoutParams ttlp = UiKit.lpMatchWrap();
            ttlp.bottomMargin = dp(8);
            targetTv.setLayoutParams(ttlp);
            card.addView(targetTv);

            // Status pill
            LinearLayout pillRow = UiKit.row(getActivity());
            pillRow.setPadding(0, 0, 0, dp(8));
            int statusColor = sr.isSuccess() ? Palette.success() : Palette.error();
            pillRow.addView(UiKit.pill(getActivity(), sr.isSuccess() ? "OK" : "FAILED", statusColor));
            pillRow.addView(UiKit.spacer(getActivity()));

            // Unstar action
            final String itemId = sr.getId();
            TextView unstarBtn = UiKit.ghostButton(getActivity(), "Unstar");
            unstarBtn.setTextSize(12);
            unstarBtn.setTextColor(Palette.warning());
            unstarBtn.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    manager.toggleFavorite(itemId);
                    loadFavorites();
                }
            });
            pillRow.addView(unstarBtn);
            card.addView(pillRow);

            listContainer.addView(card);
        }
    }

    private int dp(int v) {
        return UiKit.dp(getActivity(), v);
    }
}
