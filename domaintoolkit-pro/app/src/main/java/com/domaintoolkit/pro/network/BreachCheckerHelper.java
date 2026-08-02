package com.domaintoolkit.pro.network;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;

/**
 * Data breach checker using HaveIBeenPwned API v3.
 * Checks if a domain or email appears in known breaches.
 * Free tier: rate limited, requires API key for v3.
 * Java 7 / HttpURLConnection / AIDE compatible.
 */
public class BreachCheckerHelper {

    private static final String HIBP_API_KEY = "YOUR_HIBP_API_KEY"; // Get from haveibeenpwned.com
    private static final String BASE_URL = "https://haveibeenpwned.com/api/v3";

    public static class BreachResult {
        public String query;
        public List<String> breachNames = new ArrayList<String>();
        public int breachCount;
        public String error;
    }

    /**
     * Check if an email appears in data breaches.
     * Requires HIBP API key (free at haveibeenpwned.com).
     */
    public static BreachResult checkEmail(String email) {
        BreachResult result = new BreachResult();
        result.query = email;

        HttpURLConnection conn = null;
        try {
            URL url = new URL(BASE_URL + "/breachedaccount/" + URLEncoder.encode(email, "UTF-8") +
                    "?truncateResponse=true");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("hibp-api-key", HIBP_API_KEY);
            conn.setRequestProperty("User-Agent", "DomainToolkitPro");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);

            int code = conn.getResponseCode();
            if (code == 200) {
                String json = readStream(conn.getInputStream());
                // Parse breach names
                int searchIdx = 0;
                while (true) {
                    int nameIdx = json.indexOf("\"Name\":\"", searchIdx);
                    if (nameIdx < 0) break;
                    int valStart = nameIdx + 8;
                    int valEnd = json.indexOf("\"", valStart);
                    if (valEnd < 0) break;
                    result.breachNames.add(json.substring(valStart, valEnd));
                    searchIdx = valEnd + 1;
                }
                result.breachCount = result.breachNames.size();
            } else if (code == 404) {
                result.breachCount = 0; // No breaches found — good!
            } else {
                result.error = "HTTP " + code;
            }
        } catch (Exception e) {
            result.error = e.getMessage();
        } finally {
            if (conn != null) conn.disconnect();
        }
        return result;
    }

    /**
     * Check if a domain's email addresses appear in breaches.
     * Note: HIBP free API only supports email lookups.
     */
    public static BreachResult checkDomain(String domain) {
        BreachResult result = new BreachResult();
        result.query = domain;
        result.error = "Domain breach check requires enterprise API. " +
                "Check common admin@, info@" + domain + " instead.";
        return result;
    }

    /**
     * Check a pastebin-style check (no API key needed for this simple method).
     * Uses psbdmp.ws API to search for domain mentions.
     */
    public static List<String> searchPastes(String domain) {
        List<String> pastes = new ArrayList<String>();
        HttpURLConnection conn = null;
        try {
            URL url = new URL("https://psbdmp.ws/api/v3/search/" + URLEncoder.encode(domain, "UTF-8"));
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);

            String json = readStream(conn.getInputStream());
            // Parse paste IDs
            int searchIdx = 0;
            while (true) {
                int idIdx = json.indexOf("\"id\":\"", searchIdx);
                if (idIdx < 0) break;
                int valStart = idIdx + 6;
                int valEnd = json.indexOf("\"", valStart);
                if (valEnd < 0) break;
                pastes.add(json.substring(valStart, valEnd));
                searchIdx = valEnd + 1;
            }
        } catch (Exception ignored) {
            // Paste search is optional
        } finally {
            if (conn != null) conn.disconnect();
        }
        return pastes;
    }

    private static String readStream(java.io.InputStream is) throws Exception {
        if (is == null) return "";
        BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        return sb.toString();
    }
}
