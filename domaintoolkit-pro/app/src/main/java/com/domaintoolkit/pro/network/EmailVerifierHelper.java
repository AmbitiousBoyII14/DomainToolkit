package com.domaintoolkit.pro.network;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;

import javax.net.ssl.SSLSocketFactory;

/**
 * Email verification tool — checks MX records, SMTP handshake,
 * and mailbox existence via SMTP VRFY/RCPT TO handshake.
 * Java 7 compatible.
 */
public class EmailVerifierHelper {

    public static class EmailResult {
        public String email;
        public boolean validFormat;
        public boolean hasMxRecords;
        public List<String> mxServers = new ArrayList<String>();
        public boolean mailboxExists;
        public boolean isDisposable;
        public boolean isRoleAccount;
        public int smtpResponseCode;
        public String smtpMessage;
        public String error;
    }

    /**
     * Verify an email address end-to-end.
     */
    public static EmailResult verify(String email) {
        EmailResult result = new EmailResult();
        result.email = email;

        if (email == null || !email.contains("@")) {
            result.validFormat = false;
            return result;
        }
        result.validFormat = true;

        String domain = email.substring(email.indexOf("@") + 1).trim().toLowerCase();
        result.isRoleAccount = isRoleAccount(email);
        result.isDisposable = isDisposableDomain(domain);

        // Step 1: DNS MX lookup
        result.mxServers = DnsLookupHelper.lookupMx(domain);
        result.hasMxRecords = !result.mxServers.isEmpty();

        // Step 2: SMTP handshake
        if (result.hasMxRecords) {
            smtpVerify(result, email);
        }

        return result;
    }

    private static void smtpVerify(EmailResult result, String email) {
        Socket socket = null;
        BufferedReader reader = null;
        OutputStream writer = null;

        try {
            String domain = email.substring(email.indexOf("@") + 1);
            String mxServer = result.mxServers.get(0);

            socket = new Socket(mxServer, 25);
            socket.setSoTimeout(10000);
            reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            writer = socket.getOutputStream();

            // Read greeting
            String response = reader.readLine();
            if (response == null || !response.startsWith("220")) {
                result.smtpMessage = "SMTP connection refused";
                return;
            }

            // HELO
            sendCommand(writer, reader, "HELO domaintoolkit.pro");
            // MAIL FROM
            response = sendCommand(writer, reader, "MAIL FROM:<verify@domaintoolkit.pro>");
            if (!response.startsWith("250")) {
                result.smtpMessage = "MAIL FROM rejected";
                return;
            }
            // RCPT TO
            response = sendCommand(writer, reader, "RCPT TO:<" + email + ">");
            result.smtpResponseCode = parseSmtpCode(response);
            result.smtpMessage = response;

            if (response.startsWith("250")) {
                result.mailboxExists = true;
            } else if (response.startsWith("550") || response.startsWith("551") ||
                       response.startsWith("552") || response.startsWith("553")) {
                result.mailboxExists = false;
            } else {
                // 450, 451, 452 = temporary failure — can't determine
                result.mailboxExists = true; // Assume exists on soft bounce
            }

            // QUIT
            sendCommand(writer, reader, "QUIT");

        } catch (Exception e) {
            result.error = e.getMessage();
        } finally {
            try { if (reader != null) reader.close(); } catch (Exception ignored) {}
            try { if (writer != null) writer.close(); } catch (Exception ignored) {}
            try { if (socket != null) socket.close(); } catch (Exception ignored) {}
        }
    }

    private static String sendCommand(OutputStream out, BufferedReader in, String cmd) throws Exception {
        out.write((cmd + "\r\n").getBytes("UTF-8"));
        out.flush();
        String response = in.readLine();
        // Read continuation lines (250-xxxxx)
        if (response != null && response.length() > 3 && response.charAt(3) == '-') {
            String line;
            while ((line = in.readLine()) != null) {
                if (line.length() > 3 && line.charAt(3) == ' ') break;
            }
        }
        return response != null ? response : "";
    }

    private static int parseSmtpCode(String response) {
        if (response == null || response.length() < 3) return 0;
        try {
            return Integer.parseInt(response.substring(0, 3));
        } catch (Exception e) {
            return 0;
        }
    }

    private static boolean isRoleAccount(String email) {
        String local = email.substring(0, email.indexOf("@")).toLowerCase();
        String[] roles = {"admin", "support", "info", "sales", "contact", "help",
                "noreply", "no-reply", "abuse", "postmaster", "webmaster", "hostmaster"};
        for (String role : roles) {
            if (local.equals(role)) return true;
        }
        return false;
    }

    private static boolean isDisposableDomain(String domain) {
        String[] disposables = {"mailinator.com", "guerrillamail.com", "10minutemail.com",
                "tempmail.com", "throwaway.email", "yopmail.com", "sharklasers.com",
                "trashmail.com", "fakeinbox.com", "temp-mail.org"};
        for (String d : disposables) {
            if (domain.equals(d)) return true;
        }
        return false;
    }

    /**
     * Tiny MX record lookup via dns.google.com.
     */
    public static class DnsLookupHelper {
        public static List<String> lookupMx(String domain) {
            List<String> servers = new ArrayList<String>();
            HttpURLConnection conn = null;
            try {
                URL url = new URL("https://dns.google/resolve?name=" + domain + "&type=MX");
                conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);
                String json = readStream(conn.getInputStream());

                // Parse MX records from Google DNS JSON
                int anIdx = json.indexOf("\"Answer\"");
                if (anIdx < 0) return servers;
                int arrStart = json.indexOf("[", anIdx);
                int arrEnd = json.indexOf("]", arrStart);
                if (arrStart < 0 || arrEnd < 0) return servers;

                String answers = json.substring(arrStart + 1, arrEnd);
                // Extract data: "mxserver.com."
                int searchIdx = 0;
                while (true) {
                    int dataIdx = answers.indexOf("\"data\":\"", searchIdx);
                    if (dataIdx < 0) break;
                    int valStart = dataIdx + 8;
                    int valEnd = answers.indexOf("\"", valStart);
                    if (valEnd < 0) break;
                    String mx = answers.substring(valStart, valEnd);
                    if (mx.endsWith(".")) mx = mx.substring(0, mx.length() - 1);
                    servers.add(mx);
                    searchIdx = valEnd + 1;
                }
            } catch (Exception e) {
                // Fallback: common MX patterns
                servers.add("aspmx.l.google.com");
            } finally {
                if (conn != null) conn.disconnect();
            }
            return servers;
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
}
