"use client";

import { useLanguage } from "./use-language";

const translations = {
  ru: {
    auth: {
      signInToAccount: "Войдите в свой аккаунт",
      email: "Электронная почта",
      password: "Пароль",
      signIn: "Войти",
      signingIn: "Вход...",
      invalidCredentials: "Неверные учетные данные",
    },
    dashboard: {
      topManagers: "Топ менеджеры",
      employees: "Сотрудники",
      noAccess: "Нет доступа",
      noAccessDescription: "У вас нет прав для просмотра этого раздела",
    },
    sidebar: {
      topManagers: "Топ менеджеры",
      employees: "Сотрудники",
      logout: "Выйти",
    },
    employees: {
      addEmployee: "Добавить сотрудника",
      editEmployee: "Редактировать сотрудника",
      notFound: "Сотрудники не найдены",
      tryChangingFilters: "Попробуйте изменить параметры поиска или фильтры",
    },
    profile: {
      settings: "Настройки профиля",
    },
    form: {
      name: "Имя",
      email: "Электронная почта",
      password: "Пароль",
      newPassword: "Новый пароль",
      phone: "Телефон",
      position: "Должность",
      birthday: "День рождения",
      role: "Роль",
      workerType: "Тип сотрудника",
      viewPermissions: "Права просмотра",
      order_id: "Порядок сортировки",
      hiddenFromList: "Скрыть из списка сотрудников",
      internalNumber: "Внутренний номер",
      internalNumberPlaceholder: "Например: 101, EXT-001",
      objectName: "Объект работы",
      objectNamePlaceholder: "Например: Офис Центр, Склад №1",
      photo: "Фотография",
      optional: "необязательно",
      passwordPlaceholder: "Оставьте пустым, чтобы не менять",
    },
    roles: {
      admin: "Администратор",
      worker: "Сотрудник",
    },
    workerTypes: {
      employee: "Обычный сотрудник",
      top_manager: "Топ менеджер",
    },
    viewPermissions: {
      both: "Все сотрудники",
      topManagers: "Только топ менеджеры",
      employees: "Только обычные сотрудники",
    },
    actions: {
      edit: "Редактировать",
      delete: "Удалить",
      cancel: "Отмена",
      save: "Сохранить",
      saving: "Сохранение...",
      add: "Добавить",
    },
    search: {
      placeholder: "Поиск сотрудников...",
    },
    sorting: {
      byOrder: "По порядку",
      byObject: "По объекту",
      byName: "По имени",
      byPosition: "По должности",
    },
    sort: {
      customOrder: "Пользовательский порядок",
      internalNumber: "По внутреннему номеру",
      objectName: "По объекту",
      upcomingBirthdays: "Ближайшие дни рождения",
      name: "По имени",
      position: "По должности",
    },
    filters: {
      title: "Фильтры",
      birthdays: "Дни рождения",
      filtersAndSorting: "Фильтры и сортировка",
      showHiddenUsers: "Показать скрытых сотрудников",
    },
    birthday: {
      title: "День рождения сегодня!",
      message: "Не забудьте поздравить именинников! 🎉",
      today: "Сегодня",
      tomorrow: "Завтра",
      inDays: "Через {days} дн.",
      daysLeft: "дн. до ДР",
      upcomingBirthdays: "Ближайшие дни рождения",
      noBirthdays: "Нет ближайших дней рождения",
      welcomeTitle: "Добро пожаловать!",
      welcomeSubtitle: "У нас есть особенные дни на этой неделе",
      todayBirthdays: "Дни рождения сегодня",
      upcomingThisWeek: "На этой неделе",
      dontForgetMessage: "Не забудьте поздравить коллег с днем рождения! 🎉",
      gotIt: "Понятно!",
      todayBirthday: "Сегодня день рождения! 🎂",
      todayBirthdayShort: "Сегодня! 🎂",
      tomorrowBirthday: "Завтра день рождения",
      daysUntilBirthday: "{days} дн. до ДР",
      congratulations: "С Днем Рождения!",
      congratulationsMessage: "Поздравляем тебя с твоим особенным днем!",
      birthdayWishes:
        "Желаем тебе здоровья, счастья и успехов во всех начинаниях!",
      enjoyYourDay: "Наслаждайся своим днем!",
      thankYou: "Спасибо!",
    },
    errors: {
      failedToAddUser: "Не удалось добавить пользователя",
      failedToUpdateUser: "Не удалось обновить пользователя",
      failedToDeleteUser: "Не удалось удалить пользователя",
      unknown: "Произошла неизвестная ошибка",
      fillAllLanguageFields: "Пожалуйста, заполните поля на русском и английском языках",
    },
    confirmations: {
      deleteUser: "Вы уверены, что хотите удалить этого пользователя?",
    },
    confirmDelete: "Вы уверены, что хотите удалить этого пользователя?",
    confirmDeleteDescription:
      "Это действие нельзя отменить. Пользователь {name} будет удален навсегда.",
    months: {
      january: "Январь",
      february: "Февраль",
      march: "Март",
      april: "Апрель",
      may: "Май",
      june: "Июнь",
      july: "Июль",
      august: "Август",
      september: "Сентябрь",
      october: "Октябрь",
      november: "Ноябрь",
      december: "Декабрь",
    },
  },
  en: {
    auth: {
      signInToAccount: "Sign in to your account",
      email: "Email",
      password: "Password",
      signIn: "Sign In",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid credentials",
    },
    dashboard: {
      topManagers: "Top Managers",
      employees: "Employees",
      noAccess: "No Access",
      noAccessDescription: "You don't have permission to view this section",
    },
    sidebar: {
      topManagers: "Top Managers",
      employees: "Employees",
      logout: "Logout",
    },
    employees: {
      addEmployee: "Add Employee",
      editEmployee: "Edit Employee",
      notFound: "No employees found",
      tryChangingFilters: "Try changing search parameters or filters",
    },
    profile: {
      settings: "Profile Settings",
    },
    form: {
      name: "Name",
      email: "Email",
      password: "Password",
      newPassword: "New Password",
      phone: "Phone",
      position: "Position",
      birthday: "Birthday",
      role: "Role",
      workerType: "Worker Type",
      viewPermissions: "View Permissions",
      order_id: "Sort Order",
      hiddenFromList: "Hide from employee list",
      internalNumber: "Internal Number",
      internalNumberPlaceholder: "e.g.: 101, EXT-001",
      objectName: "Work Object",
      objectNamePlaceholder: "e.g.: Office Center, Warehouse #1",
      photo: "Photo",
      optional: "optional",
      passwordPlaceholder: "Leave empty to keep current",
    },
    roles: {
      admin: "Administrator",
      worker: "Worker",
    },
    workerTypes: {
      employee: "Employee",
      top_manager: "Top Manager",
    },
    viewPermissions: {
      both: "All Employees",
      topManagers: "Top Managers Only",
      employees: "Employees Only",
    },
    actions: {
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      saving: "Saving...",
      add: "Add",
    },
    search: {
      placeholder: "Search employees...",
    },
    sorting: {
      byOrder: "By Order",
      byObject: "By Object",
      byName: "By Name",
      byPosition: "By Position",
    },
    sort: {
      customOrder: "Custom Order",
      internalNumber: "By Internal Number",
      objectName: "By Object",
      upcomingBirthdays: "Upcoming Birthdays",
      name: "By Name",
      position: "By Position",
    },
    filters: {
      title: "Filters",
      birthdays: "Birthdays",
      filtersAndSorting: "Filters and Sorting",
      showHiddenUsers: "Show hidden users",
    },
    birthday: {
      title: "Birthday Today!",
      message: "Don't forget to congratulate the birthday celebrants! 🎉",
      today: "Today",
      tomorrow: "Tomorrow",
      inDays: "In {days} days",
      daysLeft: "days until BD",
      upcomingBirthdays: "Upcoming Birthdays",
      noBirthdays: "No upcoming birthdays",
      welcomeTitle: "Welcome!",
      welcomeSubtitle: "We have special days this week",
      todayBirthdays: "Birthdays Today",
      upcomingThisWeek: "This Week",
      dontForgetMessage: "Don't forget to congratulate your colleagues! 🎉",
      gotIt: "Got it!",
      todayBirthday: "Birthday today! 🎂",
      todayBirthdayShort: "Today! 🎂",
      tomorrowBirthday: "Birthday tomorrow",
      daysUntilBirthday: "{days} days until BD",
      congratulations: "Happy Birthday!",
      congratulationsMessage: "Congratulations on your special day!",
      birthdayWishes:
        "We wish you health, happiness and success in all your endeavors!",
      enjoyYourDay: "Enjoy your day!",
      thankYou: "Thank you!",
    },
    errors: {
      failedToAddUser: "Failed to add user",
      failedToUpdateUser: "Failed to update user",
      failedToDeleteUser: "Failed to delete user",
      unknown: "An unknown error occurred",
      fillAllLanguageFields: "Please fill in fields for both Russian and English",
    },
    confirmations: {
      deleteUser: "Are you sure you want to delete this user?",
    },
    confirmDelete: "Are you sure you want to delete this user?",
    confirmDeleteDescription:
      "This action cannot be undone. User {name} will be permanently deleted.",
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
    },
  },
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split(".");
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value === "string" && params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value || key;
  };

  return { t };
}
