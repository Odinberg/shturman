'use client';

import Link from 'next/link';

export default function PhilosophyPage() {
  const methods = [
    {
      id: 'resonance',
      icon: '📝',
      title: 'Активный дневник',
      subtitle: 'Resonance',
      desc: 'Рефлексивные практики, когнитивно-поведенческая терапия, нарративная терапия',
      authors: 'Аарон Бек, Альберт Эллис, Майкл Уайт',
    },
    {
      id: 'emotional',
      icon: '📊',
      title: 'Эмоциональный профиль',
      subtitle: 'Emotional Profile',
      desc: 'Мониторинг настроения, биоритмы, экзистенциальный подход, исследования нейропластичности',
      authors: 'Виктор Франкл, Ирвин Ялом',
    },
    {
      id: 'reframing',
      icon: '🧘',
      title: 'Рефрейминг ситуаций',
      subtitle: 'Reframing',
      desc: 'Когнитивная гибкость, теория когнитивного диссонанса, позитивная психология',
      authors: 'Леон Фестингер, Мартин Селигман',
    },
    {
      id: 'shadow',
      icon: '🖤',
      title: 'Диалог с Тенью',
      subtitle: 'Shadow Dialog',
      desc: 'Юнгианский анализ, работа с проекциями, глубинная психология',
      authors: 'Карл Густав Юнг',
    },
    {
      id: 'sensory',
      icon: '🎭',
      title: 'Сенсорные якоря',
      subtitle: 'Sensory Anchors',
      desc: 'Телесно-ориентированная терапия, соматическая психология, mindfulness',
      authors: 'Вильгельм Райх, Александр Лоуэн, Питер Левин, Джон Кабат-Зинн',
    },
    {
      id: 'multiplicity',
      icon: '🧩',
      title: 'Множественность Я',
      subtitle: 'Multiplicity of Self',
      desc: 'Психосинтез, Internal Family Systems, гештальт-терапия',
      authors: 'Роберто Ассаджиоли, Ричард Шварц, Фриц Перлз',
    },
    {
      id: 'butterfly',
      icon: '🌱',
      title: 'Эффект Бабочки',
      subtitle: 'Butterfly Effect',
      desc: 'Теория малых дел, нейропластичность, позитивная психология',
      authors: '',
    },
  ];

  const usageSteps = [
    'Регистрация через VK Mini App в клубе Архипелаг',
    'Выбор направления для старта',
    'Ежедневные практики (5–10 минут в день)',
    'Бонусы за регулярность и глубину',
    'Сообщество клуба для поддержки',
  ];

  const benefits = [
    'Осознанность и понимание своих паттернов',
    'Эмоциональная саморегуляция',
    'Снижение тревожности через структурированные практики',
    'Интеграция разных частей личности',
    'Контакт с телом и его сигналами',
    'Навык переформулирования негативных ситуаций',
    'Ощущение связности событий жизни',
  ];

  return (
    <>
      <style>{`
        /* Глобальные CSS-переменные */
        :root {
          /* Основные цвета */
          --color-gold: #d4af37;
          --color-gold-light: #f0d080;
          --color-text: #1a1a1a;
          --color-text-secondary: #666666;
          --color-background: #f8f6f0;
          --color-card: #ffffff;
          --color-border: #e8e4dc;
          
          /* Отступы */
          --spacing-sm: 0.75rem;
          --spacing-md: 2rem;
          --spacing-lg: 4rem;
          --spacing-xl: 6rem;
          
          /* Скругления */
          --border-radius: 12px;
          
          /* Анимации */
          --transition: all 0.3s ease;
          
          /* Шрифты */
          --font-cormorant: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
        }

        /* Темная тема (опционально) */
        @media (prefers-color-scheme: dark) {
          :root {
            --color-text: #f0ece6;
            --color-text-secondary: #a0a0a0;
            --color-background: #0a0a0a;
            --color-card: #1a1a1a;
            --color-border: #333333;
          }
        }

        .phil-nav {
          padding: var(--spacing-sm) 0;
          margin-bottom: var(--spacing-md);
        }

        .phil-nav-link {
          color: var(--color-gold);
          text-decoration: none;
          font-size: 0.95rem;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .phil-nav-link:hover {
          color: var(--color-gold-light);
          transform: translateX(-4px);
        }

        .phil-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: var(--spacing-md) var(--spacing-md) var(--spacing-xl);
          background: var(--color-background);
          min-height: 100vh;
          color: var(--color-text);
        }

        .phil-hero {
          text-align: center;
          margin-bottom: var(--spacing-lg);
          padding: var(--spacing-md) 0;
        }

        .phil-title {
          font-family: var(--font-cormorant), serif;
          font-size: 3.5rem;
          color: var(--color-gold);
          font-weight: 500;
          margin-bottom: 1rem;
          letter-spacing: 0.02em;
        }

        .phil-subtitle {
          font-size: 1.15rem;
          color: var(--color-text-secondary);
          font-weight: 300;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.8;
        }

        .phil-section {
          margin-bottom: var(--spacing-lg);
        }

        .phil-section-title {
          font-family: var(--font-cormorant), serif;
          font-size: 2.2rem;
          color: var(--color-gold);
          font-weight: 500;
          margin-bottom: var(--spacing-md);
          position: relative;
          display: inline-block;
        }

        .phil-section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 2px;
          background: var(--color-gold);
          opacity: 0.5;
        }

        .phil-text {
          font-size: 1.1rem;
          line-height: 1.9;
          color: var(--color-text);
          margin-bottom: 1.2rem;
          font-weight: 300;
        }

        .phil-text strong {
          font-weight: 500;
          color: var(--color-gold);
        }

        .phil-methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.25rem;
          margin-top: var(--spacing-sm);
        }

        .phil-method-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.75rem;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          cursor: default;
        }

        .phil-method-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15);
        }

        .phil-method-icon {
          font-size: 1.75rem;
          line-height: 1;
        }

        .phil-method-name {
          font-family: var(--font-cormorant), serif;
          font-size: 1.3rem;
          color: var(--color-gold);
          font-weight: 500;
          margin: 0;
        }

        .phil-method-subtitle {
          font-size: 0.85rem;
          color: var(--color-gold-light);
          font-weight: 300;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-top: -0.3rem;
        }

        .phil-method-desc {
          font-size: 0.95rem;
          color: var(--color-text);
          line-height: 1.7;
          margin: 0.25rem 0;
        }

        .phil-method-authors {
          font-size: 0.82rem;
          color: var(--color-text-secondary);
          font-style: italic;
          margin-top: auto;
          padding-top: 0.5rem;
          border-top: 1px solid var(--color-border);
        }

        .phil-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .phil-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 1.05rem;
          color: var(--color-text);
          line-height: 1.7;
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1rem 1.25rem;
          transition: var(--transition);
        }

        .phil-list li:hover {
          border-color: var(--color-gold);
          transform: translateX(4px);
        }

        .phil-list-marker {
          color: var(--color-gold);
          flex-shrink: 0;
          font-size: 1.1rem;
          margin-top: 0.1rem;
          font-weight: 500;
        }

        /* Адаптивность */
        @media (max-width: 1024px) {
          .phil-methods-grid {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .phil-page {
            padding: var(--spacing-sm);
          }
          
          .phil-title {
            font-size: 2.4rem;
          }
          
          .phil-section-title {
            font-size: 1.6rem;
          }
          
          .phil-methods-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .phil-text {
            font-size: 1rem;
          }
          
          .phil-list li {
            font-size: 0.95rem;
            padding: 0.85rem 1rem;
          }
        }

        @media (max-width: 480px) {
          .phil-title {
            font-size: 2rem;
          }
          
          .phil-hero {
            margin-bottom: var(--spacing-md);
          }
          
          .phil-section {
            margin-bottom: var(--spacing-md);
          }
        }

        /* Анимация появления для карточек */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .phil-method-card {
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }

        .phil-method-card:nth-child(1) { animation-delay: 0.05s; }
        .phil-method-card:nth-child(2) { animation-delay: 0.10s; }
        .phil-method-card:nth-child(3) { animation-delay: 0.15s; }
        .phil-method-card:nth-child(4) { animation-delay: 0.20s; }
        .phil-method-card:nth-child(5) { animation-delay: 0.25s; }
        .phil-method-card:nth-child(6) { animation-delay: 0.30s; }
        .phil-method-card:nth-child(7) { animation-delay: 0.35s; }

        /* Стиль для пустых авторов */
        .phil-method-authors:empty {
          display: none;
        }
      `}</style>

      <div className="phil-page">
        <nav className="phil-nav">
          <Link href="/" className="phil-nav-link">
            ← На главную
          </Link>
        </nav>

        <header className="phil-hero">
          <h1 className="phil-title">Философия проекта</h1>
          <p className="phil-subtitle">
            Исследуйте внутреннюю территорию через семь направлений саморазвития
          </p>
        </header>

        {/* Идея */}
        <section className="phil-section">
          <h2 className="phil-section-title">Идея</h2>
          <p className="phil-text">
            <strong>Штурман</strong> — навигатор по внутренней территории
            человека. Семь направлений — это семь стрелок компаса
            самоисследования. Каждое из них указывает на определённый слой
            вашей психики: от рефлексии к телесным якорям, от диалога с тенью
            к эффекту бабочки.
          </p>
          <p className="phil-text">
            Приложение встроено в закрытый клуб <strong>Архипелаг</strong>{' '}
            (VK Mini App) и создаёт безопасное пространство для честного
            разговора с собой. Здесь нет оценок, рейтингов и чужих ожиданий —
            только вы и ваша внутренняя карта.
          </p>
        </section>

        {/* 7 методик и их авторы */}
        <section className="phil-section">
          <h2 className="phil-section-title">7 методик и их авторы</h2>
          <p className="phil-text">
            Каждое направление опирается на научную базу и признанные
            психологические школы. Ниже — краткий обзор методик и их
            теоретических оснований.
          </p>
          <div className="phil-methods-grid">
            {methods.map((m) => (
              <div key={m.id} className="phil-method-card">
                <span className="phil-method-icon">{m.icon}</span>
                <h3 className="phil-method-name">{m.title}</h3>
                <span className="phil-method-subtitle">{m.subtitle}</span>
                <p className="phil-method-desc">{m.desc}</p>
                {m.authors && (
                  <span className="phil-method-authors">{m.authors}</span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Как пользоваться */}
        <section className="phil-section">
          <h2 className="phil-section-title">Как пользоваться</h2>
          <ol className="phil-list">
            {usageSteps.map((step, i) => (
              <li key={i}>
                <span className="phil-list-marker">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Что это даёт */}
        <section className="phil-section">
          <h2 className="phil-section-title">Что это даёт</h2>
          <ul className="phil-list">
            {benefits.map((benefit, i) => (
              <li key={i}>
                <span className="phil-list-marker">✦</span>
                {benefit}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
