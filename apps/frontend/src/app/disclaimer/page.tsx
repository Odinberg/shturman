'use client';

import Link from 'next/link';

export default function DisclaimerPage() {
  return (
    <>
      <style>{`
        .disclaimer-page {
          min-height: 100vh;
          background: var(--color-dark);
          color: var(--color-text);
          padding: var(--spacing-md) 0 var(--spacing-xl);
        }

        .disclaimer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 var(--spacing-md);
          width: 100%;
        }

        .disclaimer-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-text-secondary);
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: var(--transition);
          margin-bottom: var(--spacing-md);
        }

        .disclaimer-back:hover {
          color: var(--color-gold);
        }

        .disclaimer-title {
          font-family: var(--font-cormorant), serif;
          font-size: 2.6rem;
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: var(--spacing-lg);
          letter-spacing: -0.02em;
          line-height: 1.2;
        }

        .disclaimer-section {
          margin-bottom: var(--spacing-lg);
        }

        .disclaimer-section-title {
          font-family: var(--font-cormorant), serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--color-gold);
          margin-bottom: var(--spacing-sm);
          letter-spacing: -0.01em;
        }

        .disclaimer-text {
          font-size: 1.05rem;
          line-height: 1.9;
          color: var(--color-text-secondary);
          font-weight: 300;
          margin-bottom: 1rem;
        }

        .disclaimer-text strong {
          font-weight: 500;
          color: var(--color-text);
        }

        .disclaimer-list {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .disclaimer-list li {
          font-size: 1.05rem;
          line-height: 1.8;
          color: var(--color-text-secondary);
          font-weight: 300;
          padding-left: 1.5rem;
          position: relative;
        }

        .disclaimer-list li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.65em;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-gold);
          opacity: 0.6;
        }

        .emergency-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          margin-top: var(--spacing-sm);
        }

        .emergency-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          padding: 1.5rem;
          transition: var(--transition);
        }

        .emergency-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .emergency-card-name {
          font-family: var(--font-cormorant), serif;
          font-size: 1.05rem;
          font-weight: 500;
          color: var(--color-gold);
          margin-bottom: 0.35rem;
        }

        .emergency-card-phone {
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--color-text);
          letter-spacing: 0.03em;
          margin-bottom: 0.25rem;
        }

        .emergency-card-note {
          font-size: 0.8rem;
          color: var(--color-text-secondary);
          font-weight: 300;
        }

        .disclaimer-divider {
          width: 80px;
          height: 1px;
          background: var(--color-gold);
          opacity: 0.2;
          margin: var(--spacing-md) 0;
        }

        .disclaimer-highlight {
          background: rgba(201, 169, 110, 0.06);
          border-left: 2px solid var(--color-gold);
          padding: 1rem 1.25rem;
          border-radius: 0 6px 6px 0;
          margin: 1rem 0;
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--color-text-secondary);
          font-weight: 300;
        }

        .disclaimer-highlight strong {
          color: var(--color-gold-light);
        }

        @media (max-width: 768px) {
          .disclaimer-title {
            font-size: 1.8rem;
          }

          .disclaimer-section-title {
            font-size: 1.25rem;
          }

          .emergency-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="disclaimer-page">
        <div className="disclaimer-container">
          <Link href="/" className="disclaimer-back">
            ← На главную
          </Link>

          <h1 className="disclaimer-title">Дисклеймер и Политика конфиденциальности</h1>

          {/* Дисклеймер */}
          <section className="disclaimer-section">
            <h2 className="disclaimer-section-title">Дисклеймер</h2>
            <p className="disclaimer-text">
              Настоящее приложение «Штурман» (далее — «Приложение») представляет собой
              инструмент самоисследования, основанный на методиках когнитивно-поведенческой
              психологии, рефлексивных практиках и технологиях искусственного интеллекта.
              Используя Приложение, вы подтверждаете, что ознакомились с настоящим
              дисклеймером и принимаете изложенные в нём условия.
            </p>
            <p className="disclaimer-text">
              <strong>Приложение не является медицинским изделием</strong> и не
              предоставляет медицинских, психотерапевтических или диагностических услуг.
              Приложение не заменяет профессиональную медицинскую или психологическую
              помощь, консультацию врача-психиатра, психотерапевта или клинического
              психолога. Любые выводы, рекомендации и интерпретации, формируемые Приложением,
              носят исключительно информационный и образовательный характер.
            </p>
            <p className="disclaimer-text">
              <strong>AI-ассистент не является заменой психотерапевта.</strong>
              Ответы, генерируемые искусственным интеллектом, основаны на статистических
              закономерностях языковой модели и не учитывают всей полноты вашей клинической
              картины, анамнеза и индивидуальных особенностей. AI-ассистент не обладает
              способностью к клиническому суждению и не может диагностировать психические
              расстройства или предписывать лечение.
            </p>
            <p className="disclaimer-text">
              <strong>Приложение — инструмент самоисследования, а не диагностики.</strong>
              Результаты, получаемые в процессе использования Приложения, такие как
              эмоциональные профили, метафоры дня, карты сценариев и иные аналитические
              материалы, представляют собой творческие интерпретации, а не клинические
              заключения. Они не могут служить основанием для постановки диагноза, изменения
              схемы лечения или отказа от профессиональной помощи.
            </p>
            <p className="disclaimer-text">
              <strong>Пользователь несёт полную ответственность</strong> за свои действия
              и решения, принятые на основании информации, полученной через Приложение.
              Администрация Приложения, разработчики и владельцы не несут ответственности
              за какой-либо прямой, косвенный, случайный или последующий ущерб, возникший
              в результате использования или невозможности использования Приложения.
            </p>
            <div className="disclaimer-highlight">
              <strong>При экстренных состояниях</strong> — если вы испытываете суицидальные
              мысли, находитесь в остром кризисном состоянии, испытываете паническую атаку
              или иное состояние, угрожающее вашей жизни или здоровью, —{' '}
              <strong>немедленно обратитесь к специалистам</strong>. Воспользуйтесь
              контактами экстренной психологической помощи, приведёнными ниже, или
              позвоните по номеру <strong>112</strong>.
            </div>
          </section>

          {/* Политика конфиденциальности */}
          <section className="disclaimer-section">
            <h2 className="disclaimer-section-title">Политика конфиденциальности</h2>
            <p className="disclaimer-text">
              Настоящая Политика конфиденциальности определяет порядок обработки и защиты
              персональных данных пользователей Приложения «Штурман» (далее — «Пользователь»)
              и действует в отношении всей информации, которую Приложение может получить
              о Пользователе во время использования им Приложения.
            </p>

            <h3 className="disclaimer-section-title" style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Сбор данных
            </h3>
            <p className="disclaimer-text">
              Приложение собирает следующие категории данных, добровольно предоставляемых
              Пользователем в процессе самоисследования:
            </p>
            <ul className="disclaimer-list">
              <li>
                <strong>Дневниковые записи</strong> — текстовые материалы, создаваемые
                Пользователем в рамках направления «Активный дневник» (Resonance), включая
                описания событий, мыслей и эмоциональных состояний.
              </li>
              <li>
                <strong>Эмоциональные чекины</strong> — данные о настроении, эмоциональном
                фоне и самочувствии, регистрируемые Пользователем в рамках направления
                «Эмоциональный профиль».
              </li>
              <li>
                <strong>Сенсорные данные</strong> — информация о телесных ощущениях,
                фиксируемая Пользователем через сенсорные чекины в рамках направления
                «Сенсорные якоря».
              </li>
              <li>
                <strong>Голосовые записи</strong> — аудиоматериалы, записываемые
                Пользователем в рамках направления «Диалог с Тенью».
              </li>
              <li>
                <strong>Данные о взаимодействии</strong> — техническая информация о частоте
                и продолжительности использования Приложения, необходимая для расчёта
                прогресса и предоставления бонусов.
              </li>
            </ul>

            <h3 className="disclaimer-section-title" style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Хранение данных
            </h3>
            <p className="disclaimer-text">
              <strong>Все данные хранятся в зашифрованном виде</strong> с использованием
              современных криптографических стандартов (AES-256). Данные размещаются на
              серверах, физически расположенных на территории Российской Федерации, в
              соответствии с требованиями Федерального закона № 152-ФЗ «О персональных
              данных». Доступ к данным имеет только ограниченный круг технических
              специалистов, непосредственно обеспечивающих функционирование Приложения.
            </p>

            <h3 className="disclaimer-section-title" style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Передача данных третьим лицам
            </h3>
            <p className="disclaimer-text">
              <strong>Данные Пользователя не передаются третьим лицам</strong>, за
              исключением случаев, прямо предусмотренных законодательством Российской
              Федерации. Приложение не продаёт, не обменивает и не предоставляет данные
              Пользователя рекламным сетям, маркетинговым компаниям, аналитическим
              агентствам или иным коммерческим организациям.
            </p>

            <h3 className="disclaimer-section-title" style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Использование AI (OpenAI API)
            </h3>
            <p className="disclaimer-text">
              Для формирования персонализированных ответов, метафор, интерпретаций и иных
              аналитических материалов Приложение использует API OpenAI. В процессе
              генерации ответа <strong>обезличенные фрагменты данных Пользователя</strong>{' '}
              (дневниковые записи, контекст эмоциональных чекинов) временно передаются
              серверам OpenAI. Передача осуществляется по зашифрованным каналам (TLS 1.3).
              OpenAI не использует переданные данные для обучения своих моделей и не
              сохраняет их после обработки запроса в соответствии с политикой OpenAI API
              Data Usage Policy.
            </p>

            <h3 className="disclaimer-section-title" style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
              Удаление данных
            </h3>
            <p className="disclaimer-text">
              Пользователь имеет право в любой момент <strong>запросить полное удаление</strong>{' '}
              всех своих данных, включая дневниковые записи, эмоциональные чекины, сенсорные
              данные, голосовые записи и информацию о прогрессе. Запрос на удаление
              направляется через интерфейс Приложения или по электронной почте. После
              получения запроса все данные Пользователя безвозвратно удаляются в течение
              30 (тридцати) календарных дней. По истечении этого срока восстановление
              данных невозможно.
            </p>
          </section>

          <div className="disclaimer-divider" />

          {/* Экстренная психологическая помощь */}
          <section className="disclaimer-section">
            <h2 className="disclaimer-section-title">Экстренная психологическая помощь</h2>
            <p className="disclaimer-text">
              Если вы или ваш близкий находитесь в кризисной ситуации, пожалуйста,
              воспользуйтесь приведёнными ниже контактами. Все службы работают на
              территории Российской Федерации.
            </p>
            <div className="emergency-grid">
              <div className="emergency-card">
                <div className="emergency-card-name">Единый телефон доверия</div>
                <div className="emergency-card-phone">8-800-2000-122</div>
                <div className="emergency-card-note">Круглосуточно, бесплатно, анонимно</div>
              </div>
              <div className="emergency-card">
                <div className="emergency-card-name">Горячая линия МЧС России</div>
                <div className="emergency-card-phone">8 (800) 775-17-17</div>
                <div className="emergency-card-note">Психологическая поддержка при ЧС</div>
              </div>
              <div className="emergency-card">
                <div className="emergency-card-name">Центр экстренной психологической помощи МЧС</div>
                <div className="emergency-card-phone">+7 (495) 989-50-50</div>
                <div className="emergency-card-note">Круглосуточно</div>
              </div>
              <div className="emergency-card">
                <div className="emergency-card-name">Московская служба психологической помощи</div>
                <div className="emergency-card-phone">8 (499) 173-09-09</div>
                <div className="emergency-card-note">Круглосуточно</div>
              </div>
              <div className="emergency-card">
                <div className="emergency-card-name">Кризисная линия доверия</div>
                <div className="emergency-card-phone">8-800-100-49-94</div>
                <div className="emergency-card-note">Для людей в кризисном состоянии</div>
              </div>
              <div className="emergency-card">
                <div className="emergency-card-name">Экстренная служба</div>
                <div className="emergency-card-phone">112</div>
                <div className="emergency-card-note">Единый номер экстренных служб</div>
              </div>
            </div>
          </section>

          <div className="disclaimer-divider" />

          {/* Ответственность */}
          <section className="disclaimer-section">
            <h2 className="disclaimer-section-title">Ответственность</h2>
            <p className="disclaimer-text">
              Приложение «Штурман» предоставляется на условиях «как есть» (as-is). Администрация
              Приложения не даёт никаких явных или подразумеваемых гарантий относительно
              точности, полноты, надёжности или пригодности информации и материалов,
              содержащихся в Приложении, для какой-либо конкретной цели.
            </p>
            <p className="disclaimer-text">
              Администрация Приложения не несёт ответственности за:
            </p>
            <ul className="disclaimer-list">
              <li>
                Любые решения, принятые Пользователем на основании информации, полученной
                через Приложение.
              </li>
              <li>
                Эмоциональные состояния, переживания или психологические последствия,
                возникшие в процессе использования Приложения.
              </li>
              <li>
                Ущерб, связанный с невозможностью доступа к Приложению по техническим
                причинам, включая перебои в работе сети Интернет.
              </li>
              <li>
                Действия третьих лиц, включая несанкционированный доступ к данным,
                произошедший не по вине Администрации.
              </li>
            </ul>
            <p className="disclaimer-text">
              Используя Приложение, вы соглашаетесь с тем, что Администрация не может быть
              привлечена к ответственности за любой ущерб, связанный с использованием или
              невозможностью использования Приложения, за исключением случаев, прямо
              предусмотренных законодательством Российской Федерации.
            </p>
            <p className="disclaimer-text">
              Администрация оставляет за собой право вносить изменения в настоящий документ
              в одностороннем порядке. Новая редакция вступает в силу с момента её
              публикации в Приложении. Продолжение использования Приложения после внесения
              изменений означает согласие Пользователя с новой редакцией.
            </p>

            <p className="disclaimer-text" style={{ marginTop: '2rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Дата последнего обновления: январь 2025 года.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
