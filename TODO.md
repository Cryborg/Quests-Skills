# TODO - Améliorations futures

## Module Cards

### Performance - Animation scroll horizontal des images landscape
**Priorité**: Moyenne
**Fichier**: `modules/cards/css/styles.css`

**Problème**:
L'animation de scroll horizontal des images landscape (comète, mars, saturne) présente un léger lag/flicker visible. L'animation utilise `transform: translateX()` qui devrait être GPU-accéléré, mais il y a quand même une petite saccade.

**Contexte**:
- Les animations concernées : `pan-horizontal`, `pan-horizontal-modal`, `pan-horizontal-draw`
- Images affectées : toutes les images plus larges que hautes (détectées par la classe `.landscape`)
- Le scroll vertical avec `object-position` fonctionne parfaitement sans lag

**Pistes à explorer**:
1. Vérifier si `will-change: transform` et `backface-visibility: hidden` sont bien appliqués
2. Tester avec `transform: translate3d()` au lieu de `translateX()` pour forcer l'accélération 3D
3. Regarder si le problème vient de `object-fit: contain` qui pourrait causer des recalculs
4. Essayer d'utiliser une technique différente (CSS clip-path, masque, etc.)
5. Investiguer si le problème est lié à la taille/résolution des images

**Code actuel** (lignes 517-527 de styles.css):
```css
@keyframes pan-horizontal {
    0%, 15% {
        transform: translateX(10%);
    }
    42%, 58% {
        transform: translateX(-10%);
    }
    85%, 100% {
        transform: translateX(10%);
    }
}
```

**Note**: L'animation fonctionne correctement et reste dans les limites des images (pas de bandes grises), mais la fluidité n'est pas optimale.
