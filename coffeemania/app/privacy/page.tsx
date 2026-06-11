"use client";

import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-tertiary-fixed flex flex-col">
      <SiteHeader />

      <main className="px-8 py-14 md:py-20">
        <div className="max-w-4xl mx-auto bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-8 md:p-12 shadow-sm">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary tracking-tight">
            Политика конфиденциальности
          </h1>

          <section className="mt-10 space-y-8 text-on-surface-variant leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-primary mb-4">1. Общие положения</h2>
              <div className="space-y-3">
                <p>
                  Настоящая Политика конфиденциальности (далее — «Политика») описывает, какие данные
                  собирает VPN-сервис (далее — «Сервис»), с какой целью они используются и как
                  хранятся. Используя Сервис, Пользователь соглашается с условиями настоящей Политики.
                </p>
                <p>
                  Сервис предоставляет доступ к VPN-подключению через Telegram-бота. Оплата услуг
                  осуществляется через платёжный сервис ЮКасса.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">2. Какие данные мы собираем</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">2.1. Данные, которые мы собираем</h3>
                  <p className="mb-2">При использовании Сервиса мы собираем следующие данные:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <span className="font-semibold text-primary">Telegram ID</span> — уникальный
                      идентификатор пользователя в Telegram, необходимый для функционирования бота и
                      привязки подписки к аккаунту.
                    </li>
                    <li>
                      <span className="font-semibold text-primary">IP-адрес</span> — технические данные,
                      фиксируемые при подключении к VPN-серверам.
                    </li>
                    <li>
                      <span className="font-semibold text-primary">Объём переданного трафика</span> —
                      суммарное количество данных, прошедших через сервер (без анализа содержимого).
                      Конкретные сайты, запросы или содержимое трафика не регистрируются.
                    </li>
                    <li>
                      <span className="font-semibold text-primary">HWID устройства (Hardware ID)</span> —
                      уникальный идентификатор устройства, передаваемый клиентским приложением.
                      Используется для функции отслеживания устройств, подключённых к подписке.
                      Подробнее о сборе HWID — в политике конфиденциальности соответствующего
                      клиентского приложения.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">
                    2.2. Данные, которые мы НЕ собираем
                  </h3>
                  <p className="mb-2">Сервис не собирает и не хранит:</p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>историю посещённых сайтов и DNS-запросы;</li>
                    <li>содержимое передаваемого трафика;</li>
                    <li>
                      платёжные данные (номера карт, реквизиты) — они обрабатываются исключительно
                      платёжным сервисом ЮКасса в соответствии с их политикой конфиденциальности.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-primary mb-2">2.3. Подтверждение оплаты</h3>
                  <p>
                    Сервис получает от ЮКасса только факт подтверждения или отклонения платежа.
                    Платёжные реквизиты, данные карт и банковская информация Пользователя Сервису не
                    передаются и не хранятся на серверах Сервиса.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">3. Как мы используем данные</h2>
              <p className="mb-2">Собранные данные используются строго в следующих целях:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <span className="font-semibold text-primary">Telegram ID</span> — для идентификации
                  пользователя, управления подпиской через бота и вызова функций сервиса.
                </li>
                <li>
                  <span className="font-semibold text-primary">IP-адрес</span> — для обеспечения работы
                  VPN-соединения и технической поддержки.
                </li>
                <li>
                  <span className="font-semibold text-primary">Объём трафика</span> — для мониторинга
                  нагрузки на серверы, выявления технических проблем и планирования мощностей. Анализ
                  содержимого трафика не производится.
                </li>
                <li>
                  <span className="font-semibold text-primary">HWID устройства</span> — для реализации
                  функции ограничения и отслеживания устройств, одновременно подключённых в рамках одной
                  подписки.
                </li>
                <li>
                  <span className="font-semibold text-primary">Факт оплаты</span> — для активации и
                  продления подписки.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">4. Передача данных третьим лицам</h2>
              <p className="mb-2">
                Сервис не продаёт, не передаёт и не раскрывает персональные данные Пользователей третьим
                лицам, за исключением следующих случаев:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  по требованию уполномоченных государственных органов в порядке, предусмотренном
                  действующим законодательством;
                </li>
                <li>
                  в объёме, необходимом для обеспечения работы платёжного сервиса ЮКасса (только
                  подтверждение факта транзакции).
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">5. Хранение данных</h2>
              <div className="space-y-3">
                <p>Все данные хранятся на серверах Сервиса в зашифрованном виде.</p>
                <p>
                  Данные хранятся бессрочно в течение всего периода использования Сервиса
                  Пользователем.
                </p>
                <p>
                  По письменному запросу Пользователя все его данные могут быть удалены. Удаление данных
                  влечёт прекращение действия договора и невозможность дальнейшего использования
                  Сервиса. Запрос на удаление данных следует направлять через Telegram-бота или иным
                  указанным способом связи.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">6. Безопасность данных</h2>
              <p>
                Сервис принимает технические и организационные меры для защиты данных от
                несанкционированного доступа, изменения, раскрытия или уничтожения. Данные хранятся в
                зашифрованном виде на защищённых серверах.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">7. Изменение Политики</h2>
              <p>
                Сервис вправе в одностороннем порядке вносить изменения в настоящую Политику.
                Актуальная версия публикуется в Telegram-боте и/или на официальном канале. Продолжение
                использования Сервиса после публикации изменений означает согласие с новой редакцией
                Политики.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-primary mb-4">8. Контакт</h2>
              <p>
                По всем вопросам, связанным с обработкой персональных данных, в том числе для подачи
                запроса на удаление данных, обращайтесь через ссылку поддержки в разделе Telegram-бота.
              </p>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
