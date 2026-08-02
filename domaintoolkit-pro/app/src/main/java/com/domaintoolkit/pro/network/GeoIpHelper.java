package com.domaintoolkit.pro.network;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;

/**
 * IP Geolocation using free ip-api.com (no API key needed for non-commercial).
 * Resolves IP/hostname → country, city, ISP, lat/lon, timezone.
 * Java 7 compatible.
 */
public class GeoIpHelper {

    public static class GeoIpResult {
        public String ip;
        public String country;
        public String countryCode;
        public String region;
        public String city;
        public String zip;
        public String isp;
        public String org;
        public String as_;
        public double lat;
        public double lon;
        public String timezone;
        public boolean success;
        public String error;
    }

    /**
     * Lookup geolocation for a hostname or IP.
     * Uses ip-api.com (free: 45 req/min, no key required).
     */
    public static GeoIpResult lookup(String host) {
        GeoIpResult result = new GeoIpResult();
        HttpURLConnection conn = null;
        try {
            // Resolve host to IP first
            InetAddress addr = InetAddress.getByName(host);
            String ip = addr.getHostAddress();
            result.ip = ip;

            URL url = new URL("http://ip-api.com/json/" + ip +
                    "?fields=country,countryCode,region,city,zip,isp,org,as,lat,lon,timezone,query");
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            String json = readStream(conn.getInputStream());
            conn.disconnect();

            if (json.contains("\"fail\"")) {
                result.success = true;
                result.country = "Unknown";
                return result;
            }

            result.country = extractField(json, "country");
            result.countryCode = extractField(json, "countryCode");
            result.region = extractField(json, "region");
            result.city = extractField(json, "city");
            result.zip = extractField(json, "zip");
            result.isp = extractField(json, "isp");
            result.org = extractField(json, "org");
            result.as_ = extractField(json, "as");
            result.timezone = extractField(json, "timezone");
            result.lat = extractDouble(json, "lat");
            result.lon = extractDouble(json, "lon");
            result.ip = extractField(json, "query");
            result.success = true;

        } catch (Exception e) {
            result.error = e.getMessage();
        } finally {
            if (conn != null) conn.disconnect();
        }
        return result;
    }

    private static String extractField(String json, String key) {
        int idx = json.indexOf("\"" + key + "\":");
        if (idx < 0) return "";
        int valStart = idx + key.length() + 3;
        if (valStart >= json.length()) return "";
        if (json.charAt(valStart) == '"') {
            valStart++;
            int valEnd = json.indexOf("\"", valStart);
            if (valEnd < 0) return json.substring(valStart);
            return json.substring(valStart, valEnd);
        } else {
            int valEnd = json.indexOf(",", valStart);
            if (valEnd < 0) valEnd = json.indexOf("}", valStart);
            if (valEnd < 0) return json.substring(valStart);
            return json.substring(valStart, valEnd);
        }
    }

    private static double extractDouble(String json, String key) {
        try {
            return Double.parseDouble(extractField(json, key));
        } catch (Exception e) {
            return 0;
        }
    }

    private static String readStream(java.io.InputStream is) throws Exception {
        BufferedReader br = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        return sb.toString();
    }
}
