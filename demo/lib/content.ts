import type { TranslationStrings } from '@inkpilot/editor';

export const DEMO_LANGS = ['en', 'ar'] as const;
export type DemoLang = (typeof DEMO_LANGS)[number];

export function isDemoLang(value: unknown): value is DemoLang {
  return (DEMO_LANGS as readonly unknown[]).includes(value);
}

interface ArticleText {
  title: string;
  /** One long sentence, so the live checks flag it and Fix with AI has something to do. */
  long: string;
  /** What the scripted model proposes for `long`. */
  fixed: string;
  rest: string;
}

/**
 * The seeded article and the scripted model's canned answers, per language.
 * Shared by the page (seed) and the server route (model), so the two always match.
 */
export const ARTICLE: Record<DemoLang, ArticleText> = {
  en: {
    title: 'How we cut our Next.js build time in half',
    long: 'We started by measuring where the time actually went, and it turned out that type checking, which ran inside next build and again in a separate CI job because nobody had removed the old step after the migration, accounted for almost forty percent of the total, while image optimization during the build accounted for most of the rest.',
    fixed: 'We started by measuring where the time actually went. Type checking took almost forty percent of the total. It ran inside next build and again in a separate CI job, because nobody removed the old step after the migration. Image optimization during the build took most of the rest.',
    rest: `<p>The fix was two lines in the workflow file.</p>
<h2>What changed</h2>
<p>We moved type checking into a single CI job and turned off image optimization at build time.</p>
<p>Images are now optimized on request by the CDN, which caches each size the first time a page asks for it.</p>
<h2>What it saved</h2>
<p>Builds went from eleven minutes to five. Over a month of merges, that is about forty hours of CI time.</p>`,
  },
  ar: {
    title: 'كيف خفّضنا وقت بناء Next.js إلى النصف',
    long: 'بدأنا بقياس المكان الذي يذهب إليه الوقت فعلاً، واتضح أن فحص الأنواع، الذي كان يعمل داخل next build ثم مرة أخرى في مهمة CI منفصلة لأن أحداً لم يحذف الخطوة القديمة بعد الترحيل، كان يستهلك نحو أربعين بالمئة من الوقت الكلي، بينما استهلك تحسين الصور أثناء البناء معظم الباقي.',
    fixed: 'بدأنا بقياس المكان الذي يذهب إليه الوقت فعلاً. استهلك فحص الأنواع نحو أربعين بالمئة من الوقت الكلي. كان يعمل داخل next build ثم مرة أخرى في مهمة CI منفصلة، لأن أحداً لم يحذف الخطوة القديمة بعد الترحيل. واستهلك تحسين الصور أثناء البناء معظم الباقي.',
    rest: `<p>كان الإصلاح سطرين في ملف سير العمل.</p>
<h2>ما الذي تغيّر</h2>
<p>نقلنا فحص الأنواع إلى مهمة CI واحدة، وأوقفنا تحسين الصور أثناء البناء.</p>
<p>أصبحت الصور تُحسَّن عند الطلب عبر شبكة CDN، التي تخزّن كل حجم في أول مرة تطلبه صفحة.</p>
<h2>ما الذي وفّرناه</h2>
<p>انخفض وقت البناء من إحدى عشرة دقيقة إلى خمس. وعلى مدى شهر من الدمج، هذا نحو أربعين ساعة من وقت CI.</p>`,
  },
};

export function articleHtml(lang: DemoLang): string {
  const { title, long, rest } = ARTICLE[lang];
  return `<h1>${title}</h1><p>${long}</p>${rest}`;
}

