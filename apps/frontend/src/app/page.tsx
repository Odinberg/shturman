'use client';

import { useEffect, useState } from 'react';
import { journalAPI, emotionalAPI, butterflyAPI, sensoryAPI, shadowAPI, reframingAPI, multiplicityAPI } from '../lib/api';
import { useVkAuth } from '../lib/vk-auth';

const directions = [
  {
    id: 'resonance',
    icon: '📝',
    title: 'Активный дневник',
    subtitle: 'Resonance — бонусы за глубину',
    condition: 'Курс «Искусство рефлексии»: 7 или 21 день',
    bonuses: [
      'Метафора дня — ИИ-мандала эмоционального следа',
      'Карта повторяющихся сценариев — подсветка паттернов',
      'Режим альтернативной реальности — перепись тревоги как хоббит или детектив',
    ],
  },
  {
    id: 'emotional',
    icon: '📊',
    title: 'Эмоциональный профиль',
    subtitle: 'Предиктивная поддержка — бонусы за регулярность',
    condition: 'Ежедневный эмоциональный чекин: 14 или 30 дней',
    bonuses: [
      'Личный биоритмолог — наложение настроения на сон и активность',
      'Коллекция ресурсных состояний — персональный плейлист',
      'Эмоциональный аватар — живое существо, меняющееся каждую неделю',
    ],
  },
  {
    id: 'reframing',
    icon: '🧘',
    title: 'Рефрейминг ситуаций',
    subtitle: 'Бонусы за обучение',
    condition: 'Мини-курс по когнитивной гибкости: 3 урока + 3 практики',
    bonuses: [
      'Шкатулка формулировок — PDF-сборник ваших сильных сторон',
      'ИИ-адвокат — 5 аргументов против тревоги на основе дневника',
      'Слепое пятно — 2 вопроса, меняющих фокус с «почему» на «что теперь»',
    ],
  },
  {
    id: 'shadow',
    icon: '🖤',
    title: 'Диалог с Тенью',
    subtitle: 'Бонусы за смелость',
    condition: 'Еженедельное голосовое сообщение: «Что меня раздражает в других»',
    bonuses: [
      'Зеркальный дублёр — письмо от лица раздражающего человека',
      'Карта запретных желаний — 1 скрытое + аудио-гипноз',
      'Режим Анти-герой — комикс, где тень спасает жизнь',
    ],
  },
  {
    id: 'sensory',
    icon: '🎭',
    title: 'Сенсорные якоря',
    subtitle: 'Бонусы за контекст',
    condition: '3 касания в день: выбор телесного ощущения без текста',
    bonuses: [
      'Телесный компас — предсказание состояния за 2 часа до стресса',
      'Кинетический дневник — абстрактный танец настроения за неделю',
      'Якорь спокойствия — вибро-ритм вашего дыхания в спокойный момент',
    ],
  },
  {
    id: 'multiplicity',
    icon: '🧩',
    title: 'Множественность Я',
    subtitle: 'Бонусы за эксперименты',
    condition: '5 дней: по 1 записи от лица разных субличностей',
    bonuses: [
      'Круглый стол — текстовый чат между вашими субличностями',
      'Портрет семьи — генерация персонажей субличностей',
      'Режим Переговорщика — адвокат дьявола спорит с критиком',
    ],
  },
  {
    id: 'butterfly',
    icon: '🌱',
    title: 'Эффект Бабочки',
    subtitle: 'Бонусы за долгосрочность',
    condition: 'Мини-курс внимательности: 7 дней маленьких событий',
    bonuses: [
      'Фрактал дня — как облако связано с вашей большой целью',
      'Копилка чудес — слайд-шоу месяца как история совпадений',
      'Письмо от Вселенной — персонализированная притча',
    ],
  },
];

interface DashboardStats {
  journal: number;
  emotional: number;
  butterfly: number;
  sensory: number;
  shadow: number;
  reframing: number;
  self: number;
}

