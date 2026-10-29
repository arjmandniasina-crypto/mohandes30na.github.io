/* Portfolio configuration (loaded before main.js). */
window.PORTFOLIO_CONFIG = (() => {
  'use strict';
/* Content and scene anchors: edit this file to personalize your portfolio. */
const NAMES={laptop:'laptop_screen',book:'story_book',notes:'activities_desk',tv:'tv_screen'};
const TV_WALL_X=1.42;
const CAM={desk:{p:[-2.5,1.2,-1.6],t:[-2.5,1.02,-3.4]},
 0:{h:{p:[-2.4,1.9,2.2],t:[-4.2,.9,.8]},o:{p:[-3.6,1.5,1.4],t:[-4.2,.65,.8]}},
 1:{h:{p:[-.3,2,3.4],t:[-1.2,.65,1.9]},o:{p:[-1.2,1.5,2.9],t:[-1.2,.62,1.9]}},
 2:{h:{p:[TV_WALL_X,1.62,.48],t:[TV_WALL_X,1.54,-3.75]},o:{p:[TV_WALL_X,1.55,.12],t:[TV_WALL_X,1.52,-3.75]}}};
let PJ=[
 {t:'Project 1 — replace title',tags:['Skill 1','Skill 2'],url:'#',image:'images/projects/project-1.jpg',c:['#ff7a59','#7a3cff']},
 {t:'Project 2 — replace title',tags:['Skill 1','Skill 2'],url:'#',image:'images/projects/project-2.jpg',c:['#18c6b2','#1c3f9e']},
 {t:'Project 3 — replace title',tags:['Skill 1','Skill 2'],url:'#',image:'images/projects/project-3.jpg',c:['#f5c542','#c2185b']}
];
let CONTACT=[{n:'Email',u:'mailto:you@example.com'},{n:'GitHub',u:'https://github.com/'},{n:'LinkedIn',u:'https://www.linkedin.com/'}];
const T={
en:{menu:['MY STORY','MY ACTIVITIES','PROJECTS & RESUME','EXPLORE THE ROOM'],desc:['The red book on the side table: how I got here.','A notebook of work and milestones.','Turn on the TV: projects, resume and contact.','Look around the whole room.'],
 title:'Build Your Own Website',ldesc:'Design and development, crafted with care.',back:'Back',dl:'Download Resume (PDF)',ach:'Achievement Unlocked: ',full:'Full Resume Unlocked!',hint:'Drag to look · scroll or WASD to walk · Esc to leave',
 contact:'Contact',pj:['A short description of Alpha.','A short description of Beta.','A short description of Gamma.'],visit:'Visit',
 set:['Settings','Music','Volume','Quality','Reduce motion','Dark theme'],
 ch:[['Chapter A: Beginnings','Replace with your real story. Where you started, what sparked your curiosity.'],['Chapter B: Growth','The projects, mistakes and mentors that shaped your craft.'],['Chapter C: Today','What you do now and what you are looking for next.']],
 ac:[['2020','First milestone','Describe a job, course or project.'],['2022','Second milestone','Describe what you achieved.'],['2024','Third milestone','Describe where you are now.']]},
fa:{menu:['داستان من','فعالیت‌های من','پروژه‌ها و رزومه','گشت در اتاق'],desc:['کتاب قرمز روی میز کناری؛ مسیر من.','دفترچه‌ای از کارها و تجربه‌ها.','تلویزیون را روشن کن: پروژه‌ها، رزومه و تماس.','کل اتاق را بگردید.'],
 title:'وب‌سایت خودت را بساز',ldesc:'طراحی و توسعه، با دقت و وسواس.',back:'بازگشت',dl:'دانلود رزومه (PDF)',ach:'دستاورد باز شد: ',full:'رزومه کامل باز شد!',hint:'برای نگاه کردن بکشید · چرخ ماوس یا WASD برای حرکت · Esc برای خروج',
 contact:'تماس',pj:['توضیح کوتاه پروژه آلفا.','توضیح کوتاه پروژه بتا.','توضیح کوتاه پروژه گاما.'],visit:'مشاهده',
 set:['تنظیمات','موسیقی','صدا','کیفیت رندر','کاهش حرکت','تم تاریک'],
 ch:[['فصل ۱: آغاز','داستان واقعی خودت را اینجا بنویس؛ از کجا شروع کردی.'],['فصل ۲: رشد','پروژه‌ها، اشتباه‌ها و استادانی که تو را ساختند.'],['فصل ۳: امروز','الان چه می‌کنی و به دنبال چه هستی.']],
 ac:[['۱۴۰۰','نقطه عطف اول','شغل، دوره یا پروژه را توضیح بده.'],['۱۴۰۲','نقطه عطف دوم','دستاوردت را توضیح بده.'],['۱۴۰۴','نقطه عطف سوم','جایگاه فعلی‌ات را توضیح بده.']]}};
  // User-editable content lives in js/content.js; scene anchors stay in this file.
  const CONTENT = window.PORTFOLIO_CONTENT || {};
  const SITE = {
    name: String(CONTENT.site && CONTENT.site.name || 'Your Name'),
    headline: { en: String(CONTENT.site && CONTENT.site.headline && CONTENT.site.headline.en || T.en.title), fa: String(CONTENT.site && CONTENT.site.headline && CONTENT.site.headline.fa || T.fa.title) },
    tagline: { en: String(CONTENT.site && CONTENT.site.tagline && CONTENT.site.tagline.en || T.en.ldesc), fa: String(CONTENT.site && CONTENT.site.tagline && CONTENT.site.tagline.fa || T.fa.ldesc) }
  };
  for (const locale of ['en','fa']) {
    T[locale].title = SITE.headline[locale];
    T[locale].ldesc = SITE.tagline[locale];
    const story = CONTENT.story && CONTENT.story[locale];
    if (Array.isArray(story) && story.length) T[locale].ch = story.map(item => [String(item.title || ''), String(item.body || '')]);
    const activities = CONTENT.activities && CONTENT.activities[locale];
    if (Array.isArray(activities)) T[locale].ac = activities.map(item => [String(item.date || ''), String(item.title || ''), String(item.description || '')]);
  }
  if (Array.isArray(CONTENT.projects) && CONTENT.projects.length) {
    PJ = CONTENT.projects.map((p,i) => ({
      t: String((p.title && p.title.en) || p.t || ('Project '+(i+1))),
      title: { en: String((p.title && p.title.en) || p.t || ('Project '+(i+1))), fa: String((p.title && p.title.fa) || (p.title && p.title.en) || p.t || ('پروژه '+(i+1))) },
      tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
      url: String(p.url || '#'), image: String(p.image || ''),
      c: Array.isArray(p.colors) && p.colors.length >= 2 ? p.colors.slice(0,2) : (Array.isArray(p.c) ? p.c : ['#334155','#64748b'])
    }));
    T.en.pj = CONTENT.projects.map((p,i) => String((p.description && p.description.en) || ''));
    T.fa.pj = CONTENT.projects.map((p,i) => String((p.description && p.description.fa) || ''));
  }
  if (Array.isArray(CONTENT.contact)) CONTACT = CONTENT.contact.map(c => ({ n: String(c.name || 'Contact'), u: String(c.url || '#') }));
  const RESUME_PATH = String(CONTENT.resumePath || 'files/resume.pdf');
  return { NAMES, TV_WALL_X, CAM, PJ, CONTACT, T, SITE, RESUME_PATH };
})();