/** Canned title, description and alt suggestions for the scripted model. */
export const SUGGESTIONS: Record<DemoLang, { titles: string[]; descriptions: string[]; alt: string }> = {
  en: {
    titles: ['How we cut our Next.js build time in half', 'Two CI changes that halved our Next.js builds', 'Where our Next.js build minutes went'],
    descriptions: [
      'Type checking ran twice and images were optimized on every build. Two lines in our CI workflow cut Next.js build time in half.',
      'Where our Next.js build minutes went, and the two-line workflow change that brought eleven-minute builds down to five.',
    ],
    alt: 'Chart of weekly build minutes before and after the change',
  },
  ar: {
    titles: ['كيف خفّضنا وقت بناء Next.js إلى النصف', 'تغييران في CI خفّضا وقت بناء Next.js إلى النصف', 'أين ذهبت دقائق بناء Next.js لدينا'],
    descriptions: [
      'كان فحص الأنواع يعمل مرتين وتُحسَّن الصور في كل بناء. سطران في سير عمل CI خفّضا وقت بناء Next.js إلى النصف.',
      'أين ذهبت دقائق بناء Next.js لدينا، والتغيير البسيط في سير العمل الذي خفّض البناء من إحدى عشرة دقيقة إلى خمس.',
    ],
    alt: 'رسم بياني لدقائق البناء الأسبوعية قبل التغيير وبعده',
  },
};

interface ShellText {
  loopTitle: string;
  loopIntro: string;
  steps: [title: string, detail: string][];
  scripted: string;
  realModel: (provider: string) => string;
  published: (title: string, score: number) => string;
  otherTheme: Record<'dark' | 'light', string>;
  otherLang: string;
}

/** Copy for the page around the editor. */
export const SHELL: Record<DemoLang, ShellText> = {
  en: {
    loopTitle: 'Try the loop',
    loopIntro: 'Each step puts the editor in that state. You can also just write.',
    steps: [
      ['Write', 'The wavy line marks a 58-word sentence. Hover it.'],
      ['Fix with AI', 'The suggestion streams in next to the original.'],
      ['Accept', 'Enter accepts it as one undo step, and the checks run again.'],
      ['Publish', 'Review the checks, title, description and slug.'],
    ],
    scripted: 'Scripted model: answers are canned, so the demo is free to run.',
    realModel: (provider) => `AI answers come from ${provider}.`,
    published: (title, score) => `Published “${title}” at ${score} on Inkpilot checks.`,
    otherTheme: { dark: 'Light mode', light: 'Dark mode' },
    otherLang: 'العربية',
  },
  ar: {
    loopTitle: 'جرّب الحلقة',
    loopIntro: 'كل خطوة تضع المحرر في تلك الحالة. ويمكنك الكتابة مباشرة.',
    steps: [
      ['اكتب', 'الخط المتموّج يشير إلى جملة طويلة. مرّر المؤشر فوقها.'],
      ['أصلِح بالذكاء الاصطناعي', 'يظهر الاقتراح بجانب النص الأصلي أثناء كتابته.'],
      ['اقبل', 'مفتاح Enter يقبله كخطوة تراجع واحدة، ثم تُعاد الفحوص.'],
      ['انشر', 'راجع الفحوص والعنوان والوصف والرابط.'],
    ],
    scripted: 'نموذج تجريبي: الإجابات معدّة مسبقاً، لذا التجربة مجانية.',
    realModel: (provider) => `إجابات الذكاء الاصطناعي من ${provider}.`,
    published: (title, score) => `نُشر «${title}» بنتيجة ${score} في فحوص Inkpilot.`,
    otherTheme: { dark: 'الوضع الفاتح', light: 'الوضع الداكن' },
    otherLang: 'English',
  },
};

