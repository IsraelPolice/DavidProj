# מערכת ניהול משרד עורכי דין

מערכת מקיפה לניהול תיקים, משימות, מסמכים, שיחות והודעות צ'אט עם לקוחות עבור משרדי עורכי דין.

## תכונות עיקריות

- **ניהול תיקים**: מעקב אחר כל התיקים עם פרטי לקוחות, סטטוס, ומסמכים
- **משימות והתראות**: דאשבורד מרכזי לכל המשימות הפתוחות והדחופות
- **ציר זמן רפואי ומשפטי**: תיעוד כל האירועים והשלבים בכל תיק
- **מסמכים**: מעקב אחר מסמכי ייצוג, סטטוס חתימה ושליחה
- **צ'אט עם לקוחות**: ממשק הודעות מובנה לתקשורת עם לקוחות
- **תבניות ציר רפואי**: הגדרת תהליכי עבודה מובנים להחלה אוטומטית
- **ניהול עורכי דין**: ניהול צוות ושיוך תיקים
- **אבטחה מלאה**: אימות משתמשים ו-RLS (Row Level Security)

## טכנולוגיות

- **Frontend**: Vanilla JavaScript, Vite
- **Backend**: Supabase (PostgreSQL)
- **אימות**: Supabase Auth
- **עיצוב**: CSS Variables, RTL Support

## התקנה

### דרישות מקדימות

- Node.js 18 ומעלה
- חשבון Supabase (כבר מוקם)
- פרטי התחברות ל-Supabase

### שלבי התקנה

1. **התקנת חבילות**:
   ```bash
   npm install
   ```

2. **הגדרת משתני סביבה**:
   הקובץ `.env` כבר מוכן עם פרטי ההתחברות ל-Supabase.

3. **בדיקת בסיס הנתונים**:
   כל הטבלאות, השדות והנתונים ההתחלתיים כבר נוצרו ב-Supabase.

4. **הרצת המערכת במצב פיתוח**:
   ```bash
   npm run dev
   ```

5. **בנייה לפרודקשן**:
   ```bash
   npm run build
   npm run preview
   ```

## יצירת משתמש ראשון

כדי להיכנס למערכת, צור משתמש דרך Supabase Dashboard:

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. עבור ל-Authentication → Users
4. לחץ על "Add User" → "Create new user"
5. הזן אימייל וסיסמה (לדוגמה: `admin@lawoffice.com` / `password123`)
6. המשתמש ייווצר אוטומטית עם פרופיל במערכת

## מבנה הפרויקט

```
project/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client
│   ├── services/                # שכבת API
│   │   ├── auth.service.js
│   │   ├── cases.service.js
│   │   ├── tasks.service.js
│   │   ├── documents.service.js
│   │   ├── calls.service.js
│   │   ├── timeline.service.js
│   │   ├── chat.service.js
│   │   ├── lawyers.service.js
│   │   ├── caseTypes.service.js
│   │   └── templates.service.js
│   ├── state/
│   │   └── AppState.js           # ניהול מצב
│   ├── ui/
│   │   └── UIManager.js          # ניהול UI
│   ├── navigation/
│   │   └── NavigationManager.js  # ניהול ניווט
│   ├── views/                    # מסכים
│   │   ├── CasesView.js
│   │   ├── TasksView.js
│   │   ├── MessagesView.js
│   │   ├── ManagementView.js
│   │   └── CaseDetailView.js
│   ├── styles/
│   │   └── main.css              # עיצוב
│   └── main.js                   # נקודת כניסה
├── index.html
├── package.json
├── vite.config.js
└── .env                          # משתני סביבה
```

## מבנה בסיס הנתונים

המערכת משתמשת ב-14 טבלאות:

- `profiles` - פרופילי משתמשים
- `lawyers` - עורכי דין במשרד
- `case_types` - סוגי תיקים
- `cases` - תיקים
- `case_lawyers` - קשר בין תיקים לעורכי דין
- `case_tasks` - משימות
- `case_calls` - שיחות
- `timeline_events` - אירועי ציר זמן
- `event_files` - קבצים מצורפים לאירועים
- `case_documents` - מסמכי ייצוג
- `chat_messages` - הודעות צ'אט
- `templates` - תבניות ציר רפואי
- `template_steps` - שלבים בתבניות
- `case_templates` - קשר בין תיקים לתבניות

כל הטבלאות מוגנות עם RLS (Row Level Security) ומדיניות אבטחה מלאה.

## נתונים התחלתיים

המערכת כוללת:
- 4 עורכי דין לדוגמה
- 8 סוגי תיקים
- 1 תבנית ציר רפואי ("פרוטוקול ליקוי שמיעה")

## הרחבות עתידיות

- מערכת העלאת קבצים (Supabase Storage)
- ניהול הרשאות מתקדם
- דוחות ואנליטיקס
- התראות בזמן אמת
- אינטגרציה עם מערכות חיצוניות

## תמיכה

לשאלות ותמיכה, פנה למפתח המערכת.
