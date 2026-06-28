// frontend/src/pages/CourseLearningPage.tsx - ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { coursesAPI, paymentsAPI } from "../lib/api";
import { ChatInterface } from '../components/Chat/ChatInterface';
import { vkApp, isInVK } from '../lib/vk';

interface CourseDay {
  id: number;
  title: string;
  content: string;
  order: number;
  is_completed: boolean;
}

interface ProgressData {
  course_id: number;
  completed_days: number;
  progress_percentage: number;
}

// Динамический ID VK Mini App — читается из localStorage (сохранён в main.tsx до очистки URL)
// или из URL-параметров текущего запуска, fallback на 54591074 (ppp-compass)
function getVkMiniAppId(): string {
  // Сначала проверяем сохранённый в main.tsx
  const cached = localStorage.getItem('vk_mini_app_id');
  if (cached && /^\d+$/.test(cached)) return cached;

  // Затем текущие URL-параметры (хэш может содержать параметры после React Router)
  const params = new URLSearchParams(window.location.search);
  const idFromUrl = params.get('vk_app_id');
  if (idFromUrl && /^\d+$/.test(idFromUrl)) return idFromUrl;

  // Fallback
  return '54591074';
}

const VK_MINI_APP_ID = getVkMiniAppId();
const VK_MINI_APP_URL = `https://vk.com/app${VK_MINI_APP_ID}`;


