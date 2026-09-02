# Assets Directory

Place your company logo files in this directory (e.g. `logo.png`, `logo.svg`, `company-logo.png`).

### Usage in React Components:
```tsx
import companyLogo from '../assets/logo.png';

<img src={companyLogo} alt="Company Logo" style={{ height: '36px', objectFit: 'contain' }} />
```

Or place it in `frontend/public/assets/logo.png` and reference it directly:
```tsx
<img src="/assets/logo.png" alt="Company Logo" style={{ height: '36px', objectFit: 'contain' }} />
```
