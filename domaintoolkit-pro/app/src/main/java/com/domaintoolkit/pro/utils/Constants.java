package com.domaintoolkit.pro.utils;

/**
 * Application-wide constants for Domain Toolkit Pro.
 * Java 7 compatible - no lambda, no streams.
 */
public final class Constants {

    private Constants() {}

    // ---------- App Info ----------
    public static final String APP_NAME = "Domain Toolkit Pro";
    public static final String APP_VERSION = "2.0.0";
    public static final int APP_VERSION_CODE = 2;

    // ---------- API Keys (REPLACE THESE) ----------
    public static final String PAYPAL_CLIENT_ID = "YOUR_PAYPAL_CLIENT_ID";
    public static final String PAYPAL_CLIENT_SECRET = "YOUR_PAYPAL_CLIENT_SECRET";
    public static final String JSONBIN_BIN_ID = "YOUR_JSONBIN_BIN_ID";
    public static final String JSONBIN_MASTER_KEY = "YOUR_JSONBIN_MASTER_KEY";
    public static final String JSONBIN_ACCESS_KEY = "YOUR_JSONBIN_ACCESS_KEY";
    public static final String GOOGLE_WEB_CLIENT_ID = "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com";
    public static final String FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";
    public static final String HIBP_API_KEY = "YOUR_HIBP_API_KEY";

    // ---------- Premium ----------
    public static final int FREE_DAILY_SCAN_LIMIT = 10;
    public static final int FREE_DAILY_WS_SCAN_LIMIT = 5;
    public static final int FREE_DAILY_PORT_SCAN_LIMIT = 5;
    public static final int FREE_DAILY_EXPORT_LIMIT = 1;
    public static final int FREE_HISTORY_LIMIT = 20;

    public static final String PREMIUM_LITE = "premium_lite";
    public static final String PREMIUM_PLUS = "premium_plus";
    public static final String PREMIUM_ULTIMATE = "premium_ultimate";

    // ---------- SharedPreferences Keys ----------
    public static final String PREFS_NAME = "domaintoolkit_prefs";
    public static final String KEY_THEME_MODE = "theme_mode";
    public static final String KEY_ACCENT_COLOR = "accent_color";
    public static final String KEY_ANIMATION_SPEED = "animation_speed";
    public static final String KEY_PREMIUM_TIER = "premium_tier";
    public static final String KEY_DAILY_SCAN_COUNT = "daily_scan_count";
    public static final String KEY_DAILY_WS_COUNT = "daily_ws_count";
    public static final String KEY_DAILY_PORT_COUNT = "daily_port_count";
    public static final String KEY_DAILY_EXPORT_COUNT = "daily_export_count";
    public static final String KEY_LAST_RESET_DATE = "last_reset_date";
    public static final String KEY_NOTIFICATIONS_ENABLED = "notifications_enabled";
    public static final String KEY_EXPORT_FOLDER = "export_folder";

    // ---------- Theme ----------
    public static final int THEME_LIGHT = 0;
    public static final int THEME_DARK = 1;
    public static final int THEME_SYSTEM = 2;

    // ---------- Animation ----------
    public static final int ANIM_SPEED_FAST = 0;
    public static final int ANIM_SPEED_NORMAL = 1;
    public static final int ANIM_SPEED_SLOW = 2;

    // ---------- Request Codes ----------
    public static final int RC_GOOGLE_SIGN_IN = 9001;
    public static final int RC_FACEBOOK_SIGN_IN = 9002;
    public static final int RC_PAYPAL_CHECKOUT = 9003;

    // ---------- Network ----------
    public static final int CONNECT_TIMEOUT_MS = 10000;
    public static final int READ_TIMEOUT_MS = 15000;
    public static final int MAX_REDIRECTS = 10;

    // ---------- Common Ports ----------
    public static final int[] COMMON_PORTS = {
            21, 22, 23, 25, 53, 80, 110, 143, 443, 465,
            587, 993, 995, 1433, 1521, 2082, 2083, 2086,
            2087, 2095, 2096, 3306, 3389, 5432, 6379,
            8080, 8443, 8888, 9090, 27017
    };

    // ---------- WebSocket Paths ----------
    public static final String[] WS_COMMON_PATHS = {
            "/", "/ws", "/wss", "/socket", "/socket.io",
            "/websocket", "/live", "/api/ws", "/chat",
            "/stream", "/realtime", "/notifications",
            "/events", "/graphql-ws", "/signalr", "/ws/v1"
    };

    // ---------- DNS Record Types ----------
    public static final String[] DNS_RECORD_TYPES = {
            "A", "AAAA", "MX", "TXT", "CNAME", "NS", "SOA", "PTR", "SRV", "CAA"
    };

    // ---------- Security Headers ----------
    public static final String[] SECURITY_HEADERS = {
            "Strict-Transport-Security", "Content-Security-Policy",
            "X-Frame-Options", "X-Content-Type-Options", "X-XSS-Protection",
            "Referrer-Policy", "Permissions-Policy", "Cross-Origin-Resource-Policy",
            "Cross-Origin-Opener-Policy", "Cross-Origin-Embedder-Policy"
    };

    // ---------- CDN / Hosting Headers ----------
    public static final String[] CDN_HEADERS = {
            "cf-ray", "x-amz-cf-id", "x-azure-ref", "x-goog-generation",
            "x-vercel-id", "x-nf-request-id", "x-served-by", "x-cache",
            "x-bunny", "x-edge-location", "x-powered-by", "server"
    };

    // ---------- Export Formats ----------
    public static final int EXPORT_TXT = 0;
    public static final int EXPORT_CSV = 1;
    public static final int EXPORT_JSON = 2;
    public static final int EXPORT_PDF = 3;

    // ---------- Database ----------
    public static final String DB_NAME = "domaintoolkit.db";
    public static final int DB_VERSION = 1;

    // ---------- Intent Keys ----------
    public static final String EXTRA_DOMAIN = "extra_domain";
    public static final String EXTRA_SCAN_TYPE = "extra_scan_type";
    public static final String EXTRA_SCAN_ID = "extra_scan_id";
    public static final String EXTRA_RESULT = "extra_result";

    // ---------- Scan Types ----------
    public static final int SCAN_ALL = 0;
    public static final int SCAN_DNS = 1;
    public static final int SCAN_WHOIS = 2;
    public static final int SCAN_SSL = 3;
    public static final int SCAN_WS = 4;
    public static final int SCAN_HTTP = 5;
    public static final int SCAN_HOSTING = 6;
    public static final int SCAN_SECURITY = 7;
    public static final int SCAN_PORT = 8;
    public static final int SCAN_SUBDOMAIN = 9;
    public static final int SCAN_GEOIP = 10;
    public static final int SCAN_EMAIL = 11;
    public static final int SCAN_BREACH = 12;
    public static final int SCAN_REDIRECT = 13;
}