export const CourseLearningPage: React.FC = () => {
  const { courseSlug, dayNumber } = useParams<{ courseSlug: string; dayNumber?: string }>();
  const navigate = useNavigate();
  const pendingCheckDoneRef = useRef(false);
  const platformCheckDoneRef = useRef(false);

  const [days, setDays] = useState<CourseDay[]>([]);
  const [currentDay, setCurrentDay] = useState<CourseDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ⭐ ОДНОРАЗОВАЯ ПРОВЕРКА источника платежа (payment_source)
  // Если пользователь только что оплатил — решаем, оставить его на этой платформе
  // или перенаправить на ту, где был совершён платёж.
  // ⚠ ВАЖНО: ВСЕГДА очищаем payment_source после проверки, чтобы 'vk'
  // не залип в localStorage и не редиректил на VK при каждом заходе!
  useEffect(() => {
    if (!courseSlug || platformCheckDoneRef.current) return;

    const paymentSource = localStorage.getItem('payment_source');
    const isVKPayment = paymentSource === 'vk';
    const currentlyInVK = isInVK();

    console.log(`🔍 Course page - Payment source: ${paymentSource}, Currently in VK: ${currentlyInVK}, Course: ${courseSlug}`);

    // ⭐ ОЧИЩАЕМ payment_source СРАЗУ — чтобы не залипал
    localStorage.removeItem('payment_source');

    // Если мы в вебе, но платеж был из VK - редиректим в VK
    if (!currentlyInVK && isVKPayment && courseSlug) {
      console.log("🔄 Redirecting from Web to VK Mini App for course:", courseSlug);
      platformCheckDoneRef.current = true;
      const vkAppUrl = `${VK_MINI_APP_URL}#/learn/${courseSlug}${dayNumber ? `/${dayNumber}` : ''}`;

      // Показываем уведомление перед редиректом
      setToast({
        message: "Перенаправление в VK Mini App для продолжения обучения...",
        type: "success"
      });

      setTimeout(() => {
        window.location.href = vkAppUrl;
      }, 1000);
      return;
    }

    // Если мы в VK, но платеж был из веба - можно оставить как есть или показать уведомление
    if (currentlyInVK && paymentSource === 'web') {
      console.log("ℹ️ User is in VK but payment was from web - keeping in VK");
      setToast({
        message: "Внимание: оплата была произведена через веб-версию. Обучение продолжается в VK Mini App.",
        type: "success"
      });
      setTimeout(() => {
        setToast(null);
      }, 5000);
    }

    platformCheckDoneRef.current = true;
  }, [courseSlug, dayNumber]);

  useEffect(() => {
    if (courseSlug) {
      loadCourse();
    }
  }, [courseSlug]);

  useEffect(() => {
    if (days.length > 0 && courseSlug) {
      updateCurrentDay();
    }
  }, [days, dayNumber, courseSlug]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const updateCurrentDay = () => {
    if (!days.length) return;

    let targetDayNumber: number | undefined;

    if (dayNumber) {
      targetDayNumber = parseInt(dayNumber);
      if (isNaN(targetDayNumber)) {
        targetDayNumber = undefined;
      }
    } else {
      const uncompletedDay = days.find(day => !day.is_completed);
      if (uncompletedDay) {
        targetDayNumber = uncompletedDay.order;
      } else {
        targetDayNumber = days[days.length - 1].order;
      }
    }

    let targetDay = targetDayNumber ? days.find(d => d.order === targetDayNumber) : undefined;

    if (!targetDay && days.length > 0) {
      targetDay = days[0];
    }

    if (targetDay) {
      setCurrentDay(targetDay);
    }
  };

  // ⭐ Проверка pending-платежа после возврата из ЮKassa
  // Когда пользователь оплатил и ЮKassa редиректнула на /learn/{slug},
  // проверяем, не остался ли незавершённый платёж в localStorage.
  // Если да — дожидаемся подтверждения от webhook и обновляем доступ.
  useEffect(() => {
    if (!courseSlug || loading || pendingCheckDoneRef.current) return;

    const pendingPaymentId = localStorage.getItem('pending_payment_id');
    const pendingSlug = localStorage.getItem('pending_course_slug');

    if (!pendingPaymentId || pendingSlug !== courseSlug) return;

    const checkPendingPayment = async () => {
      console.log("🟡 Checking pending payment:", pendingPaymentId, "for course:", courseSlug);

      // Пробуем проверить статус несколько раз с интервалом
      let attempts = 0;
      const maxAttempts = 15; // 15 * 2s = 30 секунд ожидания webhook
      const check = async (): Promise<boolean> => {
        if (pendingCheckDoneRef.current) return true;
        try {
          // Проверяем статус платежа через API
          const status = await paymentsAPI.getStatus(pendingPaymentId);
          if (status?.status === "succeeded" && status?.paid) {
            console.log("✅ Pending payment succeeded! Reloading course...");
            localStorage.removeItem('pending_payment_id');
            localStorage.removeItem('pending_course_slug');
            pendingCheckDoneRef.current = true;
            setToast({ message: "Оплата подтверждена! Добро пожаловать на курс.", type: "success" });
            // Перезагружаем курс
            await loadCourse();
            return true;
          }
          if (status?.status === "canceled" || status?.status === "failed") {
            console.log("❌ Payment failed:", status.status);
            localStorage.removeItem('pending_payment_id');
            localStorage.removeItem('pending_course_slug');
            pendingCheckDoneRef.current = true;
            setToast({ message: "Платёж не прошёл. Попробуйте снова.", type: "error" });
            return true;
          }
        } catch (err) {
          // Ошибка при запросе — возможно webhook ещё не обработал
          console.log("⏳ Payment status check failed, will retry:", err);
        }
        return false;
      };

      // Первая проверка сразу
      const done = await check();
      if (done) return;

      // Затем с интервалом 2 сек
      const interval = setInterval(async () => {
        attempts++;
        const done = await check();
        if (done || attempts >= maxAttempts) {
          clearInterval(interval);
          if (!pendingCheckDoneRef.current) {
            // Таймаут — пробуем ещё раз перезагрузить
            console.log("⏰ Pending payment check timeout, reloading course anyway");
            localStorage.removeItem('pending_payment_id');
            localStorage.removeItem('pending_course_slug');
            pendingCheckDoneRef.current = true;
            await loadCourse();
          }
        }
      }, 2000);
    };

    checkPendingPayment();
  }, [courseSlug, loading]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      const [daysData, progressData] = await Promise.all([
        coursesAPI.getDaysBySlug(courseSlug!),
        coursesAPI.getProgressBySlug(courseSlug!).catch(() => null)
      ]);

      if (!daysData || daysData.length === 0) {
        setError("Дни курса не найдены");
        setLoading(false);
        return;
      }

      const sortedDays = [...daysData].sort((a, b) => a.order - b.order);
      setDays(sortedDays);
      setProgress(progressData);

    } catch (error: any) {
      console.error("Error loading course:", error);
      setError(error.message || "Ошибка загрузки курса");
    } finally {
      setLoading(false);
    }
  };

  const completeDay = async () => {
    if (!currentDay) return;

    try {
      setCompleting(true);

      await coursesAPI.completeDayBySlug(courseSlug!, currentDay.order, {
        responses: {},
        completed_at: new Date().toISOString(),
      });

      // Обновляем состояние дней
      const updatedDays = days.map(day =>
        day.order === currentDay.order ? { ...day, is_completed: true } : day
      );
      setDays(updatedDays);
      setCurrentDay(prev => prev ? { ...prev, is_completed: true } : null);

      // Получаем обновленный прогресс
      const newProgress = await coursesAPI.getProgressBySlug(courseSlug!);
      setProgress(newProgress);

      // Находим следующий день в обновленном списке
      const nextDay = updatedDays.find(d => d.order === currentDay.order + 1);

      if (nextDay) {
        navigate(`/learn/${courseSlug}/${nextDay.order}`);
      } else {
        setToast({ message: "Поздравляю! Курс пройден!", type: "success" });
        setTimeout(() => {
          navigate(`/courses`);
        }, 2000);
      }

    } catch (error: any) {
      console.error("Error completing day:", error);
      setToast({
        message: error.response?.data?.detail || "Ошибка при сохранении прогресса",
        type: "error"
      });
    } finally {
      setCompleting(false);
    }
  };

  const goToDay = (day: CourseDay, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/learn/${courseSlug}/${day.order}`);
  };

  const resetDay = async (dayOrder: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const confirmed = await vkApp.showConfirm(`Вы уверены, что хотите сбросить прогресс для Дня ${dayOrder}? Вы сможете пройти его заново.`);
    if (!confirmed) {
      return;
    }

    try {
      await coursesAPI.resetDayBySlug(courseSlug!, dayOrder);

      const updatedDays = days.map(day =>
        day.order === dayOrder ? { ...day, is_completed: false } : day
      );
      setDays(updatedDays);

      if (currentDay?.order === dayOrder) {
        setCurrentDay(prev => prev ? { ...prev, is_completed: false } : null);
      }

      const newProgress = await coursesAPI.getProgressBySlug(courseSlug!);
      setProgress(newProgress);

      setToast({ message: `День ${dayOrder} сброшен. Вы можете пройти его заново.`, type: "success" });
    } catch (error: any) {
      console.error("Error resetting day:", error);
      if (error.response?.status === 401) {
        setToast({ message: "Сессия истекла. Пожалуйста, войдите заново.", type: "error" });
        navigate('/login');
      } else {
        setToast({ message: "Ошибка при сбросе дня: " + (error.response?.data?.detail || error.message), type: "error" });
      }
    }
  };

  const progressPercentage = progress?.progress_percentage || 0;
  const completedCount = progress?.completed_days || 0;

  const getCourseTitle = () => {
    const titles: Record<string, string> = {
      v_compass_course: "Внутренний Компас",
      v_karta_ruin_course: "Карта Руин",
      v_profiling_course: "Векторный профайлинг",
      mini_course: "Честный старт",
    };
    return titles[courseSlug || ""] || "Курс";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-red-500 mb-4">Ошибка</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link to="/courses" className="text-[#C9A96E] hover:underline">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    );
  }

  if (!days.length || !currentDay) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-[#C9A96E] mb-4">Нет дней</h1>
          <p className="text-gray-400 mb-4">Для этого курса еще не добавлены дни</p>
          <Link to="/courses" className="text-[#C9A96E] hover:underline">
            Вернуться к курсам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <style>{`
        .course-learning-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          color: #A0A0A0;
        }

        .breadcrumb a {
          color: #C9A96E;
          text-decoration: none;
          transition: color 0.3s;
        }

        .breadcrumb a:hover {
          color: #E8D9B5;
        }

        .progress-section {
          background: #1A1A1A;
          border: 1px solid #707070;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: #A0A0A0;
        }

        .progress-bar-bg {
          height: 8px;
          background: #2A2A2A;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #C9A96E, #E8D9B5);
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .learning-grid {
          display: grid;
          grid-template-columns: 280px 1fr 360px;
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .learning-grid {
            grid-template-columns: 280px 1fr;
          }
          .ai-sidebar {
            grid-column: span 2;
            margin-top: 1.5rem;
          }
        }

        @media (max-width: 768px) {
          .learning-grid {
            grid-template-columns: 1fr;
          }
          .sidebar, .ai-sidebar {
            grid-column: span 1;
          }
          .course-learning-container {
            padding: 1rem;
          }
        }

        .sidebar {
          background: #1A1A1A;
          border: 1px solid #707070;
          border-radius: 8px;
          padding: 1.5rem;
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .sidebar-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #C9A96E;
          margin-bottom: 1.5rem;
          font-family: 'Cormorant Garamond', serif;
        }

        .days-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 60vh;
          overflow-y: auto;
        }

        .day-item {
          width: 100%;
          text-align: left;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #E8E6E1;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .day-item:hover {
          background: rgba(201, 169, 110, 0.1);
        }

        .day-item.active {
          background: rgba(201, 169, 110, 0.15);
          border-left: 3px solid #C9A96E;
        }

        .day-item.completed {
          opacity: 0.6;
        }

        .day-number {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .day-title {
          font-size: 0.8rem;
          color: #A0A0A0;
        }

        .day-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .check-icon {
          width: 18px;
          height: 18px;
          color: #4CAF50;
        }

        .reset-day-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
          border-radius: 4px;
          color: #C9A96E;
          transition: all 0.3s;
          opacity: 0;
        }

        .day-item:hover .reset-day-btn {
          opacity: 1;
        }

        .reset-day-btn:hover {
          background: rgba(201, 169, 110, 0.2);
          transform: scale(1.1);
        }

        .ai-sidebar {
          position: sticky;
          top: 100px;
          height: fit-content;
        }

        .content-area {
          background: #1A1A1A;
          border: 1px solid #707070;
          border-radius: 8px;
          padding: 2rem;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #707070;
        }

        .day-header h1 {
          font-size: 1.8rem;
          font-weight: 600;
          color: #C9A96E;
          font-family: 'Cormorant Garamond', serif;
          margin: 0;
        }

        .completed-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #4CAF50;
          font-size: 0.9rem;
        }

        .day-content {
          word-wrap: break-word;
        }

        .day-content h3 {
          font-size: 1.3rem;
          font-weight: 600;
          color: #C9A96E;
          margin: 1.5rem 0 1rem 0;
          font-family: 'Cormorant Garamond', serif;
        }

        .day-content h4 {
          font-size: 1.1rem;
          font-weight: 500;
          color: #E8D9B5;
          margin: 1rem 0 0.75rem 0;
        }

        .day-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: #E8E6E1;
        }

        .day-content ul,
        .day-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .day-content li {
          margin-bottom: 0.5rem;
          line-height: 1.6;
          color: #E8E6E1;
        }

        .day-content strong {
          color: #C9A96E;
          font-weight: 600;
        }

        .day-content em {
          font-style: italic;
          color: #E8D9B5;
        }

        .complete-button {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #707070;
        }

        .complete-button button {
          background: #C9A96E;
          color: #0A0A0A;
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .complete-button button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(201, 169, 110, 0.3);
        }

        .complete-button button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          animation: toastFadeIn 0.3s ease;
          max-width: 400px;
        }

        .toast-success {
          background: #1A1A1A;
          border: 1px solid #C9A96E;
          color: #E8D9B5;
        }

        .toast-error {
          background: #1A1A1A;
          border: 1px solid #ff4444;
          color: #ff6666;
        }

        @keyframes toastFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}

      <div className="course-learning-container">
        <div className="breadcrumb">
          <Link to="/">Главная</Link>
          <span>/</span>
          <Link to="/courses">Курсы</Link>
          <span>/</span>
          <span style={{ color: "#C9A96E" }}>{getCourseTitle()}</span>
          <span>/</span>
          <span style={{ color: "#C9A96E" }}>День {currentDay.order}</span>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>Прогресс курса</span>
            <span>{Math.round(progressPercentage)}% ({completedCount}/{days.length} дней)</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>

        <div className="learning-grid">
          <div className="sidebar">
            <h3 className="sidebar-title">Дни курса</h3>
            <div className="days-list">
              {days.map((day) => (
                <button
                  key={day.id}
                  onClick={(e) => goToDay(day, e)}
                  className={`day-item ${currentDay.order === day.order ? "active" : ""} ${day.is_completed ? "completed" : ""}`}
                >
                  <div>
                    <div className="day-number">День {day.order}</div>
                    <div className="day-title">{day.title}</div>
                  </div>
                  <div className="day-actions">
                    {day.is_completed && (
                      <>
                        <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <button
                          onClick={(e) => resetDay(day.order, e)}
                          className="reset-day-btn"
                          title="Пройти день заново"
                          aria-label="Сбросить прогресс дня"
                        >
                          ↺
                        </button>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="content-area">
            <div className="day-header">
              <h1>День {currentDay.order}: {currentDay.title}</h1>
              {currentDay.is_completed && (
                <div className="completed-badge">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Пройдено
                </div>
              )}
            </div>

            <div
              className="day-content"
              dangerouslySetInnerHTML={{ __html: currentDay.content }}
            />

            {!currentDay.is_completed && (
              <div className="complete-button">
                <button onClick={completeDay} disabled={completing}>
                  {completing ? "Сохранение..." : "Отметить как пройденный →"}
                </button>
              </div>
            )}
          </div>

          <div className="ai-sidebar">
            <ChatInterface
              courseId={progress?.course_id}
              courseSlug={courseSlug}
              dayOrder={currentDay?.order}
            />
          </div>
        </div>
      </div>
    </div>
  );
};