package com.domaintoolkit.pro.network;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * PayPal REST API v2 integration for real payments.
 * Uses HttpURLConnection — Java 7, AIDE compatible.
 *
 * Setup: Get Client ID + Secret from https://developer.paypal.com
 * Sandbox: https://api-m.sandbox.paypal.com
 * Live:     https://api-m.paypal.com
 */
public class PayPalHelper {

    // ---------- CONFIGURE THESE ----------
    private static final String CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID";
    private static final String CLIENT_SECRET = "YOUR_PAYPAL_CLIENT_SECRET";
    private static final String BASE_URL = "https://api-m.sandbox.paypal.com"; // Change to live for production

    private static String sAccessToken;
    private static long sTokenExpiry;

    /**
     * Get an OAuth2 access token from PayPal.
     */
    public static String getAccessToken() throws Exception {
        if (sAccessToken != null && System.currentTimeMillis() < sTokenExpiry) {
            return sAccessToken;
        }

        URL url = new URL(BASE_URL + "/v1/oauth2/token");
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Accept", "application/json");
        conn.setRequestProperty("Accept-Language", "en_US");
        String auth = CLIENT_ID + ":" + CLIENT_SECRET;
        String encoded = android.util.Base64.encodeToString(
                auth.getBytes("UTF-8"), android.util.Base64.NO_WRAP);
        conn.setRequestProperty("Authorization", "Basic " + encoded);
        conn.setDoOutput(true);
        conn.getOutputStream().write("grant_type=client_credentials".getBytes("UTF-8"));

        String response = readResponse(conn);
        sAccessToken = extractJsonValue(response, "access_token");
        String expiresIn = extractJsonValue(response, "expires_in");
        sTokenExpiry = System.currentTimeMillis() + (Long.parseLong(expiresIn) * 900); // 90% margin
        conn.disconnect();
        return sAccessToken;
    }

    /**
     * Create a PayPal order for the given amount and tier.
     * Returns {orderID, approvalURL} or null on failure.
     */
    public static String[] createOrder(String amount, String currency, String tier, String userId) {
        try {
            String token = getAccessToken();
            String payload = "{" +
                    "\"intent\":\"CAPTURE\"," +
                    "\"purchase_units\":[{" +
                    "  \"amount\":{" +
                    "    \"currency_code\":\"" + currency + "\"," +
                    "    \"value\":\"" + amount + "\"" +
                    "  }," +
                    "  \"description\":\"Domain Toolkit Pro - " + tier + "\"," +
                    "  \"custom_id\":\"" + userId + "\"" +
                    "}]," +
                    "\"application_context\":{" +
                    "  \"return_url\":\"domaintoolkit://payment/success\"," +
                    "  \"cancel_url\":\"domaintoolkit://payment/cancel\"" +
                    "}}";

            URL url = new URL(BASE_URL + "/v2/checkout/orders");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoOutput(true);

            OutputStream os = conn.getOutputStream();
            os.write(payload.getBytes("UTF-8"));
            os.close();

            String response = readResponse(conn);
            conn.disconnect();

            String orderId = extractJsonValue(response, "\"id\"");
            String approvalUrl = null;

            // Find approval URL in links array
            int linksIdx = response.indexOf("\"links\"");
            if (linksIdx > 0) {
                int hrefStart = response.indexOf("\"href\":\"", linksIdx);
                if (hrefStart > 0) {
                    hrefStart += 8;
                    int hrefEnd = response.indexOf("\"", hrefStart);
                    if (hrefEnd > 0) {
                        approvalUrl = response.substring(hrefStart, hrefEnd)
                                .replace("\\/", "/");
                    }
                }
            }
            return new String[]{orderId, approvalUrl};

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Capture a PayPal order after user approves.
     * Returns true on success.
     */
    public static boolean captureOrder(String orderId) {
        try {
            String token = getAccessToken();

            URL url = new URL(BASE_URL + "/v2/checkout/orders/" + orderId + "/capture");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setRequestProperty("Prefer", "return=representation");
            conn.setDoOutput(true);
            conn.getOutputStream().write("{}".getBytes("UTF-8"));

            int code = conn.getResponseCode();
            String response = code >= 200 && code < 300
                    ? readResponse(conn) : readError(conn);
            conn.disconnect();

            return response.contains("\"COMPLETED\"");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Verify PayPal webhook signature (for server-side).
     */
    public static boolean verifyWebhook(String body, String headers) {
        try {
            String token = getAccessToken();
            String payload = "{" +
                    "\"auth_algo\":\"" + extractHeader(headers, "PAYPAL-AUTH-ALGO") + "\"," +
                    "\"cert_url\":\"" + extractHeader(headers, "PAYPAL-CERT-URL") + "\"," +
                    "\"transmission_id\":\"" + extractHeader(headers, "PAYPAL-TRANSMISSION-ID") + "\"," +
                    "\"transmission_sig\":\"" + extractHeader(headers, "PAYPAL-TRANSMISSION-SIG") + "\"," +
                    "\"transmission_time\":\"" + extractHeader(headers, "PAYPAL-TRANSMISSION-TIME") + "\"," +
                    "\"webhook_id\":\"YOUR_WEBHOOK_ID\"," +
                    "\"webhook_event\": " + body +
                    "}";

            URL url = new URL(BASE_URL + "/v1/notifications/verify-webhook-signature");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setDoOutput(true);
            conn.getOutputStream().write(payload.getBytes("UTF-8"));

            String response = readResponse(conn);
            conn.disconnect();
            return response.contains("\"SUCCESS\"");

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ---- Helpers ----

    private static String readResponse(HttpURLConnection conn) throws Exception {
        BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line);
        }
        br.close();
        return sb.toString();
    }

    private static String readError(HttpURLConnection conn) throws Exception {
        java.io.InputStream es = conn.getErrorStream();
        if (es == null) return "";
        BufferedReader br = new BufferedReader(new InputStreamReader(es, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) {
            sb.append(line);
        }
        br.close();
        return sb.toString();
    }

    private static String extractJsonValue(String json, String key) {
        int idx = json.indexOf(key);
        if (idx < 0) return "";
        int colonIdx = json.indexOf(":", idx);
        if (colonIdx < 0) return "";
        int valStart = colonIdx + 1;
        while (valStart < json.length() && (json.charAt(valStart) == ' ' ||
                json.charAt(valStart) == '"')) valStart++;
        int valEnd = json.indexOf("\"", valStart);
        if (valEnd < 0) valEnd = json.indexOf(",", valStart);
        if (valEnd < 0) valEnd = json.indexOf("}", valStart);
        if (valEnd < 0) return "";
        return json.substring(valStart, valEnd);
    }

    private static String extractHeader(String headers, String key) {
        int idx = headers.indexOf(key + ":");
        if (idx < 0) return "";
        int valStart = idx + key.length() + 1;
        int valEnd = headers.indexOf("\n", valStart);
        if (valEnd < 0) valEnd = headers.length();
        return headers.substring(valStart, valEnd).trim();
    }
}
