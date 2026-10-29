(function () {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
  const clone = (value) => JSON.parse(JSON.stringify(value));

  const UI = {
    fa: {
      documentTitle: 'ویرایشگر محتوای پرتفولیو', eyebrow: 'PORTFOLIO / CONTENT STUDIO',
      appTitle: 'ویرایشگر محتوای پرتفولیو', heroCopy: 'داستان، فعالیت‌ها، پروژه‌ها و راه‌های تماس را از همین پنل ویرایش کن. لازم نیست کدهای سه‌بعدی یا استایل سایت را تغییر بدهی.',
      languageSwitchLabel: 'زبان رابط کاربری', bilingualChip: 'محتوای فارسی و انگلیسی', localChip: 'ذخیره‌ی پیش‌نویس در همین مرورگر',
      importButton: 'بارگذاری content.js فعلی', backupButton: 'گرفتن نسخه‌ی پشتیبان JSON', resetButton: 'بازگردانی نمونه‌ها',
      readyStatus: 'آماده‌ی ویرایش؛ تغییراتت پس از هر ویرایش به‌صورت پیش‌نویس ذخیره می‌شوند.',
      noteCopy: 'پس از دانلود، فقط فایل js/content.js را جایگزین کن؛ نه content-editor.js و نه config.js. مسیر عکس هر پروژه هم روی کارت رزومه و هم روی صفحه‌ی تلویزیون استفاده می‌شود.',
      sectionProfile: 'معرفی شخصی و عنوان لپ‌تاپ', sectionProfileSub: 'هویت و پیام کوتاهی که در صحنه‌ی آغاز نمایش داده می‌شود.',
      siteNameLabel: 'نام نمایشی سایت', siteNamePlaceholder: 'مثلاً Sina Arjmandnia',
      headlineEnLabel: 'عنوان لپ‌تاپ — English', headlineFaLabel: 'عنوان لپ‌تاپ — فارسی',
      taglineEnLabel: 'زیرعنوان لپ‌تاپ — English', taglineFaLabel: 'زیرعنوان لپ‌تاپ — فارسی',
      resumePathLabel: 'مسیر فایل رزومه PDF', resumePathHelp: 'نام فایل باید با فایل واقعی داخل پوشه‌ی files مطابقت داشته باشد.',
      sectionStory: 'My Story — داستان من', sectionStorySub: 'هر فصل را به فارسی و انگلیسی بنویس؛ ترتیب فصل‌ها در کتاب حفظ می‌شود.',
      sectionActivities: 'My Activities — فعالیت‌ها', sectionActivitiesSub: 'دوره‌ها، تحصیلات، تجربه‌های کاری و دستاوردها را مدیریت کن.',
      addActivity: 'افزودن فعالیت', activitiesHelp: 'برای هر تجربه نسخه‌ی فارسی و انگلیسی جداگانه وجود دارد؛ می‌توانی هر تعداد مورد اضافه یا حذف کنی.',
      sectionProjects: 'Projects & Resume — پروژه‌ها', sectionProjectsSub: 'عنوان، توضیح، مهارت‌ها، لینک و تصویر هر پروژه را ویرایش کن.',
      addProject: 'افزودن پروژه', projectsHelp: 'نمونه مسیر تصویر: images/projects/project-1.jpg. فایل را دقیقاً در همین مسیر بگذار؛ همان عکس روی کارت رزومه و صفحه‌ی تلویزیون نمایش داده می‌شود.',
      sectionContact: 'Contact — راه‌های ارتباطی', sectionContactSub: 'راه‌هایی که بازدیدکننده‌ها بتوانند با تو تماس بگیرند.', addContact: 'افزودن لینک تماس',
      readyTitle: 'آماده‌ی انتشار؟', readySub: 'محتوا را خروجی بگیر و در پروژه جایگزین کن.', downloadContentButton: 'دانلود content.js برای سایت', downloadJsonBottom: 'دانلود نسخه پشتیبان JSON',
      endNote: 'پیشنهاد: پیش از تغییرات بزرگ، یک نسخه‌ی پشتیبان JSON نگه دار.',
      chapter: 'فصل', activity: 'فعالیت', project: 'پروژه', contactItem: 'راه ارتباطی', remove: 'حذف',
      english: 'نسخه‌ی انگلیسی', persian: 'نسخه‌ی فارسی', chapterTitle: 'عنوان فصل', storyText: 'متن داستان', chapterTitleFa: 'عنوان فصل', storyTextFa: 'متن داستان',
      dateYear: 'تاریخ / سال', activityTitle: 'عنوان', description: 'توضیحات', dateYearFa: 'تاریخ / سال', activityTitleFa: 'عنوان', descriptionFa: 'توضیح',
      projectTitle: 'عنوان پروژه (نسخه‌ی انگلیسی)', projectDescription: 'توضیح پروژه (نسخه‌ی انگلیسی)', projectTitleFa: 'عنوان پروژه (نسخه‌ی فارسی)', projectDescriptionFa: 'توضیح پروژه (نسخه‌ی فارسی)',
      projectSettings: 'تنظیمات پروژه', tags: 'فناوری‌ها / Tags (با کاما جدا کن)', projectUrl: 'لینک پروژه', imagePath: 'مسیر تصویر', fallbackColors: 'رنگ‌های جایگزین (دو کد HEX با کاما)',
      imageHelp: 'فایل را با همین نام در مسیر نسبی مثل images/projects/project-{n}.jpg قرار بده. عکس روی کارت پروژه و تلویزیون نمایش داده می‌شود.',
      contactName: 'نام نمایشی (مثلاً Email)', contactUrl: 'آدرس یا URL',
      draftSaved: 'پیش‌نویس ذخیره شد — برای اعمال در سایت، فایل content.js را دانلود و جایگزین کن.',
      contentDownloaded: 'content.js دانلود شد. آن را داخل پوشه‌ی js پروژه جایگزین کن.',
      backupDownloaded: 'نسخه‌ی پشتیبان JSON دانلود شد.', samplesRestored: 'نمونه‌های پیش‌فرض بازگردانی شدند.',
      contentLoaded: 'محتوا بارگذاری شد؛ می‌توانی آن را ویرایش کنی.',
      resetConfirm: 'نمونه‌ها جایگزین محتوای فعلی شوند؟', minProjectAlert: 'حداقل یک پروژه نگه دار؛ برای حذف بقیه می‌توانی از همین دکمه استفاده کنی.',
      fileLoadError: 'بارگذاری فایل ناموفق بود: ', invalidContentFile: 'فایل، content.js معتبر نیست.', ready: 'آماده‌ی ویرایش؛ برای شروع یکی از بخش‌ها را تغییر بده.',
      directionTip: 'راهنما: متن‌های فارسی و انگلیسی هر دو ذخیره می‌شوند؛ زبان دکمه‌ها فقط زبان خود ویرایشگر را عوض می‌کند.'
    },
    en: {
      documentTitle: 'Portfolio Content Editor', eyebrow: 'PORTFOLIO / CONTENT STUDIO', appTitle: 'Portfolio Content Editor',
      heroCopy: 'Edit your story, activities, projects, and contact links here. You do not need to touch the 3D scene code or the website styles.',
      languageSwitchLabel: 'Interface language', bilingualChip: 'Persian + English content', localChip: 'Draft saved in this browser',
      importButton: 'Import existing content.js', backupButton: 'Download JSON backup', resetButton: 'Restore sample content',
      readyStatus: 'Ready to edit. Your changes are saved as a draft as you work.',
      noteCopy: 'After downloading, replace only js/content.js—not content-editor.js or config.js. Each project image path is used on both the Resume card and the TV screen.',
      sectionProfile: 'Personal introduction & laptop title', sectionProfileSub: 'Your identity and the short message shown in the opening scene.',
      siteNameLabel: 'Display name', siteNamePlaceholder: 'e.g. Sina Arjmandnia',
      headlineEnLabel: 'Laptop headline — English', headlineFaLabel: 'Laptop headline — Persian',
      taglineEnLabel: 'Laptop subtitle — English', taglineFaLabel: 'Laptop subtitle — Persian',
      resumePathLabel: 'Resume PDF path', resumePathHelp: 'Make sure the filename matches the actual file in the files folder.',
      sectionStory: 'My Story', sectionStorySub: 'Write every chapter in English and Persian. The chapter order in the book stays the same.',
      sectionActivities: 'My Activities', sectionActivitiesSub: 'Manage courses, education, work experience, and milestones.',
      addActivity: 'Add activity', activitiesHelp: 'Each entry has separate English and Persian versions. Add or remove as many entries as you need.',
      sectionProjects: 'Projects & Resume', sectionProjectsSub: 'Edit each project’s title, description, skills, link, and image.',
      addProject: 'Add project', projectsHelp: 'Image path example: images/projects/project-1.jpg. Put the file at that path; the same image appears on the Resume card and TV screen.',
      sectionContact: 'Contact', sectionContactSub: 'Ways visitors can reach you.', addContact: 'Add contact link',
      readyTitle: 'Ready to publish?', readySub: 'Export your content and replace the file in your project.', downloadContentButton: 'Download content.js for the site', downloadJsonBottom: 'Download JSON backup',
      endNote: 'Tip: keep a JSON backup before making major changes.',
      chapter: 'Chapter', activity: 'Activity', project: 'Project', contactItem: 'Contact link', remove: 'Remove',
      english: 'English version', persian: 'Persian version', chapterTitle: 'Chapter title', storyText: 'Story text', chapterTitleFa: 'Chapter title (Persian)', storyTextFa: 'Story text (Persian)',
      dateYear: 'Date / year', activityTitle: 'Title', description: 'Description', dateYearFa: 'Date / year (Persian calendar)', activityTitleFa: 'Title (Persian)', descriptionFa: 'Description (Persian)',
      projectTitle: 'Project title', projectDescription: 'Project description', projectTitleFa: 'Project title (Persian)', projectDescriptionFa: 'Project description (Persian)',
      projectSettings: 'Project settings', tags: 'Skills / tags (comma-separated)', projectUrl: 'Project URL', imagePath: 'Image path', fallbackColors: 'Fallback colors (two HEX codes, comma-separated)',
      imageHelp: 'Place the file at the relative path, e.g. images/projects/project-{n}.jpg. It appears on both the project card and the TV.',
      contactName: 'Display label (e.g. Email)', contactUrl: 'Address or URL',
      draftSaved: 'Draft saved — download content.js and replace the file in your project to apply changes.',
      contentDownloaded: 'content.js downloaded. Replace the file inside your project’s js folder.',
      backupDownloaded: 'JSON backup downloaded.', samplesRestored: 'Default sample content restored.',
      contentLoaded: 'Content loaded. You can now edit it.',
      resetConfirm: 'Replace the current content with sample content?', minProjectAlert: 'Keep at least one project. You can remove the others with this button.',
      fileLoadError: 'Could not load file: ', invalidContentFile: 'This is not a valid content.js file.', ready: 'Ready to edit. Choose a section to get started.',
      directionTip: 'Tip: both Persian and English content are saved. This switch only changes the editor interface language.'
    }
  };

  const DEFAULTS = {
    site: { name: 'Your Name', headline: { en: 'Creative Developer & Designer', fa: 'عنوان تخصصی خودت را بنویس' }, tagline: { en: 'I build thoughtful digital experiences.', fa: 'تجربه‌های دیجیتال را با دقت می‌سازم.' } },
    story: {
      en: [
        { title: 'Chapter A: Beginnings', body: 'Replace this with your real story. Where did you start, and what sparked your curiosity?' },
        { title: 'Chapter B: Growth', body: 'Write about projects, lessons, and experiences that helped you grow.' },
        { title: 'Chapter C: Today', body: 'Describe what you do now and what you want to build next.' }
      ],
      fa: [
        { title: 'فصل ۱: آغاز', body: 'داستان واقعی خودت را اینجا بنویس. از کجا شروع کردی و چه چیزی کنجکاوت کرد؟' },
        { title: 'فصل ۲: رشد', body: 'درباره‌ی پروژه‌ها، تجربه‌ها و درس‌هایی بنویس که باعث پیشرفتت شدند.' },
        { title: 'فصل ۳: امروز', body: 'توضیح بده اکنون چه می‌کنی و دوست داری در ادامه چه چیزی بسازی.' }
      ]
    },
    activities: {
      en: [
        { date: '2020', title: 'First milestone', description: 'Describe a course, job, or project.' },
        { date: '2022', title: 'Second milestone', description: 'Describe what you learned or achieved.' },
        { date: '2024', title: 'Third milestone', description: 'Describe where you are now.' }
      ],
      fa: [
        { date: '۱۴۰۰', title: 'نقطه‌ی عطف اول', description: 'یک دوره، تجربه‌ی کاری یا پروژه را توضیح بده.' },
        { date: '۱۴۰۲', title: 'نقطه‌ی عطف دوم', description: 'چیزی را که یاد گرفتی یا به دست آوردی توضیح بده.' },
        { date: '۱۴۰۴', title: 'نقطه‌ی عطف سوم', description: 'جایگاه فعلی خودت را توضیح بده.' }
      ]
    },
    projects: [
      { title: { en: 'Project 1 — replace title', fa: 'پروژه‌ی اول — عنوان را تغییر بده' }, description: { en: 'A short description of your first project.', fa: 'توضیح کوتاهی درباره‌ی پروژه‌ی اول.' }, tags: ['Skill 1', 'Skill 2'], url: '#', image: 'images/projects/project-1.jpg', colors: ['#3b82f6', '#22d3ee'] },
      { title: { en: 'Project 2 — replace title', fa: 'پروژه‌ی دوم — عنوان را تغییر بده' }, description: { en: 'A short description of your second project.', fa: 'توضیح کوتاهی درباره‌ی پروژه‌ی دوم.' }, tags: ['Skill 1', 'Skill 2'], url: '#', image: 'images/projects/project-2.jpg', colors: ['#2563eb', '#8b5cf6'] },
      { title: { en: 'Project 3 — replace title', fa: 'پروژه‌ی سوم — عنوان را تغییر بده' }, description: { en: 'A short description of your third project.', fa: 'توضیح کوتاهی درباره‌ی پروژه‌ی سوم.' }, tags: ['Skill 1', 'Skill 2'], url: '#', image: 'images/projects/project-3.jpg', colors: ['#0891b2', '#3b82f6'] }
    ],
    contact: [ { name: 'Email', url: 'mailto:you@example.com' }, { name: 'GitHub', url: 'https://github.com/' }, { name: 'LinkedIn', url: 'https://www.linkedin.com/' } ],
    resumePath: 'files/resume.pdf'
  };

  let data = clone(DEFAULTS);
  let uiLang = 'fa';
  let statusKey = 'readyStatus';
  let statusTone = '';

  function t(key) { return (UI[uiLang] && UI[uiLang][key]) || UI.fa[key] || key; }
  function setStatus(key, tone = '') {
    statusKey = key;
    statusTone = tone;
    const node = $('#status');
    node.textContent = t(key);
    node.dataset.tone = tone;
  }
  function normalize(input) {
    const defaults = clone(DEFAULTS);
    if (!input || typeof input !== 'object') return defaults;
    const site = input.site || {};
    const story = input.story || {};
    const activities = input.activities || {};
    return {
      site: {
        ...defaults.site, ...site,
        headline: { ...defaults.site.headline, ...(site.headline || {}) },
        tagline: { ...defaults.site.tagline, ...(site.tagline || {}) }
      },
      story: {
        en: Array.isArray(story.en) ? story.en.map(x => ({ title: String(x?.title || ''), body: String(x?.body || '') })) : defaults.story.en,
        fa: Array.isArray(story.fa) ? story.fa.map(x => ({ title: String(x?.title || ''), body: String(x?.body || '') })) : defaults.story.fa
      },
      activities: {
        en: Array.isArray(activities.en) ? activities.en.map(x => ({ date: String(x?.date || ''), title: String(x?.title || ''), description: String(x?.description || '') })) : defaults.activities.en,
        fa: Array.isArray(activities.fa) ? activities.fa.map(x => ({ date: String(x?.date || ''), title: String(x?.title || ''), description: String(x?.description || '') })) : defaults.activities.fa
      },
      projects: Array.isArray(input.projects) ? input.projects.map((p, i) => ({
        title: { en: String((typeof p?.title === 'string' ? p.title : p?.title?.en) || p?.t || `Project ${i + 1}`), fa: String((typeof p?.title === 'object' ? p?.title?.fa : '') || (typeof p?.title === 'string' ? p.title : p?.title?.en) || p?.t || `پروژه‌ی ${i + 1}`) },
        description: { en: String((typeof p?.description === 'string' ? p.description : p?.description?.en) || ''), fa: String((typeof p?.description === 'object' ? p?.description?.fa : '') || (typeof p?.description === 'string' ? p.description : p?.description?.en) || '') },
        tags: Array.isArray(p?.tags) ? p.tags.map(String) : [], url: String(p?.url || '#'),
        image: String(p?.image || `images/projects/project-${i + 1}.jpg`),
        colors: Array.isArray(p?.colors) && p.colors.length >= 2 ? p.colors.slice(0, 2).map(String) : ['#3b82f6', '#22d3ee']
      })) : defaults.projects,
      contact: Array.isArray(input.contact) ? input.contact.map(c => ({ name: String(c?.name || ''), url: String(c?.url || '') })) : defaults.contact,
      resumePath: String(input.resumePath || defaults.resumePath)
    };
  }

  function applyLanguage() {
    document.documentElement.lang = uiLang;
    document.documentElement.dir = uiLang === 'fa' ? 'rtl' : 'ltr';
    document.title = t('documentTitle');
    document.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (UI[uiLang][key] !== undefined) node.textContent = UI[uiLang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.dataset.i18nPlaceholder;
      if (UI[uiLang][key] !== undefined) node.placeholder = UI[uiLang][key];
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((node) => {
      const key = node.dataset.i18nAria;
      if (UI[uiLang][key] !== undefined) node.setAttribute('aria-label', UI[uiLang][key]);
    });
    document.querySelectorAll('[data-ui-lang]').forEach((button) => {
      const active = button.dataset.uiLang === uiLang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    setStatus(statusKey, statusTone);
  }

  function field(labelKey, value, attrs = '', full = '') {
    const langMatch = attrs.match(/data-lang="(en|fa)"/);
    const keyMatch = attrs.match(/data-key="([^"]+)"/);
    const key = keyMatch ? keyMatch[1] : '';
    const dir = langMatch ? (langMatch[1] === 'fa' ? 'rtl' : 'ltr') : (['url', 'image', 'colors', 'tags', 'resumePath'].includes(key) ? 'ltr' : 'auto');
    return `<div class="field ${full}"><label>${esc(t(labelKey))}</label><input type="text" value="${esc(value)}" ${attrs} dir="${dir}" spellcheck="false"></div>`;
  }
  function area(labelKey, value, attrs = '') {
    const langMatch = attrs.match(/data-lang="(en|fa)"/);
    const dir = langMatch ? (langMatch[1] === 'fa' ? 'rtl' : 'ltr') : 'auto';
    return `<div class="field full"><label>${esc(t(labelKey))}</label><textarea ${attrs} dir="${dir}" spellcheck="true">${esc(value)}</textarea></div>`;
  }
  function render() {
    document.querySelectorAll('[data-top]').forEach((node) => {
      const path = node.dataset.top;
      const value = path === 'resumePath' ? data.resumePath : path.split('.').reduce((obj, key) => obj?.[key], data);
      node.value = value ?? '';
      if (path.endsWith('.en')) node.dir = 'ltr';
      else if (path.endsWith('.fa')) node.dir = 'rtl';
    });

    const chapterCount = Math.max(data.story.en.length, data.story.fa.length);
    $('#chapters').innerHTML = Array.from({ length: chapterCount }, (_, i) => {
      const en = data.story.en[i] || { title: '', body: '' };
      const fa = data.story.fa[i] || { title: '', body: '' };
      return `<article class="item">
        <div class="item-top"><h3>${esc(t('chapter'))} ${i + 1}</h3><span class="item-badge">${String(i + 1).padStart(2, '0')}</span></div>
        <div class="langtitle">${esc(t('english'))}</div><div class="grid">
          ${field('chapterTitle', en.title, `data-item="story" data-index="${i}" data-lang="en" data-key="title"`)}
          ${area('storyText', en.body, `data-item="story" data-index="${i}" data-lang="en" data-key="body"`)}
        </div>
        <div class="langtitle">${esc(t('persian'))}</div><div class="grid">
          ${field('chapterTitleFa', fa.title, `data-item="story" data-index="${i}" data-lang="fa" data-key="title"`)}
          ${area('storyTextFa', fa.body, `data-item="story" data-index="${i}" data-lang="fa" data-key="body"`)}
        </div></article>`;
    }).join('');

    const activityCount = Math.max(data.activities.en.length, data.activities.fa.length);
    $('#activities').innerHTML = Array.from({ length: activityCount }, (_, i) => {
      const en = data.activities.en[i] || { date: '', title: '', description: '' };
      const fa = data.activities.fa[i] || { date: '', title: '', description: '' };
      return `<article class="item" data-row="activity" data-index="${i}">
        <div class="item-top"><h3>${esc(t('activity'))} ${i + 1}</h3><button type="button" class="remove" data-remove="activity" data-index="${i}">${esc(t('remove'))}</button></div>
        <div class="langtitle">${esc(t('english'))}</div><div class="grid">
          ${field('dateYear', en.date, `data-item="activity" data-index="${i}" data-lang="en" data-key="date"`)}
          ${field('activityTitle', en.title, `data-item="activity" data-index="${i}" data-lang="en" data-key="title"`)}
          ${area('description', en.description, `data-item="activity" data-index="${i}" data-lang="en" data-key="description"`)}
        </div>
        <div class="langtitle">${esc(t('persian'))}</div><div class="grid">
          ${field('dateYearFa', fa.date, `data-item="activity" data-index="${i}" data-lang="fa" data-key="date"`)}
          ${field('activityTitleFa', fa.title, `data-item="activity" data-index="${i}" data-lang="fa" data-key="title"`)}
          ${area('descriptionFa', fa.description, `data-item="activity" data-index="${i}" data-lang="fa" data-key="description"`)}
        </div></article>`;
    }).join('');

    $('#projects').innerHTML = data.projects.map((project, i) => `<article class="item" data-row="project" data-index="${i}">
      <div class="item-top"><h3>${esc(t('project'))} ${i + 1}</h3><button type="button" class="remove" data-remove="project" data-index="${i}">${esc(t('remove'))}</button></div>
      <div class="langtitle">${esc(t('english'))}</div><div class="grid">
        ${field('projectTitle', project.title?.en, `data-item="project" data-index="${i}" data-lang="en" data-key="title"`)}
        ${area('projectDescription', project.description?.en, `data-item="project" data-index="${i}" data-lang="en" data-key="description"`)}
      </div>
      <div class="langtitle">${esc(t('persian'))}</div><div class="grid">
        ${field('projectTitleFa', project.title?.fa, `data-item="project" data-index="${i}" data-lang="fa" data-key="title"`)}
        ${area('projectDescriptionFa', project.description?.fa, `data-item="project" data-index="${i}" data-lang="fa" data-key="description"`)}
      </div>
      <div class="langtitle">${esc(t('projectSettings'))}</div><div class="grid">
        ${field('tags', (project.tags || []).join(', '), `data-item="project" data-index="${i}" data-key="tags"`)}
        ${field('projectUrl', project.url, `data-item="project" data-index="${i}" data-key="url"`)}
        ${field('imagePath', project.image, `data-item="project" data-index="${i}" data-key="image"`)}
        ${field('fallbackColors', (project.colors || ['#3b82f6', '#22d3ee']).join(', '), `data-item="project" data-index="${i}" data-key="colors"`)}
        <div class="field full"><span class="field-help">${esc(t('imageHelp').replace('{n}', String(i + 1)))}</span></div>
      </div></article>`).join('');

    $('#contacts').innerHTML = data.contact.map((contact, i) => `<article class="item" data-row="contact" data-index="${i}">
      <div class="item-top"><h3>${esc(t('contactItem'))} ${i + 1}</h3><button type="button" class="remove" data-remove="contact" data-index="${i}">${esc(t('remove'))}</button></div>
      <div class="grid">${field('contactName', contact.name, `data-item="contact" data-index="${i}" data-key="name"`)}${field('contactUrl', contact.url, `data-item="contact" data-index="${i}" data-key="url"`)}</div>
    </article>`).join('');
  }

  function read() {
    const out = { site: { name: '', headline: { en: '', fa: '' }, tagline: { en: '', fa: '' } }, story: { en: [], fa: [] }, activities: { en: [], fa: [] }, projects: [], contact: [], resumePath: '' };
    document.querySelectorAll('[data-top]').forEach((node) => {
      const path = node.dataset.top.split('.');
      if (path.length === 1) out.resumePath = node.value;
      else {
        let obj = out;
        for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
        obj[path[path.length - 1]] = node.value;
      }
    });
    for (const group of ['story', 'activity']) {
      const entries = [...document.querySelectorAll(`[data-item="${group}"]`)];
      const max = entries.reduce((m, node) => Math.max(m, Number(node.dataset.index)), -1) + 1;
      const target = group === 'story' ? out.story : out.activities;
      for (let i = 0; i < max; i++) {
        for (const lang of ['en', 'fa']) {
          const item = {};
          entries.filter(node => Number(node.dataset.index) === i && node.dataset.lang === lang).forEach(node => { item[node.dataset.key] = node.value; });
          target[lang].push(group === 'story'
            ? { title: item.title || '', body: item.body || '' }
            : { date: item.date || '', title: item.title || '', description: item.description || '' });
        }
      }
    }
    const projectFields = [...document.querySelectorAll('[data-item="project"]')];
    const projectCount = projectFields.reduce((m, node) => Math.max(m, Number(node.dataset.index)), -1) + 1;
    for (let i = 0; i < projectCount; i++) {
      const project = { title: { en: '', fa: '' }, description: { en: '', fa: '' }, tags: [], url: '#', image: '', colors: ['#3b82f6', '#22d3ee'] };
      projectFields.filter(node => Number(node.dataset.index) === i).forEach(node => {
        const key = node.dataset.key;
        const value = node.value;
        if (node.dataset.lang) project[key][node.dataset.lang] = value;
        else if (key === 'tags') project.tags = value.split(',').map(x => x.trim()).filter(Boolean);
        else if (key === 'colors') {
          const colors = value.split(',').map(x => x.trim());
          if (colors.length >= 2) project.colors = colors.slice(0, 2);
        } else project[key] = value;
      });
      out.projects.push(project);
    }
    const contactFields = [...document.querySelectorAll('[data-item="contact"]')];
    const contactCount = contactFields.reduce((m, node) => Math.max(m, Number(node.dataset.index)), -1) + 1;
    for (let i = 0; i < contactCount; i++) {
      const contact = { name: '', url: '' };
      contactFields.filter(node => Number(node.dataset.index) === i).forEach(node => { contact[node.dataset.key] = node.value; });
      out.contact.push(contact);
    }
    return out;
  }

  function saveDraft(value) { try { localStorage.setItem('portfolio_content_draft', JSON.stringify(value)); } catch (error) { /* storage may be blocked */ } }
  function clearDraft() { try { localStorage.removeItem('portfolio_content_draft'); } catch (error) { /* storage may be blocked */ } }
  function getDraft() { try { return localStorage.getItem('portfolio_content_draft'); } catch (error) { return null; } }
  function sync() { data = normalize(read()); saveDraft(data); setStatus('draftSaved'); }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function exportJs() {
    sync();
    download('content.js', '/* Portfolio content file. This file is loaded by js/config.js. */\nwindow.PORTFOLIO_CONTENT = ' + JSON.stringify(data, null, 2) + ';\n', 'text/javascript;charset=utf-8');
    setStatus('contentDownloaded');
  }
  function exportJson() {
    sync();
    download('portfolio-content-backup.json', JSON.stringify(data, null, 2) + '\n', 'application/json;charset=utf-8');
    setStatus('backupDownloaded');
  }

  $('#editorForm').addEventListener('input', sync);
  document.querySelectorAll('[data-ui-lang]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.uiLang === uiLang) return;
    sync();
    uiLang = button.dataset.uiLang;
    try { localStorage.setItem('portfolio_editor_ui_lang', uiLang); } catch (error) { /* optional preference */ }
    applyLanguage();
    render();
    setStatus('draftSaved');
  }));
  $('#addActivity').addEventListener('click', () => {
    sync();
    for (const lang of ['en', 'fa']) data.activities[lang].push({ date: '', title: '', description: '' });
    render(); sync();
  });
  $('#addProject').addEventListener('click', () => {
    sync();
    const n = data.projects.length + 1;
    data.projects.push({ title: { en: `Project ${n}`, fa: `پروژه‌ی ${n}` }, description: { en: '', fa: '' }, tags: [], url: '#', image: `images/projects/project-${n}.jpg`, colors: ['#3b82f6', '#22d3ee'] });
    render(); sync();
  });
  $('#addContact').addEventListener('click', () => { sync(); data.contact.push({ name: 'Website', url: 'https://' }); render(); sync(); });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const kind = button.dataset.remove;
    const index = Number(button.dataset.index);
    if (kind === 'project' && document.querySelectorAll('[data-row="project"]').length <= 1) {
      window.alert(t('minProjectAlert'));
      return;
    }
    sync();
    if (kind === 'activity') for (const lang of ['en', 'fa']) data.activities[lang].splice(index, 1);
    else if (kind === 'project') data.projects.splice(index, 1);
    else if (kind === 'contact') data.contact.splice(index, 1);
    render(); sync();
  });

  $('#downloadJs').addEventListener('click', exportJs);
  $('#downloadJson').addEventListener('click', exportJson);
  $('#downloadJsonBottom').addEventListener('click', exportJson);
  $('#resetBtn').addEventListener('click', () => {
    if (!window.confirm(t('resetConfirm'))) return;
    data = clone(DEFAULTS); clearDraft(); render(); setStatus('samplesRestored', 'warning');
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let parsed;
      if (file.name.toLowerCase().endsWith('.json')) parsed = JSON.parse(text);
      else {
        const match = text.match(/window\.PORTFOLIO_CONTENT\s*=\s*([\s\S]*?)\s*;?\s*$/);
        if (!match) throw new Error(t('invalidContentFile'));
        parsed = JSON.parse(match[1].trim().replace(/;$/, ''));
      }
      data = normalize(parsed);
      render(); sync(); setStatus('contentLoaded');
    } catch (error) {
      window.alert(t('fileLoadError') + error.message);
    } finally { event.target.value = ''; }
  });

  try {
    const savedLang = localStorage.getItem('portfolio_editor_ui_lang');
    if (savedLang === 'en' || savedLang === 'fa') uiLang = savedLang;
  } catch (error) { /* optional preference */ }
  try {
    const draft = getDraft();
    if (draft) data = normalize(JSON.parse(draft));
  } catch (error) { /* ignore corrupted draft and use defaults */ }
  applyLanguage();
  render();
  setStatus('ready');
})();
