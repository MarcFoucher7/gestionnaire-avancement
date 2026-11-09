#!/bin/bash
# Installe « Avancement Helper » : une mini app macOS qui gère les liens avancement://
#   avancement://open?path=/chemin  → ouvre le dossier dans le Finder
#   avancement://pick               → ouvre un sélecteur de dossier et copie le chemin choisi
# Usage : curl -fsSL https://<ton-app>.vercel.app/install-helper-macos.sh | bash
set -euo pipefail

APP="$HOME/Applications/Avancement Helper.app"
TMP="$(mktemp -d)"
mkdir -p "$HOME/Applications"

cat > "$TMP/helper.applescript" <<'APPLESCRIPT'
on open location theURL
	if theURL starts with "avancement://pick" then
		try
			set chosen to choose folder with prompt "Choisis le dossier du projet"
			set the clipboard to (POSIX path of chosen)
			display notification "Chemin copié, retourne dans le navigateur" with title "Avancement"
		end try
	else if theURL starts with "avancement://open" then
		set p to do shell script "printf %s " & quoted form of theURL & " | sed -E 's/^[^?]*\\?path=//' | perl -pe 's/%([0-9A-Fa-f]{2})/chr(hex($1))/eg'"
		do shell script "open " & quoted form of p
	end if
end open location

on run
	display dialog "Avancement Helper est installé. Les boutons 📁 et Finder de l'app fonctionnent maintenant." buttons {"OK"} default button 1
end run
APPLESCRIPT

rm -rf "$APP"
osacompile -o "$APP" "$TMP/helper.applescript"

PLIST="$APP/Contents/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIdentifier string fr.avancement.helper" "$PLIST" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :CFBundleIdentifier fr.avancement.helper" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :LSUIElement bool true" "$PLIST" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLName string Avancement" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$PLIST"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string avancement" "$PLIST"

# re-signer après modification du Info.plist, puis enregistrer le schéma d'URL
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP"
open "$APP"
rm -rf "$TMP"
echo "✅ Avancement Helper installé dans $APP"
