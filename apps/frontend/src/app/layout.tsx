import { Inter, Cormorant_Garamond } from 'next/font/google';

const inter = Inter({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['cyrillic', 'latin'],
  display: 'swap',
  variable: '--font-cormorant',
  weight: ['300', '500', '600', '700'],
});

export const metadata = {
  title: 'Штурман',
  description: 'Интегративная программа глубинной саморегуляции',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <style>{`
          :root {
            --color-dark: #0A0A0A;
            --color-deep: #121212;
            --color-card: #1A1A1A;
            --color-border: #707070;
            --color-gold: #C9A96E;
            --color-gold-light: #E8D9B5;
            --color-text: #E8E6E1;
            --color-text-secondary: #A0A0A0;
            --color-accent: #6A8BAC;
            --color-success: #4CAF50;
            --spacing-xs: 0.5rem;
            --spacing-sm: 1rem;
            --spacing-md: 2rem;
            --spacing-lg: 4rem;
            --spacing-xl: 6rem;
            --border-radius: 8px;
            --transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: var(--font-inter), sans-serif;
            line-height: 1.8;
            color: var(--color-text);
            background-color: var(--color-dark);
            overflow-x: hidden;
            font-weight: 300;
            letter-spacing: 0.02em;
            min-height: 100vh;
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-cormorant), serif;
            font-weight: 500;
            line-height: 1.2;
            letter-spacing: -0.02em;
          }

          .container {
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 var(--spacing-md);
          }

          .main-header {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
            padding: 1.5rem 0;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--color-border);
            transition: var(--transition);
          }

          .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .logo {
            font-family: var(--font-cormorant), serif;
            font-size: 1.8rem;
            font-weight: 600;
            color: var(--color-gold);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .logo-icon {
            font-size: 1.5rem;
          }

          .nav-links {
            display: flex;
            gap: 2.5rem;
          }

          .nav-link {
            color: var(--color-text);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: var(--transition);
            position: relative;
            padding: 0.5rem 0;
          }

          .nav-link:hover {
            color: var(--color-gold);
          }

          .nav-link::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 1px;
            background: var(--color-gold);
            transition: var(--transition);
          }

          .nav-link:hover::after {
            width: 100%;
          }

          .main-content {
            padding-top: 5rem;
            min-height: calc(100vh - 200px);
          }

          .main-footer {
            background: var(--color-deep);
            padding: 3rem 0 2rem;
            margin-top: var(--spacing-xl);
            border-top: 1px solid var(--color-border);
          }

          .footer-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2rem;
          }

          .footer-logo {
            font-family: var(--font-cormorant), serif;
            font-size: 2rem;
            color: var(--color-gold);
            font-weight: 500;
          }

          .footer-links-group {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 2rem;
          }

          .footer-link {
            color: var(--color-text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
            transition: var(--transition);
            padding: 0.5rem 0;
            position: relative;
          }

          .footer-link:hover {
            color: var(--color-gold);
          }

          .footer-copy {
            color: var(--color-text-secondary);
            font-size: 0.8rem;
            opacity: 0.6;
          }

          .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.8s ease, transform 0.8s ease;
          }

          .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
          }

          .stagger-delay-1 { transition-delay: 0.1s; }
          .stagger-delay-2 { transition-delay: 0.2s; }
          .stagger-delay-3 { transition-delay: 0.3s; }
          .stagger-delay-4 { transition-delay: 0.4s; }

          .card {
            background: var(--color-card);
            border: 1px solid var(--color-border);
            border-radius: var(--border-radius);
            padding: 2rem;
            transition: var(--transition);
          }

          .card:hover {
            border-color: var(--color-gold);
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
          }

          .section-title {
            font-size: 3.5rem;
            color: var(--color-text);
            margin-bottom: var(--spacing-sm);
            position: relative;
            display: inline-block;
          }

          .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 1px;
            background: var(--color-gold);
          }

          .section-subtitle {
            font-size: 1.2rem;
            color: var(--color-text-secondary);
            max-width: 700px;
            margin: 0 auto;
          }

          .section-header {
            text-align: center;
            margin-bottom: var(--spacing-lg);
          }
        `}</style>
      </head>
      <body>
        <header className="main-header" id="main-header">
          <div className="container header-container">
            <a href="/" className="logo">
              <span className="logo-icon">✦</span>
              Штурман
            </a>
            <nav className="nav-links">
              <a href="/" className="nav-link">Главная</a>
              <a href="/journal" className="nav-link">Дневник</a>
              <a href="/emotional" className="nav-link">Эмоции</a>
              <a href="/philosophy" className="nav-link">Философия</a>
              <a href="/disclaimer" className="nav-link">Дисклеймер</a>
            </nav>
          </div>
        </header>

        <main className="main-content">
          {children}
        </main>

        <footer className="main-footer">
          <div className="container footer-container">
            <div className="footer-logo">✦ Штурман</div>
            <div className="footer-links-group">
              <a href="/" className="footer-link">Главная</a>
              <a href="/journal" className="footer-link">Дневник</a>
              <a href="/emotional" className="footer-link">Эмоции</a>
              <a href="/reframing" className="footer-link">Рефрейминг</a>
              <a href="/shadow" className="footer-link">Тень</a>
              <a href="/sensory" className="footer-link">Сенсорика</a>
              <a href="/self" className="footer-link">Я-личности</a>
              <a href="/butterfly" className="footer-link">Бабочка</a>
              <a href="/philosophy" className="footer-link">Философия</a>
              <a href="/disclaimer" className="footer-link">Дисклеймер</a>
            </div>
            <div className="footer-copy">
              © {new Date().getFullYear()} Штурман. Все права защищены.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
