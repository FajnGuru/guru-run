# Guru Run: Celetná 🐺

2D plošinovka pro Android (prototyp). Husky Guru běží po Celetné ulici k Prašné bráně.
Phaser 3 (lokálně ve `www/assets/vendor`, funguje offline), později zabalení přes Capacitor do APK.

## Spuštění
`npx serve www` → http://localhost:3000

## Ovládání
- Klávesnice: ← → / A D běh, ↑ / mezera / W skok, X / J otočka
- Mobil (na šířku): ← → vlevo dole, Skok + Otočka vpravo dole

## Pravidla
Kostičky (100 = život navíc), bedny FajnGuru (skok shora nebo otočka → kostičky nebo štít),
díry v dlažbě, valící se sudy (otočka je rozbije), holubi (otočka nebo skok na hlavu).
Cíl: bouda. Hodnocení 1–3 tlapky (bronz / stříbro / zlato).

## APK (později)
`npm i @capacitor/core @capacitor/cli @capacitor/android && npx cap add android && npx cap sync android`, pak build v Android Studiu.