/** Editor strings for Arabic. The package ships English; apps pass their own languages. */
export const EDITOR_TRANSLATIONS: Partial<Record<DemoLang, Partial<TranslationStrings>>> = {
  ar: {
    'toolbar.bold': 'غامق',
    'toolbar.italic': 'مائل',
    'toolbar.underline': 'تسطير',
    'toolbar.strikethrough': 'يتوسطه خط',
    'toolbar.heading1': 'عنوان 1',
    'toolbar.heading2': 'عنوان 2',
    'toolbar.heading3': 'عنوان 3',
    'toolbar.bulletList': 'قائمة نقطية',
    'toolbar.orderedList': 'قائمة مرقمة',
    'toolbar.blockquote': 'اقتباس',
    'toolbar.codeBlock': 'كتلة كود',
    'toolbar.link': 'رابط',
    'toolbar.image': 'صورة',
    'toolbar.alignLeft': 'محاذاة لليسار',
    'toolbar.alignCenter': 'توسيط',
    'toolbar.alignRight': 'محاذاة لليمين',
    'toolbar.undo': 'تراجع',
    'toolbar.redo': 'إعادة',
    'ai.rewrite': 'إعادة الكتابة بالذكاء الاصطناعي',
    'ai.rephrase': 'إعادة صياغة',
    'ai.tone': 'النبرة',
    'ai.intent': 'الهدف',
    'ai.tone.formal': 'رسمية',
    'ai.tone.casual': 'ودّية',
    'ai.tone.persuasive': 'مقنعة',
    'ai.intent.simplify': 'تبسيط',
    'ai.intent.expand': 'توسيع',
    'ai.intent.clarify': 'توضيح',
    'rewrite.streaming': 'جارٍ كتابة اقتراح…',
    'rewrite.ready': 'الاقتراح جاهز',
    'rewrite.accept': 'قبول',
    'rewrite.reject': 'رفض',
    'rewrite.stop': 'إيقاف',
    'rewrite.retry': 'إعادة المحاولة',
    'rewrite.discard': 'تجاهل',
    'seo.issue.long-sentence': 'جملة طويلة',
    'seo.issue.long-sentence.detail': 'أطول جملة فيها {words} كلمة. يفقد القارئ تركيزه بعد نحو {limit} كلمة.',
    'seo.issue.dense-paragraph': 'فقرة مكتظة',
    'seo.issue.dense-paragraph.detail': 'في هذه الفقرة {sentences} جمل. تقسيمها بعد نحو {limit} جمل يسهّل قراءتها.',
    'seo.issue.description-missing': 'لا يوجد وصف',
    'seo.issue.description-missing.detail': 'أضف ملخصاً من {min} إلى {max} حرفاً لنتائج البحث.',
    'seo.issue.description-length': 'طول الوصف',
    'seo.issue.description-length.detail': 'في الوصف {length} حرفاً. عادةً يظهر كاملاً بين {min} و{max} حرفاً.',
    'seo.issue.title-length': 'طول العنوان',
    'seo.issue.title-length.detail': 'في العنوان {length} حرفاً. نتائج البحث تعرض غالباً بين {min} و{max} حرفاً قبل اختصاره.',
    'seo.issue.fix': 'أصلِح بالذكاء الاصطناعي',
    'seo.issue.ignore': 'تجاهل',
    'seo.score.label': 'فحوص Inkpilot: {score} من 100',
    'publish.title': 'مراجعة ونشر',
    'publish.close': 'إغلاق',
    'publish.scoreOf': 'من 100 في فحوص Inkpilot',
    'publish.checks': 'فحوص للمراجعة: {count}',
    'publish.noChecks': 'لا شيء للمراجعة.',
    'publish.fix': 'إصلاح',
    'publish.show': 'عرض',
    'publish.suggest': 'اقترح',
    'publish.searchAppearance': 'مظهر البحث',
    'publish.seoTitle': 'عنوان SEO',
    'publish.seoTitlePlaceholder': 'يُستخدم عنوان H1 إذا كان فارغاً',
    'publish.description': 'الوصف',
    'publish.slug': 'الرابط',
    'publish.suggestTitles': 'اقترح عناوين',
    'publish.suggestDescriptions': 'اقترح أوصافاً',
    'publish.suggesting': 'جارٍ الاقتراح…',
    'publish.suggestFailed': 'تعذّر الحصول على اقتراحات: {message}',
    'publish.useSuggestion': 'استخدم هذا',
    'publish.serpNote': 'تقريبي. محركات البحث تقرر كم يظهر من العنوان والوصف.',
    'publish.publish': 'نشر',
    'publish.uploading': 'جارٍ رفع {count} صورة…',
    'publish.cancelUploads': 'إلغاء الرفع وحذف الصور',
    'publish.localImage': '{count} صورة ما زالت معاينات محلية. أدرجها مجدداً قبل النشر.',
    'general.placeholder': 'ابدأ الكتابة...',
  },
};
