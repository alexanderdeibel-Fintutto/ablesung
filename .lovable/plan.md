
# Fintutto Zählerstand - Meter Reading App mit OCR

Eine Mobile-First App zum Ablesen von Zählerständen mit KI-gestützter Bilderkennung.

## Design-System
- **Hauptfarbe**: #EAB308 (Gelb)
- **Akzentfarbe**: #F97316 (Orange)
- **Schrift**: Inter
- **Sprache**: Deutsch (formelle Anrede)

---

## 1. Authentifizierung
- Login/Registrierung mit E-Mail und Passwort
- Passwort-Reset Funktion
- Automatische Session-Verwaltung

## 2. Dashboard (Startseite)
- Übersicht aller Einheiten (Wohnungen/Häuser)
- Quick-Add Button für neue Ablesung
- Für jede Einheit: Liste der Zähler mit letztem Stand und Verbrauch
- Farbcodierte Zählertyp-Icons (Strom, Gas, Wasser, Heizung)

## 3. Einheiten-Verwaltung
- Einheit hinzufügen/bearbeiten (Name, Adresse)
- Zähler einer Einheit zuordnen
- Zähler anlegen mit Nummer und Typ

## 4. Zähler-Detailansicht
- Alle Ablesungen als Liste
- Verbrauchs-Chart (Liniendiagramm über Zeit)
- Jahresvergleich (aktuelles vs. Vorjahr)
- Export-Möglichkeit

## 5. Ablese-Flow (Kernfunktion)
1. Einheit und Zähler auswählen
2. Kamera-Ansicht mit visuellem Rahmen für Zähleranzeige
3. Foto aufnehmen oder aus Galerie hochladen
4. Ladebalken während KI-Analyse
5. Erkannter Wert wird angezeigt mit Konfidenz-Prozentsatz
6. Benutzer kann Wert bestätigen oder manuell korrigieren
7. Speichern mit Datum (Foto wird archiviert)

## 6. Technische Umsetzung

### Supabase Datenbank
- **units**: Wohnungen/Häuser des Benutzers
- **meters**: Zähler mit Typ und Nummer
- **meter_readings**: Ablesungen mit Datum, Wert, Foto-URL und Konfidenz

### Supabase Storage
- Bucket für Zählerfotos mit Benutzer-RLS

### Lovable AI Integration
- Edge Function für OCR-Verarbeitung
- Bildanalyse mit Google Gemini Vision

### Sicherheit
- Row-Level Security für alle Tabellen
- Benutzer sehen nur eigene Daten
