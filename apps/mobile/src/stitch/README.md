## Mobile UI export (Google Stitch)

This folder provides a single import surface for the mobile design system.

### What to copy
- `apps/mobile/src/stitch/`
- `apps/mobile/src/theme/`
- `apps/mobile/src/components/ui/`

### What it contains
- **Design tokens**: colors/spacing/radii/typography in `src/theme/tokens.ts`
- **Theme**: `src/theme/theme.ts`
- **UI primitives**: `Button`, `Card`, `Text`, `Badge`, `Divider`, `ListRow`, `Icon`

### Import example

```ts
import { theme, tokens, Button, Card, Text, Icon } from "../stitch";
```

