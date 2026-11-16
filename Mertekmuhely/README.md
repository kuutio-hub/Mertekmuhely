# Mértékműhely

Magyar felvételi-gyakorló 7–8. osztályosoknak. A `dist/` könyvtár statikus oldal, telepítés és build nélkül használható.

- GitHub Pagesen töltsd fel a `dist/` tartalmát a kiválasztott közzétételi mappába (a repó gyökere vagy a `docs/`), majd válaszd ki ezt a mappát a Pages beállításaiban.
- Saját webtárhelyen az `index.html` mellett maradjon a többi fájl. Helyi használathoz indíts HTTP-kiszolgálót a könyvtárból, például `python3 -m http.server 8000`, és nyisd meg a `http://localhost:8000` címet.
- A `segedlet.json` a webes és nyomtatási segédlet közös adatforrása. Az `archivum.json` a hivatalos évoldalak jegyzéke. A feladatgenerátor az `engine.mjs` fájlban található.
- A piszkozat, az aktív feladatsor és a hibafüzet a böngészőben tárolódik. A feladatsorkód ugyanazt a generált feladatsort állítja elő az alkalmazás azonos verziójában.
- A próbafelvételi egy 45 perces, 50 pontos generált gyakorlósor. Az automatikus javítás a megadott válaszokat és részeredményeket ellenőrzi. A nyomtatott javítókulcs külön nyomtatható.
- A 2005–2026-os archívum nézete az Oktatási Hivatal oldalaira vezet. A gyakorlóban saját generált feladatok jelennek meg.
