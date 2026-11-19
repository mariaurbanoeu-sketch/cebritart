# El taller de Cebritart

Web d'una sola pàgina de Miguel Ruiz (@cebritart), il·lustrador a tinta i futur artista faller. Bilingüe (valencià / castellà), feta a mà amb HTML, CSS i JavaScript, sense frameworks.

## Què hi ha

- **Hero amb la grúa 3D** (three.js, traç de tinta), la mascletà amb la senyera i el carret de bunyols.
- **La paret, el suro i les maquetes**: il·lustracions, el que s'ha fet viral i els projectes de marca en una prestatgeria 3D.
- **A mitjan pàgina es fa de nit**: capvespre, guirnaldes, petards inesperats (so, tremolor i vibració al mòbil) i el castell de focs final.
- **Interaccions**: l'Ofrena compartida (es buida cada mes), l'indult (es revela del 15 al 19 de març), la taula de dibuix, la revista 3D i el prototip de Figma del Passaport Faller.
- **Encàrrecs**: albarà pas a pas que s'emporta la grúa.

## Publicar

És una web estàtica: n'hi ha prou amb servir la carpeta (GitHub Pages, Netlify, el hosting del domini…). Per a provar-la en local:

```bash
python3 -m http.server 8000
```

## Configuració pendent (a `index.html`)

| Constant | Per a què |
|---|---|
| `SUPA_URL`, `SUPA_KEY` | Ofrena i indult compartits. Crea un projecte a Supabase i executa `supabase.sql`. Sense això, les dades es guarden només al navegador de cada persona. |
| `FORM_ENDPOINT` | Que els encàrrecs arriben directament al correu (Formspree, Web3Forms…). Sense això, s'obri el correu de qui encarrega. |
| `FIGMA_PROTO` | Enllaç del prototip del Passaport Faller (ja configurat). |

Il·lustracions i marca: © Miguel Ruiz · Cebritart. Web: [Paula Urbano](https://paulaurbanog.com).
