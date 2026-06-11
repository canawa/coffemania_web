export default function HelpContent() {
  return (
    <div className="max-w-5xl bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm">
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
        Помощь (ЧАВО)
      </h1>
      <p className="mt-4 text-on-surface-variant">
        Краткие ответы на самые частые вопросы по подключению, оплате и работе кабинета.
      </p>

      <section className="mt-10 space-y-6 text-on-surface-variant">
        <div className="rounded-xl bg-surface-container-low p-5">
          <h2 className="text-lg font-bold text-primary">Как получить подписку?</h2>
          <p className="mt-2">
            В личном кабинете нажмите «Купить подписку», ознакомьтесь с информацией о платеже
            и нажмите «Оплатить!». После успешной оплаты через ЮKassa подписка появится автоматически.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <h2 className="text-lg font-bold text-primary">Как подключиться в приложении Amnezia?</h2>
          <p className="mt-2">
            Откройте приложение, нажмите «+», вставьте ссылку подписки, нажмите Continue и затем Connect.
            Подробная инструкция доступна на странице «Guide».
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <h2 className="text-lg font-bold text-primary">Почему не проходит вход в кабинет?</h2>
          <p className="mt-2">
            Проверьте корректность email/пароля и включены ли cookies в браузере.
            Если проблема не исчезает, обратитесь в поддержку.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <h2 className="text-lg font-bold text-primary">Как работает реферальная программа?</h2>
          <p className="mt-2">
            Вы создаете авторский промокод один раз и делитесь им с друзьями.
            На странице «Реферальная программа» отображаются количество депозитов по коду и их сумма.
          </p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <h2 className="text-lg font-bold text-primary">Куда писать, если нужна помощь?</h2>
          <p className="mt-2">
            Telegram: <span className="font-bold text-primary">@coffeemaniasup2</span> или
            страница «Поддержка».
          </p>
        </div>
      </section>
    </div>
  );
}
