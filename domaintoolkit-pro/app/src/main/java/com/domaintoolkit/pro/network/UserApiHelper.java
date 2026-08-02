package com.domaintoolkit.pro.network;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;

/**
 * JSONBin.io API helper for user management.
 * Stores/retrieves user accounts in a central JSON bin.
 * Java 7 / HttpURLConnection / AIDE compatible.
 *
 * Setup:
 * 1. Go to https://jsonbin.io — create free account
 * 2. Create a bin → get BIN_ID
 * 3. Get X-Master-Key from API Keys page
 * 4. Get X-Access-Key (optional, for read-only public access)
 */
public class UserApiHelper {

    // ---------- CONFIGURE THESE ----------
    private static final String BIN_ID = "YOUR_JSONBIN_BIN_ID";
    private static final String MASTER_KEY = "YOUR_JSONBIN_MASTER_KEY";
    private static final String ACCESS_KEY = "YOUR_JSONBIN_ACCESS_KEY";
    private static final String BASE_URL = "https://api.jsonbin.io/v3/b/" + BIN_ID;

    /**
     * Result holder for API calls.
     */
    public static class ApiResult {
        public boolean success;
        public String data;
        public String error;
    }

    /**
     * Fetch the full users JSON from JSONBin.
     * Returns raw JSON string.
     */
    public static ApiResult fetchUsers() {
        ApiResult result = new ApiResult();
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BASE_URL + "/latest");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("X-Master-Key", MASTER_KEY);
            conn.setRequestProperty("X-Access-Key", ACCESS_KEY);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);

            int code = conn.getResponseCode();
            if (code == 200) {
                result.data = readStream(conn.getInputStream());
                result.success = true;
            } else {
                result.error = "HTTP " + code + ": " + readStream(conn.getErrorStream());
            }
        } catch (Exception e) {
            result.error = e.getMessage();
        } finally {
            if (conn != null) conn.disconnect();
        }
        return result;
    }

    /**
     * Update the full users JSON on JSONBin.
     * @param usersJson The complete users array JSON string.
     */
    public static ApiResult updateUsers(String usersJson) {
        ApiResult result = new ApiResult();
        HttpURLConnection conn = null;
        try {
            URL url = new URL(BASE_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("PUT");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-Master-Key", MASTER_KEY);
            conn.setRequestProperty("X-Bin-Versioning", "false");
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(15000);

            OutputStream os = conn.getOutputStream();
            os.write(usersJson.getBytes("UTF-8"));
            os.close();

            int code = conn.getResponseCode();
            if (code == 200) {
                result.data = readStream(conn.getInputStream());
                result.success = true;
            } else {
                result.error = "HTTP " + code + ": " + readStream(conn.getErrorStream());
            }
        } catch (Exception e) {
            result.error = e.getMessage();
        } finally {
            if (conn != null) conn.disconnect();
        }
        return result;
    }

    /**
     * Find a user by email + provider in the users JSON.
     * Returns the user JSON object string, or null.
     */
    public static String findUser(String usersJson, String email, String provider) {
        if (usersJson == null || email == null) return null;
        String lowerEmail = email.toLowerCase(Locale.US);

        // Simple JSON array parsing — find matching user object
        int searchIdx = 0;
        while (true) {
            int emailIdx = usersJson.indexOf("\"email\":\"", searchIdx);
            if (emailIdx < 0) break;

            int emailValStart = emailIdx + 9;
            int emailValEnd = usersJson.indexOf("\"", emailValStart);
            if (emailValEnd < 0) break;

            String foundEmail = usersJson.substring(emailValStart, emailValEnd).toLowerCase(Locale.US);

            // Check provider too
            int provIdx = usersJson.indexOf("\"provider\":\"", emailValEnd);
            String foundProvider = "";
            if (provIdx > 0 && provIdx - emailValEnd < 200) {
                int provStart = provIdx + 12;
                int provEnd = usersJson.indexOf("\"", provStart);
                if (provEnd > 0) foundProvider = usersJson.substring(provStart, provEnd);
            }

            if (foundEmail.equals(lowerEmail) && (provider == null || foundProvider.equals(provider))) {
                // Extract the full user object
                int objStart = usersJson.lastIndexOf("{", emailIdx);
                int depth = 0;
                int objEnd = objStart;
                for (int i = objStart; i < usersJson.length(); i++) {
                    char c = usersJson.charAt(i);
                    if (c == '{') depth++;
                    if (c == '}') {
                        depth--;
                        if (depth == 0) { objEnd = i + 1; break; }
                    }
                }
                return usersJson.substring(objStart, objEnd);
            }
            searchIdx = emailValEnd + 1;
        }
        return null;
    }

    /**
     * Register a new user — appends to the users array and pushes to JSONBin.
     */
    public static ApiResult registerUser(String email, String displayName, String photoUrl,
                                          String provider, String providerId) {
        ApiResult fetchResult = fetchUsers();
        if (!fetchResult.success && !fetchResult.data.contains("\"record\"")) {
            // Bin might be empty — initialize
            return initializeBin(email, displayName, photoUrl, provider, providerId);
        }

        // Extract the users array from JSONBin's wrapper: {"record": [...], "metadata": {...}}
        String record = fetchResult.data;
        int recordStart = record.indexOf("\"record\":");
        if (recordStart < 0) {
            // Assume it's direct JSON
            return appendUser(record, email, displayName, photoUrl, provider, providerId);
        }

        // Find the array inside record
        int arrStart = record.indexOf("[", recordStart);
        int arrEnd = record.lastIndexOf("]");
        if (arrStart < 0 || arrEnd < 0) return initializeBin(email, displayName, photoUrl, provider, providerId);

        String before = record.substring(0, arrStart);
        String usersArray = record.substring(arrStart, arrEnd);
        String after = record.substring(arrEnd);

        String newUserJson = buildUserJson(email, displayName, photoUrl, provider, providerId);
        String newArray;
        if (usersArray.equals("[]")) {
            newArray = "[" + newUserJson + "]";
        } else {
            newArray = usersArray.substring(0, usersArray.length()) + "," + newUserJson + "]";
        }

        String fullJson = before + newArray + after;
        return updateUsers(fullJson);
    }

    /**
     * Update a user's premium tier after purchase.
     */
    public static ApiResult updateUserPremium(String email, String provider, String tier, String expiry) {
        ApiResult fetchResult = fetchUsers();
        if (!fetchResult.success) return fetchResult;

        // Find the user object and replace its premiumTier/premiumExpiry
        int recordStart = fetchResult.data.indexOf("\"record\":");
        int arrStart = fetchResult.data.indexOf("[", recordStart);
        int arrEnd = fetchResult.data.lastIndexOf("]");
        if (arrStart < 0 || arrEnd < 0) return fetchResult;

        String lowerEmail = email.toLowerCase(Locale.US);
        String before = fetchResult.data.substring(0, arrStart + 1);
        String after = fetchResult.data.substring(arrEnd);
        String usersArray = fetchResult.data.substring(arrStart + 1, arrEnd);

        // Find and modify the user
        int userStart = findUserObjectStart(usersArray, lowerEmail, provider);
        if (userStart < 0) return fetchResult;
        int userEnd = findUserObjectEnd(usersArray, userStart);

        String userObj = usersArray.substring(userStart, userEnd);
        // Replace or add premiumTier and premiumExpiry
        userObj = setJsonField(userObj, "premiumTier", tier);
        userObj = setJsonField(userObj, "premiumExpiry", expiry);
        userObj = setJsonField(userObj, "lastLogin", getUtcNow());

        String newArray = usersArray.substring(0, userStart) + userObj + usersArray.substring(userEnd);
        return updateUsers(before + newArray + after);
    }

    /**
     * Update last login timestamp.
     */
    public static ApiResult updateLastLogin(String email, String provider) {
        ApiResult fetchResult = fetchUsers();
        if (!fetchResult.success) return fetchResult;

        int recordStart = fetchResult.data.indexOf("\"record\":");
        int arrStart = fetchResult.data.indexOf("[", recordStart);
        int arrEnd = fetchResult.data.lastIndexOf("]");
        if (arrStart < 0 || arrEnd < 0) return fetchResult;

        String lowerEmail = email.toLowerCase(Locale.US);
        String before = fetchResult.data.substring(0, arrStart + 1);
        String after = fetchResult.data.substring(arrEnd);
        String usersArray = fetchResult.data.substring(arrStart + 1, arrEnd);

        int userStart = findUserObjectStart(usersArray, lowerEmail, provider);
        if (userStart < 0) return fetchResult;
        int userEnd = findUserObjectEnd(usersArray, userStart);

        String userObj = usersArray.substring(userStart, userEnd);
        userObj = setJsonField(userObj, "lastLogin", getUtcNow());

        String newArray = usersArray.substring(0, userStart) + userObj + usersArray.substring(userEnd);
        return updateUsers(before + newArray + after);
    }

    // ---- Private helpers ----

    private static ApiResult initializeBin(String email, String displayName, String photoUrl,
                                            String provider, String providerId) {
        String newUser = buildUserJson(email, displayName, photoUrl, provider, providerId);
        String initJson = "{\"users\":[" + newUser + "]}";
        return updateUsers(initJson);
    }

    private static ApiResult appendUser(String fullJson, String email, String displayName,
                                         String photoUrl, String provider, String providerId) {
        String newUser = buildUserJson(email, displayName, photoUrl, provider, providerId);
        // Find the closing ] of users array
        int lastBracket = fullJson.lastIndexOf("]");
        if (lastBracket < 0) return initializeBin(email, displayName, photoUrl, provider, providerId);

        String beforeArray = fullJson.substring(0, lastBracket);
        String afterArray = fullJson.substring(lastBracket);

        // Check if array is empty
        String trimmed = beforeArray.trim();
        if (trimmed.endsWith(":[")) {
            return updateUsers(beforeArray + newUser + afterArray);
        } else {
            return updateUsers(beforeArray + "," + newUser + afterArray);
        }
    }

    private static String buildUserJson(String email, String displayName, String photoUrl,
                                         String provider, String providerId) {
        String id = UUID.randomUUID().toString();
        String now = getUtcNow();
        return "{" +
                "\"id\":\"" + id + "\"," +
                "\"email\":\"" + email + "\"," +
                "\"displayName\":\"" + escape(displayName) + "\"," +
                "\"photoUrl\":\"" + (photoUrl != null ? photoUrl : "") + "\"," +
                "\"provider\":\"" + provider + "\"," +
                "\"providerId\":\"" + providerId + "\"," +
                "\"premiumTier\":\"free\"," +
                "\"premiumExpiry\":\"\"," +
                "\"createdAt\":\"" + now + "\"," +
                "\"lastLogin\":\"" + now + "\"," +
                "\"deviceId\":\"\"" +
                "}";
    }

    private static int findUserObjectStart(String json, String email, String provider) {
        int searchIdx = 0;
        String lowerEmail = email.toLowerCase(Locale.US);
        while (true) {
            int emailIdx = json.indexOf("\"email\":\"", searchIdx);
            if (emailIdx < 0) return -1;
            int valStart = emailIdx + 9;
            int valEnd = json.indexOf("\"", valStart);
            if (valEnd < 0) return -1;
            String foundEmail = json.substring(valStart, valEnd).toLowerCase(Locale.US);
            if (foundEmail.equals(lowerEmail)) {
                // Check provider
                int provIdx = json.indexOf("\"provider\":\"", valEnd);
                if (provIdx > 0 && provIdx - valEnd < 200) {
                    int pStart = provIdx + 12;
                    int pEnd = json.indexOf("\"", pStart);
                    String foundProv = (pEnd > 0) ? json.substring(pStart, pEnd) : "";
                    if (provider == null || foundProv.equals(provider)) {
                        return json.lastIndexOf("{", emailIdx);
                    }
                }
            }
            searchIdx = valEnd + 1;
        }
    }

    private static int findUserObjectEnd(String json, int start) {
        int depth = 0;
        for (int i = start; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '{') depth++;
            if (c == '}') {
                depth--;
                if (depth == 0) return i + 1;
            }
        }
        return json.length();
    }

    private static String setJsonField(String json, String field, String value) {
        String key = "\"" + field + "\":\"";
        int idx = json.indexOf(key);
        if (idx < 0) {
            // Field doesn't exist — add before closing }
            int close = json.lastIndexOf("}");
            return json.substring(0, close) + ",\"" + field + "\":\"" + value + "\"}";
        }
        int valStart = idx + key.length();
        int valEnd = json.indexOf("\"", valStart);
        if (valEnd < 0) return json;
        return json.substring(0, valStart) + value + json.substring(valEnd);
    }

    private static String getUtcNow() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date());
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
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
