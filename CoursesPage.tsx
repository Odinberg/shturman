// CoursesPage.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ с проверкой доступа и кнопкой "Продолжить"
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { coursesAPI } from "../lib/api";

const FALLBACK_COURSES = {
  "v_compass_course": {
    slug: "v_compass_course",
    title: "Внутренний Компас: Интегративная программа глубинной саморегуляции",
    subtitle: "Сборка целостности. 7 стрелок. Конституция себя.",
    duration: "9 недель",
    modules: "9 модулей",
    shortDescription: "9-недельный структурированный курс самопознания, построенный на интеграции современных психологических подходов.",
    price: "3900 ₽",
    isPaid: true,
    outcomes: [
      "Интегральная карта личности («Мандала Себя»)",
      "Персональный Договор с Собой (Конституция)",
      "7 стрелок компаса — навыки саморегуляции",
    ],
  },
  "v_karta_ruin_course": {
    slug: "v_karta_ruin_course",
    title: "КАРТА РУИН: ИНСТРУМЕНТЫ",
    subtitle: "Практическое руководство для тех, у кого всё рухнуло",
    duration: "60 дней",
    modules: "8 модулей",
    shortDescription: "Экзистенциальный навигатор по территории, которая называется «Полная Жопа». Только инструменты, чтобы не сдохнуть.",
    price: "5900 ₽",
    isPaid: true,
    outcomes: [
      "Карта Руин (визуальная карта потерь и ресурсов)",
      "Инструкция по эксплуатации себя",
      "Договор с Собой (личная Конституция)",
    ],
  },
  "v_profiling_course": {
    slug: "v_profiling_course",
    title: "ВЕКТОРНЫЙ ПРОФАЙЛИНГ",
    subtitle: "Читать людей как книгу. Система экспресс-диагностики личности",
    duration: "57 дней",
    modules: "8 модулей",
    shortDescription: "Системное понимание людей. Вы научитесь видеть не только слова, но и скрытые мотивы.",
    price: "9900 ₽",
    isPaid: true,
    outcomes: [
      "Интегральный профиль своей личности",
      "Навык профайлинга за 30-60 минут",
      "Шкалу «Светофор мотиваций»",
    ],
  },
  "mini_course": {
    slug: "mini_course",
    title: "МИНИ-КУРС «ЧЕСТНЫЙ СТАРТ»",
    subtitle: "3 дня навигации по себе",
    duration: "3 дня",
    modules: "3 модуля",
    shortDescription: "Мы привыкли жить с внутренним диктором: «ты должен», «так правильно», «что подумают люди».",
    price: "Бесплатно",
    isPaid: false,
    isFree: true,
    outcomes: [
      "Ясность: карту внутренних конфликтов",
      "Опора: 3 принципа для навигации",
      "Доступ к полному курсу со скидкой 20%",
    ],
  },
  "diagnostic": {
    slug: "diagnostic",
    title: "Диагностика «Внутренний Компас»",
    subtitle: "Карта твоего текущего состояния",
    duration: "17 минут",
    modules: "17 вопросов",
    shortDescription: "Перед тем как идти — надо понять, где ты стоишь. Это не тест на «хорошесть».",
    price: "Бесплатно",
    isPaid: false,
    outcomes: [
      "Точка старта: первая глава для работы",
      "Расшифровка языка твоего тела и чувств",
      "Понимание: «Так вот где я на самом деле»",
    ],
  },
};

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();

  // Состояния для отслеживания проверки доступа
  const [checkingAccess, setCheckingAccess] = useState<string | null>(null);

  // Состояние для хранения информации о доступах к курсам
  const [courseAccess, setCourseAccess] = useState<Record<string, boolean>>({});

  const { data: apiCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesAPI.getAll(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Проверяем доступ к курсам при наличии токена
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const checkAccess = async () => {
      const slugs = Object.keys(FALLBACK_COURSES);
      const accessMap: Record<string, boolean> = {};

      for (const slug of slugs) {
        try {
          const courseData = await coursesAPI.getBySlug(slug);
          if (courseData.id) {
            const access = await coursesAPI.checkAccess(courseData.id);
            accessMap[slug] = access.has_access || false;
          }
        } catch {
          // Игнорируем ошибки — доступ не подтверждён
          accessMap[slug] = false;
        }
      }

      setCourseAccess(accessMap);
    };

    checkAccess();
  }, []);

  // Нормализатор: преобразует API-формат в формат, ожидаемый UI
  const normalizeCourse = (course: any) => {
    const fallback = FALLBACK_COURSES[course.slug as keyof typeof FALLBACK_COURSES];

    if (!fallback) {
      return {
        ...course,
        price: "0 ₽",
        isPaid: false,
        outcomes: [],
      };
    }

    return {
      ...course,
      subtitle: course.subtitle || fallback.subtitle || "",
      duration: course.duration || fallback.duration || `${course.duration_days || 0} дней`,
      modules: course.modules || fallback.modules || `${Math.ceil((course.duration_days || 1) / 7)} модулей`,
      shortDescription: course.shortDescription || course.short_description || fallback.shortDescription || "",
      title: course.title || fallback.title,
      price: fallback.price,
      isPaid: fallback.isPaid,
      outcomes: course.outcomes || fallback.outcomes || [],
    };
  };

  // Формируем список курсов
  let courses = [];
  if (Array.isArray(apiCourses) && apiCourses.length > 0) {
    const order = Object.keys(FALLBACK_COURSES);
    courses = apiCourses
      .map(normalizeCourse)
      .sort((a, b) => {
        const indexA = order.indexOf(a.slug);
        const indexB = order.indexOf(b.slug);
        return indexA - indexB;
      });
  } else {
    courses = Object.values(FALLBACK_COURSES);
  }

  // Функция обработки клика по кнопке "Начать обучение"
  const handleStartCourse = async (course: any) => {
    console.log("=== handleStartCourse CALLED ===");
    console.log("Course slug:", course.slug);
    console.log("Course title:", course.title);
    console.log("Course price:", course.price);
    console.log("Course isPaid:", course.isPaid);

    const token = localStorage.getItem('token');
    console.log("Has token?", !!token);

    if (!token) {
      console.log("No token, redirect to /login");
      localStorage.setItem('redirectAfterLogin', `/courses`);
      navigate('/login');
      return;
    }

    // Для диагностики
    if (course.slug === "diagnostic") {
      console.log("Diagnostic, redirect to /diagnostic");
      navigate('/diagnostic');
      return;
    }

    // ⭐ БЕСПЛАТНЫЙ КУРС "ЧЕСТНЫЙ СТАРТ" (mini_course) - сразу на страницу обучения
    if (course.slug === "mini_course") {
      console.log("FREE mini_course - redirect directly to /learn/mini_course");
      navigate(`/learn/${course.slug}`);
      return;
    }

    // Если курс уже куплен — сразу на обучение
    if (courseAccess[course.slug]) {
      console.log("Course already purchased, redirect to /learn/" + course.slug);
      navigate(`/learn/${course.slug}`);
      return;
    }

    setCheckingAccess(course.slug);

    try {
      let courseId = course.id;
      if (!courseId && course.slug) {
        console.log("Fetching course by slug:", course.slug);
        const courseData = await coursesAPI.getBySlug(course.slug);
        courseId = courseData.id;
        console.log("Got courseId:", courseId);
      }

      if (!courseId) {
        alert("Не удалось получить информацию о курсе. Попробуйте позже.");
        setCheckingAccess(null);
        return;
      }

      const isFree = !course.isPaid || course.price === "0 ₽" || course.price === "Бесплатно";
      console.log("Is free course?", isFree);
      console.log("Will redirect to:", isFree ? `/learn/${course.slug}` : `/payment/${course.slug}`);

      if (isFree) {
        navigate(`/learn/${course.slug}`);
      } else {
        navigate(`/payment/${course.slug}`);
      }
    } catch (error) {
      console.error("Error in handleStartCourse:", error);
      alert("Произошла ошибка. Попробуйте позже.");
    } finally {
      setCheckingAccess(null);
    }
  };

  // Функция для кнопки "Продолжить" — переход сразу к обучению
  const handleContinueCourse = (course: any) => {
    navigate(`/learn/${course.slug}`);
  };

  // Эффект для Intersection Observer (fade-in анимации)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    document.querySelectorAll(".fade-in").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [courses]);

  // Эффект для скролла хедера
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector(".main-header") as HTMLElement;
      if (!header) return;

      if (window.scrollY > 100) {
        header.style.padding = "1rem 0";
        header.style.background = "rgba(10, 10, 10, 0.98)";
      } else {
        header.style.padding = "1.5rem 0";
        header.style.background = "rgba(10, 10, 10, 0.95)";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Эффект для обработки якорных ссылок при загрузке страницы
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const element = document.getElementById(id);

      if (element) {
        setTimeout(() => {
          window.scrollTo({
            top: element.offsetTop - 100,
            behavior: "smooth",
          });
        }, 100);
      }
    }
  }, []);

  const comparisonRows = [
    {
      char: "Основной фокус",
      col1: "Работа с собой в кризисе",
      col2: "Понимание других людей",
    },
    {
      char: "Целевая аудитория",
      col1: "Те, кто потерял опору, на дне",
      col2: "Те, кто хочет разбираться в людях",
    },
    {
      char: "Ключевая метафора",
      col1: "Карта местности «Полная Жопа»",
      col2: "Доверие как кредит",
    },
    { char: "Длительность", col1: "60 дней", col2: "57 дней" },
    { char: "Модулей", col1: "8", col2: "8" },
    {
      char: "Главный результат",
      col1: "Инструкция по эксплуатации себя",
      col2: "Интегральный профиль и Светофор мотиваций",
    },
    {
      char: "Финальный артефакт",
      col1: "Договор с Собой",
      col2: "Алгоритм принятия решения о доверии",
    },
  ];

  // Получаем список купленных курсов
  const purchasedCourses = courses.filter(course => courseAccess[course.slug]);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
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
          font-family: 'Inter', sans-serif;
          line-height: 1.8;
          color: var(--color-text);
          background-color: var(--color-dark);
          overflow-x: hidden;
          font-weight: 300;
          letter-spacing: 0.02em;
          min-height: 100vh;
        }

        h1, h2, h3, h4 {
          font-family: 'Cormorant Garamond', serif;
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
          font-family: 'Cormorant Garamond', serif;
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

        .hero {
          min-height: 40vh;
          display: flex;
          align-items: center;
          position: relative;
          padding-top: 6rem;
          overflow: hidden;
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background:
            radial-gradient(circle at 20% 30%, rgba(201, 169, 110, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(58, 80, 107, 0.03) 0%, transparent 50%),
            linear-gradient(145deg, #0A0A0A 0%, #0C1A1F 100%);
          z-index: -1;
        }

        .hero-content {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          color: var(--color-text);
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          color: var(--color-gold);
          margin-bottom: 3rem;
          font-weight: 300;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .hero-divider {
          width: 120px;
          height: 1px;
          background: var(--color-gold);
          margin: 2rem auto;
          opacity: 0.3;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-gold);
          margin-bottom: 2rem;
          text-decoration: none;
          transition: var(--transition);
        }

        .back-link:hover {
          color: var(--color-gold-light);
          transform: translateX(-5px);
        }

        .content-section {
          padding: var(--spacing-xl) 0;
          position: relative;
        }

        .section-header {
          text-align: center;
          margin-bottom: var(--spacing-lg);
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

        .content-block {
          max-width: 800px;
          margin: 0 auto var(--spacing-lg);
        }

        .content-text {
          font-size: 1.2rem;
          line-height: 1.9;
          color: var(--color-text);
          margin-bottom: 1.8rem;
          font-weight: 300;
        }

        .content-text strong {
          font-weight: 500;
          color: var(--color-gold-light);
        }

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

        .card-title {
          font-size: 2rem;
          color: var(--color-gold);
          margin-bottom: 1.5rem;
          font-family: 'Cormorant Garamond', serif;
        }

        .course-card {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          overflow: hidden;
          transition: var(--transition);
        }

        .course-card:hover {
          border-color: var(--color-gold);
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .course-card.purchased {
          border-color: var(--color-success);
          border-width: 1px;
        }

        .course-header {
          background: linear-gradient(135deg, rgba(201, 169, 110, 0.1) 0%, transparent 100%);
          padding: 2.5rem;
          border-bottom: 1px solid var(--color-border);
        }

        .course-body {
          padding: 2.5rem;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--color-gold);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .badge i {
          font-size: 1rem;
        }

        .purchased-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(76, 175, 80, 0.15);
          color: var(--color-success);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .button-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: var(--color-gold);
          color: var(--color-dark);
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: var(--border-radius);
          transition: var(--transition);
          border: none;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .button-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(201, 169, 110, 0.3);
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-success {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: var(--color-success);
          color: white;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: var(--border-radius);
          transition: var(--transition);
          border: none;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .button-success:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(76, 175, 80, 0.3);
        }

        .button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background: transparent;
          color: var(--color-gold);
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: var(--border-radius);
          transition: var(--transition);
          border: 1px solid var(--color-gold);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .button-secondary:hover {
          background: rgba(201, 169, 110, 0.1);
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(201, 169, 110, 0.2);
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius);
          overflow: hidden;
        }

        .comparison-table th {
          background: rgba(201, 169, 110, 0.1);
          padding: 1.5rem;
          text-align: left;
          color: var(--color-gold);
          font-weight: 500;
          font-size: 1.1rem;
          border-bottom: 1px solid var(--color-border);
        }

        .comparison-table td {
          padding: 1.5rem;
          border-bottom: 1px solid var(--color-border);
          color: var(--color-text-secondary);
        }

        .comparison-table tr:last-child td {
          border-bottom: none;
        }

        .comparison-table td:first-child {
          color: var(--color-text);
          font-weight: 500;
          width: 33%;
        }

        @media (max-width: 768px) {
          .comparison-table {
            font-size: 0.9rem;
          }
          .comparison-table th,
          .comparison-table td {
            padding: 1rem;
          }
        }

        .list-disc {
          list-style: none;
          padding: 0;
        }

        .list-disc li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: var(--color-text-secondary);
        }

        .list-disc li i {
          color: var(--color-gold);
          font-size: 1rem;
          margin-top: 0.25rem;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
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

        .text-center { text-align: center; }
        .mt-4 { margin-top: 1rem; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mt-12 { margin-top: 3rem; }
        .mt-16 { margin-top: 4rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-8 { margin-bottom: 2rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-16 { margin-bottom: 4rem; }

        .space-y-4 > * + * { margin-top: 1rem; }
        .space-y-8 > * + * { margin-top: 2rem; }
        .space-y-12 > * + * { margin-top: 3rem; }
        .space-y-16 > * + * { margin-top: 4rem; }

        .flex-wrap { flex-wrap: wrap; }
        .gap-2 { gap: 0.5rem; }
        .gap-4 { gap: 1rem; }
        .gap-6 { gap: 1.5rem; }

        .main-footer {
          background: var(--color-deep);
          padding: 3rem 0 2rem;
          margin-top: var(--spacing-xl);
          border-top: 1px solid var(--color-border);
          flex-shrink: 0;
        }

        .footer-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .footer-logo {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          color: var(--color-gold);
          font-weight: 500;
        }

        .footer-links {
          display: flex;
          justify-content: center;
          width: 100%;
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

        .footer-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1px;
          background: var(--color-gold);
          transition: var(--transition);
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .footer-divider {
          width: 100%;
          height: 1px;
          background: var(--color-border);
          margin: 1rem 0;
        }

        .footer-copyright {
          text-align: center;
          color: var(--color-text-secondary);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        @media (max-width: 992px) {
          .hero-title { font-size: 3.5rem; }
          .section-title { font-size: 2.8rem; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.8rem; }
          .hero-subtitle { font-size: 1.2rem; }
          .nav-links { display: none; }
          .content-section { padding: var(--spacing-lg) 0; }
          .footer-links-group { flex-direction: column; align-items: center; gap: 1rem; }
        }

        @media (max-width: 480px) {
          .hero-title { font-size: 2.2rem; }
          .section-title { font-size: 2.2rem; }
          .course-header, .course-body { padding: 1.5rem; }
        }
      `}</style>

      <header className="main-header">
        <div className="container header-container">
          <Link to="/" className="logo">
            <i className="fas fa-compass logo-icon"></i>
            ВНУТРЕННИЙ КОМПАС
          </Link>
          <nav className="nav-links">
            <Link to="/#intro" className="nav-link">Введение</Link>
            <Link to="/methodology" className="nav-link">Теория</Link>
            <Link to="/club" className="nav-link">Клуб</Link>
            <Link to="/courses" className="nav-link">Курсы</Link>
            <Link to="/about" className="nav-link">Проект</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-background" />
          <div className="container">
            <div className="hero-content">
              <Link to="/" className="back-link fade-in">
                <i className="fas fa-arrow-left" /> Вернуться на главную
              </Link>
              <h1 className="hero-title fade-in stagger-delay-1">Все курсы</h1>
              <div className="hero-divider fade-in stagger-delay-2"></div>
              <p className="hero-subtitle fade-in stagger-delay-2">
                Системная навигация по внутреннему миру
              </p>
            </div>
          </div>
        </section>

        {/* Мои курсы (только если есть купленные) */}
        {purchasedCourses.length > 0 && (
          <section className="content-section" style={{ background: "rgba(76, 175, 80, 0.03)", paddingTop: "2rem", paddingBottom: "0" }}>
            <div className="container">
              <div className="section-header fade-in" style={{ marginBottom: "2rem" }}>
                <h2 className="section-title" style={{ fontSize: "2.5rem" }}>Мои курсы</h2>
                <p className="section-subtitle">У вас есть доступ к этим курсам</p>
              </div>
              <div className="space-y-8">
                {purchasedCourses.map((course, index) => (
                  <div key={course.slug} className="fade-in stagger-delay-1">
                    <div className="course-card purchased">
                      <div className="course-header">
                        <div className="flex gap-4 mb-4" style={{ justifyContent: "space-between", alignItems: "center" }}>
                          <div className="flex gap-4">
                            <span className="badge">
                              <i className="far fa-clock" />
                              {course.duration}
                            </span>
                            <span className="badge">
                              <i className="fas fa-layer-group" />
                              {course.modules}
                            </span>
                          </div>
                          <span className="purchased-badge">
                            <i className="fas fa-check-circle" /> Куплен
                          </span>
                        </div>
                        <h2 className="card-title text-3xl">{course.title}</h2>
                        <p className="text-xl text-[#E8D9B5] italic">
                          {course.subtitle}
                        </p>
                      </div>
                      <div className="course-body" style={{ textAlign: "center" }}>
                        <button
                          onClick={() => handleContinueCourse(course)}
                          className="button-success"
                          style={{ width: "100%" }}
                        >
                          <i className="fas fa-play" /> Продолжить обучение
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="content-section">
          <div className="container">
            {purchasedCourses.length > 0 && (
              <div className="section-header fade-in" style={{ marginBottom: "3rem" }}>
                <h2 className="section-title" style={{ fontSize: "2.5rem" }}>Доступные курсы</h2>
              </div>
            )}
            <div className="space-y-16">
              {!courses || courses.length === 0 ? (
                <div className="text-center fade-in">
                  <p className="content-text" style={{ color: "var(--color-text-secondary)", fontSize: "1.2rem" }}>
                    Курсы временно недоступны
                  </p>
                </div>
              ) : (
                courses.map((course, index) => (
                  <div
                    key={course.slug || index}
                    className={`fade-in stagger-delay-${(index % 4) + 1}`}
                  >
                    <div className={`course-card ${courseAccess[course.slug] ? 'purchased' : ''}`}>
                      <div className="course-header">
                        <div className="flex gap-4 mb-4" style={{ justifyContent: "space-between", alignItems: "center" }}>
                          <div className="flex gap-4">
                            <span className="badge">
                              <i className="far fa-clock" />
                              {course.duration}
                            </span>
                            <span className="badge">
                              <i className="fas fa-layer-group" />
                              {course.modules}
                            </span>
                          </div>
                          {courseAccess[course.slug] && (
                            <span className="purchased-badge">
                              <i className="fas fa-check-circle" /> Куплен
                            </span>
                          )}
                        </div>
                        <h2 className="card-title text-3xl">{course.title}</h2>
                        <p className="text-xl text-[#E8D9B5] italic">
                          {course.subtitle}
                        </p>
                      </div>

                      <div className="course-body space-y-6">
                        <div>
                          <p className="content-text" style={{ fontSize: "1.1rem" }}>
                            {course.shortDescription}
                          </p>
                        </div>

                        <div>
                          <div className="flex flex-wrap gap-3">
                            {course.outcomes?.map((outcome: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-[#A0A0A0]">
                                <i className="fas fa-check-circle text-[#C9A96E]" />
                                <span className="text-sm">{outcome}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-4 pt-4 border-t border-[#707070]/30">
                          <div className="text-2xl font-bold text-[#C9A96E]">{course.price}</div>

                          {course.slug === "diagnostic" ? (
                            <Link to="/diagnostic" className="button-primary">
                              <i className="fas fa-compass" /> Пройти диагностику
                            </Link>
                          ) : courseAccess[course.slug] ? (
                            <button
                              onClick={() => handleContinueCourse(course)}
                              className="button-success"
                            >
                              <i className="fas fa-play" /> Продолжить обучение
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartCourse(course)}
                              disabled={checkingAccess === course.slug}
                              className="button-primary"
                            >
                              {checkingAccess === course.slug ? (
                                <>
                                  <i className="fas fa-spinner fa-spin" /> Проверка...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-play" /> Начать обучение
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="content-section" style={{ background: "var(--color-deep)" }}>
          <div className="container">
            <div className="section-header fade-in">
              <h2 className="section-title">Сравнение основных курсов</h2>
            </div>

            <div className="fade-in stagger-delay-1">
              <div className="overflow-x-auto">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Характеристика</th>
                      <th>«Карта Руин»</th>
                      <th>«Векторный профайлинг»</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr key={i}>
                        <td>{row.char}</td>
                        <td>{row.col1}</td>
                        <td>{row.col2}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section className="content-section">
          <div className="container">
            <div className="fade-in">
              <div className="text-center bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-12 my-12">
                <h2 className="card-title text-3xl mb-4">Выбери свой путь</h2>
                <p className="content-text text-[#A0A0A0] mb-8 max-w-xl mx-auto">
                  Начни с бесплатной диагностики, чтобы почувствовать метод.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link to="/diagnostic" className="button-primary">
                    <i className="fas fa-compass" /> Пройти диагностику
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="container">
          <div className="footer-container">
            <div className="footer-logo">ВНУТРЕННИЙ КОМПАС</div>
            <div className="footer-links">
              <div className="footer-links-group">
                <Link to="/" className="footer-link">Главная</Link>
                <Link to="/methodology" className="footer-link">Теория</Link>
                <Link to="/courses" className="footer-link">Курсы</Link>
                <Link to="/about" className="footer-link">Проект</Link>
                <Link to="/oferta" className="footer-link">Публичная оферта</Link>
                <Link to="/privacy" className="footer-link">Конфиденциальность</Link>
              </div>
            </div>
            <div className="footer-divider"></div>
            <div className="footer-copyright">
              <p>Системная психология субъектности</p>
              <p style={{ marginTop: "0.5rem", opacity: 0.7 }}>
                © 2026 | Все права на методологию защищены
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};