package com.domaintoolkit.pro.network;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * URL redirect chain tracer.
 * Follows 301/302/303/307/308 redirects and records each hop:
 * - URL, status code, response time, headers.
 * Java 7 / AIDE compatible.
 */
public class RedirectTracerHelper {

    public static class HopInfo {
        public String url;
        public int statusCode;
        public String statusMessage;
        public long responseTimeMs;
        public String location;     // Redirect target
        public String serverType;
        public String contentType;
        public long contentLength;
    }

    public static class TraceResult {
        public String originalUrl;
        public String finalUrl;
        public List<HopInfo> hops = new ArrayList<HopInfo>();
        public int totalHops;
        public long totalTimeMs;
        public boolean reachedDestination;
        public boolean redirectLoop;
        public String error;
    }

    /**
     * Trace the full redirect chain for a URL.
     * Max 20 hops to prevent infinite loops.
     */
    public static TraceResult trace(String inputUrl) {
        TraceResult result = new TraceResult();
        result.originalUrl = inputUrl;

        // Normalize URL
        String currentUrl = inputUrl;
        if (!currentUrl.startsWith("http://") && !currentUrl.startsWith("https://")) {
            currentUrl = "https://" + currentUrl;
        }

        long totalStart = System.currentTimeMillis();
        int maxHops = 20;
        List<String> visited = new ArrayList<String>();

        for (int i = 0; i < maxHops; i++) {
            HopInfo hop = followOneHop(currentUrl);
            result.hops.add(hop);

            if (hop.responseTimeMs < 0) {
                result.error = "Failed at " + currentUrl;
                break;
            }

            result.totalTimeMs += hop.responseTimeMs;

            // Check for redirect loops
            if (visited.contains(currentUrl)) {
                result.redirectLoop = true;
                break;
            }
            visited.add(currentUrl);

            // Check if this is a redirect
            if (hop.statusCode >= 300 && hop.statusCode < 400 && hop.location != null) {
                // Handle relative redirects
                if (hop.location.startsWith("/")) {
                    try {
                        URL base = new URL(currentUrl);
                        currentUrl = base.getProtocol() + "://" + base.getHost() +
                                (base.getPort() > 0 ? ":" + base.getPort() : "") + hop.location;
                    } catch (Exception e) {
                        currentUrl = hop.location;
                    }
                } else {
                    currentUrl = hop.location;
                }
            } else {
                // Final destination
                result.finalUrl = currentUrl;
                result.reachedDestination = true;
                break;
            }
        }

        result.totalHops = result.hops.size();
        if (result.totalTimeMs == 0) {
            result.totalTimeMs = System.currentTimeMillis() - totalStart;
        }
        return result;
    }

    private static HopInfo followOneHop(String url) {
        HopInfo hop = new HopInfo();
        hop.url = url;

        HttpURLConnection conn = null;
        try {
            URL target = new URL(url);
            long start = System.currentTimeMillis();

            conn = (HttpURLConnection) target.openConnection();
            conn.setInstanceFollowRedirects(false); // Don't auto-follow!
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "DomainToolkitPro/1.0");

            hop.statusCode = conn.getResponseCode();
            hop.statusMessage = conn.getResponseMessage();
            hop.responseTimeMs = System.currentTimeMillis() - start;

            // Extract headers
            Map<String, List<String>> headers = conn.getHeaderFields();
            if (headers != null) {
                List<String> locations = headers.get("Location");
                if (locations != null && !locations.isEmpty()) {
                    hop.location = locations.get(0);
                }
                List<String> servers = headers.get("Server");
                if (servers != null && !servers.isEmpty()) {
                    hop.serverType = servers.get(0);
                }
                List<String> contentTypes = headers.get("Content-Type");
                if (contentTypes != null && !contentTypes.isEmpty()) {
                    hop.contentType = contentTypes.get(0);
                }
                String cl = conn.getHeaderField("Content-Length");
                if (cl != null) {
                    try { hop.contentLength = Long.parseLong(cl); }
                    catch (Exception ignored) {}
                }
            }

        } catch (Exception e) {
            hop.statusCode = -1;
            hop.statusMessage = e.getMessage();
            hop.responseTimeMs = -1;
        } finally {
            if (conn != null) conn.disconnect();
        }
        return hop;
    }
}
