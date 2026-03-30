"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed">
      <nav className="sticky top-0 z-50 bg-[#fbf9f5] dark:bg-[#1b1c1a] border-none shadow-none">
        <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">
          <Link
            className="flex items-center gap-2 text-2xl font-serif font-bold text-[#271310] dark:text-[#ffffff]"
            href="/"
          >
            <img src="/logo.svg" alt="Логотип" className="w-8 h-8 object-contain" />
            <div>
              <span className="bg-orange-200 dark:bg-orange-300 px-1 text-[#271310]">КОФЕМАНИЯ</span> ВПН
            </div>
          </Link>
          <Link
            className="bg-primary text-on-primary px-6 py-2 rounded-full font-bold hover:scale-105 active:scale-95 transition-all"
            href="/profile"
          >
            Личный кабинет
          </Link>
        </div>
        <div className="bg-surface-container dark:bg-[#2a2a28] h-px w-full" />
      </nav>

      <main className="px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Политика конфиденциальности
          </h1>
          <p className="mt-4 text-on-surface-variant">
            Настоящая политика определяет принципы обработки и защиты информации пользователей сервиса
            Coffee Mania VPN. Используя сервис, пользователь подтверждает ознакомление с данной
            политикой и согласие на обработку данных в пределах, необходимых для предоставления услуг.
          </p>

          <section className="mt-10 space-y-6 text-on-surface-variant leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-primary">1. Состав обрабатываемых данных</h2>
              <p>
                Сервис обрабатывает регистрационные данные (включая адрес электронной почты), технические
                сведения о сессиях, данные о транзакциях и служебные параметры, необходимые для
                функционирования личного кабинета, оплаты и предоставления ключей доступа.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">2. Цели обработки</h2>
              <p>
                Данные обрабатываются для создания и сопровождения учетной записи, исполнения договора
                оказания услуг VPN-доступа, обеспечения информационной безопасности, технической
                поддержки, предотвращения злоупотреблений и соблюдения обязательных требований права.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">3. Правовые основания</h2>
              <p>
                Обработка осуществляется на основании согласия пользователя, необходимости исполнения
                договорных обязательств, а также законных интересов оператора в части защиты сервиса и
                инфраструктуры.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">4. Cookies и авторизация</h2>
              <p>
                Для поддержания авторизованной сессии используются технические cookies (включая токены
                доступа). Отключение таких cookies может привести к ограничению функциональности личного
                кабинета и невозможности использования части сервисов.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">5. Передача третьим лицам</h2>
              <p>
                Передача данных третьим лицам ограничивается случаями, необходимыми для исполнения
                платежных и инфраструктурных операций (например, платежным провайдерам и сервисам
                хостинга), а также случаями, прямо предусмотренными законодательством.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">6. Сроки хранения и защита</h2>
              <p>
                Данные хранятся не дольше, чем это необходимо для заявленных целей обработки либо в сроки,
                установленные нормативными требованиями. Оператор применяет разумные организационные и
                технические меры для защиты данных от утраты, изменения и несанкционированного доступа.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">7. Права пользователя</h2>
              <p>
                Пользователь вправе запрашивать уточнение, обновление и удаление своих данных в пределах,
                допускаемых применимым правом, а также направлять обращения по вопросам обработки данных
                через каналы поддержки сервиса.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary">8. Изменение политики</h2>
              <p>
                Оператор вправе вносить изменения в настоящую политику. Актуальная редакция публикуется на
                данной странице и вступает в силу с момента размещения, если иное не предусмотрено
                законодательством.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
