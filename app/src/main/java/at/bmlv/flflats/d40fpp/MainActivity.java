package at.bmlv.flflats.d40fpp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * D40 Fuel & Performance Planning – Version 0.1
 * © FlFlATS/InstFl/LAbtFläFlz
 *
 * Zeigt die Planungsseite (assets/index.html) in einer WebView an.
 * Die Brücke "AndroidBridge" stellt zwei Funktionen bereit:
 *  - httpGet: METAR/TAF von aviationweather.gov laden (nur diese Domain)
 *  - saveFile: erzeugte PDF/HTML-Dateien im Ordner Download/D40FPP speichern und öffnen
 */
public class MainActivity extends Activity {

    private static final String ALLOWED_PREFIX = "https://aviationweather.gov/api/data/";
    private WebView webView;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage für gespeicherte Eingaben
        s.setAllowFileAccess(true);             // file:///android_asset
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);

        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                if ("file".equals(scheme)) return false;
                // externe Links (z.B. aviationweather.gov) im Browser öffnen
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "Kein Browser gefunden", Toast.LENGTH_SHORT).show();
                }
                return true;
            }
        });

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
        } else {
            webView.loadUrl("file:///android_asset/index.html");
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    private class Bridge {

        @JavascriptInterface
        public void httpGet(final String url, final String cbId) {
            new Thread(() -> {
                boolean ok = false;
                String payload;
                try {
                    if (url == null || !url.startsWith(ALLOWED_PREFIX)) throw new Exception("Adresse nicht erlaubt");
                    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                    c.setConnectTimeout(15000);
                    c.setReadTimeout(15000);
                    c.setRequestProperty("User-Agent", "D40FPP/0.1 (Android)");
                    int code = c.getResponseCode();
                    InputStream in = code < 400 ? c.getInputStream() : c.getErrorStream();
                    byte[] body = readAll(in);
                    c.disconnect();
                    ok = code < 400;
                    payload = Base64.encodeToString(body, Base64.NO_WRAP);
                } catch (Exception e) {
                    String msg = "Abruf fehlgeschlagen: " + e.getMessage();
                    payload = Base64.encodeToString(msg.getBytes(java.nio.charset.StandardCharsets.UTF_8), Base64.NO_WRAP);
                }
                final String js = "window.__httpcb('" + cbId.replaceAll("[^A-Za-z0-9]", "") + "'," + ok + ",'" + payload + "')";
                webView.post(() -> webView.evaluateJavascript(js, null));
            }).start();
        }

        @JavascriptInterface
        public String saveFile(String filename, String base64) {
            try {
                String name = filename.replaceAll("[\\\\/:*?\"<>|]", "_");
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                String mime = name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "text/html";
                Uri uri;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentResolver cr = getContentResolver();
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                    v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/D40FPP");
                    uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) throw new Exception("Speichern nicht möglich");
                    try (OutputStream os = cr.openOutputStream(uri)) { os.write(data); }
                } else {
                    File dir = new File(getExternalFilesDir(null), "Download");
                    if (!dir.exists() && !dir.mkdirs()) throw new Exception("Ordner nicht anlegbar");
                    File f = new File(dir, name);
                    try (FileOutputStream os = new FileOutputStream(f)) { os.write(data); }
                    uri = FileProvider.getUriForFile(MainActivity.this, getPackageName() + ".fileprovider", f);
                }
                final Uri openUri = uri;
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "Gespeichert: Download/D40FPP/" + name, Toast.LENGTH_LONG).show();
                    Intent view = new Intent(Intent.ACTION_VIEW);
                    view.setDataAndType(openUri, mime);
                    view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    try {
                        startActivity(Intent.createChooser(view, "Öffnen mit"));
                    } catch (ActivityNotFoundException ignored) { }
                });
                return "ok";
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this, "Fehler: " + e.getMessage(), Toast.LENGTH_LONG).show());
                return "error";
            }
        }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        if (in == null) return new byte[0];
        ByteArrayOutputStream bo = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = in.read(buf)) > 0) bo.write(buf, 0, n);
        in.close();
        return bo.toByteArray();
    }
}
