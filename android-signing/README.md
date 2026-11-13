# Signaturschlüssel für Test-Builds

`debug.keystore` ist ein fester Debug-Schlüssel (Passwort `android`, Alias `androiddebugkey`).
Der Build verwendet ihn, damit jede neue APK über die installierte App aktualisiert werden kann.
Für eine offizielle Verteilung einen eigenen Release-Schlüssel als GitHub-Secret anlegen.