function Dashboard({ stats }: { stats: DashboardStats }) {
  const items = [
    { label: 'Записей в дневнике', count: stats.journal, href: '/journal', icon: '📝' },
    { label: 'Эмоц. чекинов', count: stats.emotional, href: '/emotional', icon: '📊' },
    { label: 'Рефреймингов', count: stats.reframing, href: '/reframing', icon: '🧘' },
    { label: 'Сенсорных чекинов', count: stats.sensory, href: '/sensory', icon: '🎭' },
    { label: 'Теневых записей', count: stats.shadow, href: '/shadow', icon: '🖤' },
    { label: 'Субличностей', count: stats.self, href: '/self', icon: '🧩' },
    { label: 'Событий бабочки', count: stats.butterfly, href: '/butterfly', icon: '🌱' },
  ];

  return (
    <section className="content-section" id="dashboard">
      <div className="container">
        <div className="section-header fade-in">
          <h2 className="section-title">Ваш прогресс</h2>
          <p className="section-subtitle">Сводка по всем направлениям самоисследования</p>
        </div>
        <div className="dashboard-grid fade-in stagger-delay-1">
          {items.map((item) => (
            <a key={item.label} href={item.href} className="dashboard-card">
              <span className="dash-icon">{item.icon}</span>
              <span className="dash-count">{item.count}</span>
              <span className="dash-label">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem;
          margin-top: var(--spacing-md);
        }
        .dashboard-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.25rem;
          text-align: center;
          text-decoration: none;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
        }
        .dashboard-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-3px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .dash-icon { font-size: 1.6rem; }
        .dash-count {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
        }
        .dash-label {
          font-size: 0.75rem;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
      `}</style>
    </section>
  );
}

export default function Home() {
  const vkAuth = useVkAuth();
  const [stats, setStats] = useState<DashboardStats>({ journal:0, emotional:0, butterfly:0, sensory:0, shadow:0, reframing:0, self:0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      journalAPI.list().then(r => r.length).catch(() => 0),
      emotionalAPI.listCheckins().then(r => r.length).catch(() => 0),
      butterflyAPI.listEvents().then(r => r.length).catch(() => 0),
      sensoryAPI.listCheckins().then(r => r.length).catch(() => 0),
      shadowAPI.listRecordings().then(r => r.length).catch(() => 0),
      reframingAPI.listSessions().then(r => r.length).catch(() => 0),
      multiplicityAPI.listPosts().then(r => r.length).catch(() => 0),
    ]).then(([j, e, b, se, sh, r, m]) => {
      setStats({ journal: j, emotional: e, butterfly: b, sensory: se, shadow: sh, reframing: r, self: m });
      setStatsLoaded(true);
    });
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el);
    });

    const handleScroll = () => {
      const header = document.getElementById('main-header');
      if (!header) return;
      header.style.padding = window.scrollY > 100 ? '1rem 0' : '1.5rem 0';
      header.style.background =
        window.scrollY > 100
          ? 'rgba(10, 10, 10, 0.98)'
          : 'rgba(10, 10, 10, 0.95)';
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <style>{`
        .hero {
          min-height: 90vh;
          display: flex;
          align-items: center;
          position: relative;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 30%, rgba(201, 169, 110, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(58, 80, 107, 0.04) 0%, transparent 50%),
            linear-gradient(145deg, #0A0A0A 0%, #0C1A1F 100%);
          z-index: -1;
        }

        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
          padding: var(--spacing-xl) 0;
        }

        .hero-title {
          font-size: 4.5rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: var(--color-text);
          letter-spacing: -0.03em;
          line-height: 1.1;
        }

        .hero-title span {
          color: var(--color-gold);
        }

        .hero-subtitle {
          font-size: 1.5rem;
          color: var(--color-gold);
          margin-bottom: 1.5rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-description {
          font-size: 1.2rem;
          color: var(--color-text-secondary);
          max-width: 650px;
          margin: 0 auto 2rem;
          line-height: 1.9;
        }

        .hero-divider {
          width: 120px;
          height: 1px;
          background: var(--color-gold);
          margin: 2rem auto;
          opacity: 0.3;
        }

        .hero-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--color-gold);
          color: var(--color-dark);
          padding: 1rem 2.5rem;
          border-radius: var(--border-radius);
          text-decoration: none;
          font-weight: 500;
          font-size: 1rem;
          transition: var(--transition);
          letter-spacing: 0.02em;
        }

        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(201, 169, 110, 0.3);
        }

        .content-section {
          padding: var(--spacing-xl) 0;
          position: relative;
        }

        .content-block {
          max-width: 800px;
          margin: 0 auto var(--spacing-lg);
        }

        .content-text {
          font-size: 1.15rem;
          line-height: 1.9;
          color: var(--color-text);
          margin-bottom: 1.8rem;
          font-weight: 300;
        }

        .content-text strong {
          font-weight: 500;
          color: var(--color-gold-light);
        }

        /* --- Методики --- */
        .directions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
          gap: 1.5rem;
          margin-top: var(--spacing-md);
        }

        .direction-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 2rem;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
        }

        .direction-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .direction-icon {
          font-size: 2rem;
          margin-bottom: 0.75rem;
        }

        .direction-title {
          font-size: 1.35rem;
          color: var(--color-gold);
          font-family: var(--font-cormorant), serif;
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .direction-subtitle {
          font-size: 0.9rem;
          color: var(--color-gold-light);
          margin-bottom: 0.75rem;
          font-weight: 300;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .direction-condition {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          background: rgba(201, 169, 110, 0.08);
          padding: 0.4rem 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          line-height: 1.4;
          border-left: 2px solid var(--color-gold);
        }

        .direction-bonuses {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }

        .direction-bonuses li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--color-text-secondary);
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }

        .direction-bonuses li::before {
          content: '✦';
          color: var(--color-gold);
          flex-shrink: 0;
          font-size: 0.65rem;
          margin-top: 0.2rem;
        }

        .archimedean {
          background: linear-gradient(145deg, rgba(201, 169, 110, 0.12), rgba(201, 169, 110, 0.04));
          border-color: var(--color-gold);
          grid-column: 1 / -1;
          max-width: 800px;
          margin: var(--spacing-md) auto 0;
        }

        .archimedean .direction-title {
          font-size: 1.6rem;
        }

        .archimedean .archimedean-desc {
          font-size: 1rem;
          color: var(--color-text);
          line-height: 1.8;
          margin-top: 1rem;
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .section-title { font-size: 2.2rem; }
          .directions-grid {
            grid-template-columns: 1fr;
          }
          .archimedean {
            grid-column: 1;
          }
        }
      `}</style>

      {/* Hero */}
      <section className="hero">
        <div className="hero-background" />
        <div className="container">
          <div className="hero-content fade-in">
            <p className="hero-subtitle">Интегративная программа</p>
            <h1 className="hero-title">
              Навигация по <span>себе</span>
            </h1>
            <div className="hero-divider" />
            <p className="hero-description">
              Семь направлений самоисследования. От рефлексии — к телесным якорям,
              от диалога с тенью — к эффекту бабочки. Выберите, с чего начать.
            </p>
            {vkAuth.ready && (
              <p style={{
                color: vkAuth.username ? 'var(--color-success)' : 'var(--color-text-secondary)',
                fontSize: '0.9rem',
                marginTop: '1rem',
                fontWeight: 400,
              }}>
                {vkAuth.username
                  ? `⚡ ${vkAuth.username}`
                  : vkAuth.error
                    ? `⚠️ ${vkAuth.error}`
                    : ''}
              </p>
            )}
            <div className="hero-buttons">
              <a href="#directions" className="hero-cta">
                Методики
                <span>↓</span>
              </a>
              <a
                href="https://oauth.vk.com/authorize?client_id=54657016&redirect_uri=https://vnutrenniy-kompas.ru/auth/callback&response_type=code&v=5.199"
                className="hero-cta-vk"
              >
                Войти через VK ID
              </a>
            </div>
            <style>{`
              .hero-buttons {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                flex-wrap: wrap;
              }
              .hero-cta-vk {
                display: inline-flex;
                align-items: center;
                gap: 0.75rem;
                background: transparent;
                color: var(--color-gold);
                border: 1px solid var(--color-gold);
                padding: 1rem 2.5rem;
                border-radius: var(--border-radius);
                text-decoration: none;
                font-weight: 400;
                font-size: 1rem;
                transition: var(--transition);
                letter-spacing: 0.02em;
              }
              .hero-cta-vk:hover {
                background: var(--color-gold);
                color: var(--color-dark);
                transform: translateY(-2px);
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* Дашборд */}
      {statsLoaded && <Dashboard stats={stats} />}

      {/* О проекте */}
      <section className="content-section" id="about">
        <div className="container">
          <div className="section-header fade-in">
            <h2 className="section-title">О проекте</h2>
          </div>
          <div className="content-block fade-in stagger-delay-1">
            <p className="content-text">
              <strong>Штурман</strong> — это не просто приложение. Это система
              инструментов для навигации по собственной психике. Каждое направление
              собиралось из практик когнитивно-поведенческой терапии,
              экзистенциального подхода, телесно-ориентированной психологии и
              современных исследований нейропластичности.
            </p>
            <p className="content-text">
              Мы не обещаем «быстрого счастья». Мы даём работающие инструменты —
              и пространство, где можно безопасно разобраться в себе.
            </p>
          </div>

          <div className="directions-grid" style={{ marginTop: 0 }}>
            {[
              { icon: '🧭', title: 'Структура', desc: 'Пошаговая система с понятными этапами и измеримым прогрессом' },
              { icon: '🛠', title: 'Инструменты', desc: 'Практические техники, а не абстрактные рассуждения' },
              { icon: '🤝', title: 'Поддержка', desc: 'AI-ассистент и сообщество для сопровождения на каждом этапе' },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`card fade-in stagger-delay-${i + 2}`}
                style={{ textAlign: 'center', padding: '2.5rem 2rem' }}
              >
                <span style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>
                  {item.icon}
                </span>
                <h3 style={{ fontSize: '1.3rem', color: 'var(--color-gold)', marginBottom: '0.75rem', fontFamily: 'var(--font-cormorant), serif' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Методики */}
      <section className="content-section" id="directions">
        <div className="container">
          <div className="section-header fade-in">
            <h2 className="section-title">Методики</h2>
            <p className="section-subtitle">
              Семь направлений. Каждое открывает бонусы за глубину,
              регулярность, смелость или эксперимент.
            </p>
          </div>

          <div className="directions-grid">
            {directions.map((d, i) => {
              const slugMap: Record<string, string> = {
                resonance: '/journal', emotional: '/emotional', reframing: '/reframing',
                shadow: '/shadow', sensory: '/sensory', multiplicity: '/self', butterfly: '/butterfly',
              };
              return (
                <a
                  key={d.id}
                  href={slugMap[d.id] || '#'}
                  className={`direction-card fade-in stagger-delay-${(i % 4) + 1}`}
                >
                  <span className="direction-icon">{d.icon}</span>
                  <h3 className="direction-title">{d.title}</h3>
                  <p className="direction-subtitle">{d.subtitle}</p>
                  <div className="direction-condition">{d.condition}</div>
                  <ul className="direction-bonuses">
                    {d.bonuses.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </a>
              );
            })}

            {/* Архимедов рычаг */}
            <div className="direction-card archimedean fade-in stagger-delay-4">
              <span className="direction-icon">💡</span>
              <h3 className="direction-title">Архимедов рычаг</h3>
              <p className="direction-subtitle">Режим Хроник — связующий бонус</p>
              <div className="direction-condition">
                Открывается после прохождения всех 7 направлений
              </div>
              <p className="archimedean-desc">
                Интерактивная лента времени: вращающийся 3D-куб, где собраны все
                бонусы — мандалы, аватары, письма от тени, танцы тела. Выберите
                любой день за месяц и увидите все слои себя: эмоцию, тело,
                сценарий и субличность. Это не коллекция картинок, а археология
                себя.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
