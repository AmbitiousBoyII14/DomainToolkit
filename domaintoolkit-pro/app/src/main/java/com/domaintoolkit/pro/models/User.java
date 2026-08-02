package com.domaintoolkit.pro.models;

/**
 * User model for authentication and premium tracking.
 * Java 7 compatible.
 */
public class User {

    private String id;
    private String email;
    private String displayName;
    private String photoUrl;
    private String provider;       // "google", "facebook", "email"
    private String providerId;     // Google/Facebook user ID
    private String premiumTier;    // "free", "premium_lite", "premium_plus", "premium_ultimate"
    private String premiumExpiry;  // ISO date string
    private String createdAt;
    private String lastLogin;
    private String deviceId;

    // ---- Getters ----

    public String getId() { return id; }
    public String getEmail() { return email; }
    public String getDisplayName() { return displayName; }
    public String getPhotoUrl() { return photoUrl; }
    public String getProvider() { return provider; }
    public String getProviderId() { return providerId; }
    public String getPremiumTier() { return premiumTier; }
    public String getPremiumExpiry() { return premiumExpiry; }
    public String getCreatedAt() { return createdAt; }
    public String getLastLogin() { return lastLogin; }
    public String getDeviceId() { return deviceId; }

    // ---- Setters ----

    public void setId(String id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public void setProvider(String provider) { this.provider = provider; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public void setPremiumTier(String premiumTier) { this.premiumTier = premiumTier; }
    public void setPremiumExpiry(String premiumExpiry) { this.premiumExpiry = premiumExpiry; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public void setLastLogin(String lastLogin) { this.lastLogin = lastLogin; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    /**
     * Check if user is premium.
     */
    public boolean isPremium() {
        return premiumTier != null && !premiumTier.isEmpty() && !"free".equals(premiumTier);
    }

    /**
     * Simple JSON serialization for API transport.
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"id\":\"").append(escape(id)).append("\",");
        sb.append("\"email\":\"").append(escape(email)).append("\",");
        sb.append("\"displayName\":\"").append(escape(displayName)).append("\",");
        sb.append("\"photoUrl\":\"").append(escape(photoUrl)).append("\",");
        sb.append("\"provider\":\"").append(escape(provider)).append("\",");
        sb.append("\"providerId\":\"").append(escape(providerId)).append("\",");
        sb.append("\"premiumTier\":\"").append(escape(premiumTier)).append("\",");
        sb.append("\"premiumExpiry\":\"").append(escape(premiumExpiry)).append("\",");
        sb.append("\"createdAt\":\"").append(escape(createdAt)).append("\",");
        sb.append("\"lastLogin\":\"").append(escape(lastLogin)).append("\",");
        sb.append("\"deviceId\":\"").append(escape(deviceId)).append("\"");
        sb.append("}");
        return sb.toString();
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
