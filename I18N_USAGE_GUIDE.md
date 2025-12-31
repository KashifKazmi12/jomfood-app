# i18n Usage Guide

This app uses `react-i18next` for internationalization (i18n). Frontend text is translated manually, while backend data is shown as-is.

## Setup

i18n is already initialized in `index.js` and configured in `src/i18n/config.js`.

## Default Language

The default language is **Malay (ms)** as per your requirement.

## How to Use Translations

### 1. In Components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('common.login')}</Text>
  );
}
```

### 2. Translation Keys Structure

Translation keys are organized by feature:

- `common.*` - Common UI text (login, save, cancel, etc.)
- `home.*` - Home screen text
- `header.*` - Header component text

### 3. Adding New Translations

1. **Add to English** (`src/i18n/locales/en.json`):
```json
{
  "myFeature": {
    "title": "My Title",
    "description": "My Description"
  }
}
```

2. **Add to Malay** (`src/i18n/locales/ms.json`):
```json
{
  "myFeature": {
    "title": "Tajuk Saya",
    "description": "Penerangan Saya"
  }
}
```

3. **Use in component**:
```jsx
<Text>{t('myFeature.title')}</Text>
```

### 4. Language Switcher

The `LanguageSwitcher` component is already integrated in `HeaderWithLogo`. It shows a flag icon and opens a modal to switch languages.

**Usage:**
```jsx
import LanguageSwitcher from './components/LanguageSwitcher';

<LanguageSwitcher />
```

### 5. Programmatic Language Change

```jsx
import useLanguage from './src/i18n/useLanguage';

function MyComponent() {
  const { changeLanguage, currentLanguage } = useLanguage();
  
  return (
    <Button onPress={() => changeLanguage('en')}>
      Switch to English
    </Button>
  );
}
```

## Important Notes

1. **Backend Data**: Backend API responses are shown as-is, without translation. Only frontend UI text is translated.

2. **Language Persistence**: The selected language is saved in AsyncStorage and persists across app restarts.

3. **Default Language**: On first launch, the app defaults to Malay (ms).

4. **Available Languages**:
   - `en` - English
   - `ms` - Bahasa Melayu (Malay)

## Example: Complete Component

```jsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import useLanguage from '../i18n/useLanguage';

export default function MyScreen() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useLanguage();
  
  return (
    <View>
      <Text>{t('home.popularOffers')}</Text>
      <Text>Current Language: {currentLanguage}</Text>
      <Button 
        title={t('common.save')} 
        onPress={() => {}}
      />
    </View>
  );
}
```

## Translation Files Location

- English: `src/i18n/locales/en.json`
- Malay: `src/i18n/locales/ms.json`

Add your translations to these files as needed.

