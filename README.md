# D40 Fuel & Performance Planning – Android-App, Version 0.1

© FlFlATS/InstFl/LAbtFläFlz · Version 0.1 · 13.11.2026
Grundlage: FBH-B D40, Stand 01 09 26

## Inhalt
- `app/src/main/assets/index.html` – das Planungstool (offline lauffähig, jsPDF eingebettet)
- `app/src/main/java/.../MainActivity.java` – WebView-Hülle mit
  - Wetterabruf METAR/TAF direkt von aviationweather.gov (Knopf „Laden“; nur diese Adresse ist freigegeben)
  - Speichern der PDF-Broschüre im Ordner **Download/D40FPP** und Öffnen mit einer PDF-App
- App-ID `at.bmlv.flflats.d40fpp`, versionName 0.1, versionCode 1, Android 8.0 (API 26) oder neuer
- Berechtigung: nur Internet

## APK bauen – Variante A: Android Studio
1. Ordner `D40FPP` in Android Studio öffnen (File → Open). Gradle synchronisiert automatisch.
2. Menü **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
3. Die Datei liegt danach unter `app/build/outputs/apk/debug/app-debug.apk`.
4. APK aufs Handy kopieren, öffnen, „Installation aus unbekannten Quellen“ für diesen Vorgang erlauben.

## APK bauen – Variante B: GitHub (ohne Android Studio)
1. Neues **privates** Repository auf GitHub anlegen und den Inhalt dieses Ordners hochladen.
2. Unter **Actions** startet der Ablauf „D40 FPP APK bauen“ automatisch (Branch d40fpp-app).
3. Nach ca. 5 Minuten beim Lauf unter **Artifacts** die Datei `D40FPP-0.1` herunterladen (ZIP mit der APK).

## Hinweise
- Es handelt sich um eine Debug-APK (mit Entwicklerschlüssel signiert) – für Test und Erprobung.
  Für die dienstliche Verteilung ist ein eigener Signaturschlüssel und eine Freigabe erforderlich.
- Neue Version: `versionName`/`versionCode` in `app/build.gradle` sowie `APP.ver` in `index.html` anpassen.
- Planungshilfe – ersetzt nicht die Prüfung durch den verantwortlichen Piloten.
