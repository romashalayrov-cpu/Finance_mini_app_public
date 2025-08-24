/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// --- Type Definitions ---
interface WebApp {
  ready: () => void;
  expand: () => void;
}

interface Telegram {
  WebApp: WebApp;
}

declare global {
  interface Window {
    Telegram?: Telegram;
  }
}

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface AppState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
}

// --- Mock Data ---
const initialTransactions: Transaction[] = [
    { id: '1', type: 'income', amount: 45000, description: 'Зарплата', category: 'Работа', date: new Date().toISOString() },
    { id: '2', type: 'expense', amount: 1250, description: 'Продукты', category: 'Еда', date: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', type: 'expense', amount: 350, description: 'Кофе', category: 'Еда', date: new Date(Date.now() - 172800000).toISOString() },
    { id: '4', type: 'expense', amount: 500, description: 'Такси', category: 'Транспорт', date: new Date(Date.now() - 259200000).toISOString() },
];

const paymentData = {
  payment_methods: [ { type: "bank_card", name: "Банковская карта", card_number: "1234 5678 9012 3456", cardholder_name: "IVAN PETROV", bank_name: "Сбербанк" }, { type: "sbp", name: "Система быстрых платежей (СБП)", phone: "+7 (900) 123-45-67", bank_name: "Сбербанк" }, { type: "yoomoney", name: "ЮMoney", wallet: "410012345678901" } ],
  tariffs: { monthly: { name: "Месячная подписка", price: 250, description: "Доступ ко всем функциям на 1 месяц" }, quarterly: { name: "Квартальная подписка", price: 700, description: "Экономия 100₽" }, yearly: { name: "Годовая подписка", price: 2000, description: "Экономия 600₽" } },
};

// --- App Context for State Management ---
const AppContext = createContext<AppState | null>(null);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'date'>) => {
    const newTransaction: Transaction = {
      ...tx,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  return (
    <AppContext.Provider value={{ transactions, addTransaction }}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};

// --- Helper Functions ---
const formatCurrency = (value: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

// --- Screens & Components ---

const DashboardScreen: React.FC<{ onAddTransaction: (type: TransactionType) => void }> = ({ onAddTransaction }) => {
  const { transactions } = useAppContext();
  
  const { balance, monthlyIncome, monthlyExpense } = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let balance = 0;

    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (tx.type === 'income') {
        balance += tx.amount;
        if (txDate >= firstDayOfMonth) monthlyIncome += tx.amount;
      } else {
        balance -= tx.amount;
        if (txDate >= firstDayOfMonth) monthlyExpense += tx.amount;
      }
    });
    return { balance, monthlyIncome, monthlyExpense };
  }, [transactions]);

  return (
    <>
      <header className="header"><h1>Мои Финансы</h1></header>
      <section className="balance-card" aria-label="Текущий баланс">
        <div className="label">Текущий баланс</div>
        <p className="amount">{formatCurrency(balance)}</p>
      </section>
      <section className="summary-grid" aria-label="Сводка за месяц">
        <div className="summary-card income"><div className="label">Доходы (месяц)</div><p className="amount">{formatCurrency(monthlyIncome)}</p></div>
        <div className="summary-card expense"><div className="label">Расходы (месяц)</div><p className="amount">{formatCurrency(monthlyExpense)}</p></div>
      </section>
      <section className="actions-grid" aria-label="Быстрые действия">
        <button className="action-button" onClick={() => onAddTransaction('income')}><span>+</span> Доход</button>
        <button className="action-button" onClick={() => onAddTransaction('expense')}><span>-</span> Расход</button>
      </section>
    </>
  );
};

const HistoryScreen: React.FC = () => {
    const { transactions } = useAppContext();

    return (
        <>
            <header className="header"><h1>История</h1></header>
            <div className="history-list">
                {transactions.length === 0 ? (
                    <p className="empty-state">Транзакций пока нет.</p>
                ) : (
                    transactions.map(tx => (
                        <div key={tx.id} className="history-item">
                            <div className="icon" aria-hidden="true">{tx.category.slice(0, 1)}</div>
                            <div className="details">
                                <span className="description">{tx.description}</span>
                                <span className="category">{tx.category}</span>
                            </div>
                            <div className={`amount ${tx.type}`}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                <span className="date">{formatDate(tx.date)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};

const ProfileScreen: React.FC = () => {
  const [selectedTariff, setSelectedTariff] = useState<string | null>(null);
  const handleTariffClick = (tariffKey: string) => setSelectedTariff(prev => (prev === tariffKey ? null : tariffKey));

  return (
    <>
      <header className="header"><h1>Профиль</h1></header>
      <section className="profile-card">
        <div className="label">Текущий план</div><div className="status">Бесплатный</div>
      </section>
      <h2 className="section-title">Выбрать тариф</h2>
      <div className="tariffs-container">
        {Object.entries(paymentData.tariffs).map(([key, tariff]) => (
          <div key={key} className={`tariff-card ${selectedTariff === key ? 'selected' : ''}`} onClick={() => handleTariffClick(key)} role="button" tabIndex={0} aria-expanded={selectedTariff === key}>
            <div className="tariff-header"><span className="name">{tariff.name}</span><span className="price">{formatCurrency(tariff.price)}</span></div>
            <p className="tariff-description">{tariff.description}</p>
            <div className="payment-details">
              {paymentData.payment_methods.map(method => (
                <div key={method.type} className="payment-method">
                  <p className="name">{method.name}</p>
                  <div className="payment-info">
                    {method.type === 'bank_card' && `Карта: ${method.card_number}\nПолучатель: ${method.cardholder_name}`}
                    {method.type === 'sbp' && `Телефон: ${method.phone} (${method.bank_name})`}
                    {method.type === 'yoomoney' && `Кошелек: ${method.wallet}`}
                  </div>
                </div>
              ))}
              <button className="action-button confirm-payment-btn" onClick={(e) => { e.stopPropagation(); alert('После оплаты администратор проверит платеж и активирует подписку.'); }}>Я оплатил</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

const AddTransactionModal: React.FC<{ type: TransactionType; onClose: () => void }> = ({ type, onClose }) => {
    const { addTransaction } = useAppContext();
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !description || !category) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        addTransaction({ type, amount: parseFloat(amount), description, category });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Новый {type === 'income' ? 'доход' : 'расход'}</h2>
                <form onSubmit={handleSubmit}>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Сумма" required className="form-input" />
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Описание (напр. 'Кофе')" required className="form-input" />
                    <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="Категория (напр. 'Еда')" required className="form-input" />
                    <button type="submit" className="action-button confirm-payment-btn">Добавить</button>
                </form>
            </div>
        </div>
    );
};

// --- Navigation ---
type Screen = 'dashboard' | 'history' | 'profile';

const TabBar: React.FC<{ activeScreen: Screen; setActiveScreen: (screen: Screen) => void }> = ({ activeScreen, setActiveScreen }) => (
  <nav className="tab-bar">
    <button className={`tab-button ${activeScreen === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveScreen('dashboard')}><span className="icon">🏠</span><span>Главная</span></button>
    <button className={`tab-button ${activeScreen === 'history' ? 'active' : ''}`} onClick={() => setActiveScreen('history')}><span className="icon">🧾</span><span>История</span></button>
    <button className={`tab-button ${activeScreen === 'profile' ? 'active' : ''}`} onClick={() => setActiveScreen('profile')}><span className="icon">👤</span><span>Профиль</span></button>
  </nav>
);

// --- Main App Component ---
const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<TransactionType>('expense');

  useEffect(() => {
    window.Telegram?.WebApp?.ready();
    window.Telegram?.WebApp?.expand();
  }, []);

  const handleAddTransaction = (type: TransactionType) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  
  const renderScreen = () => {
    switch (activeScreen) {
        case 'dashboard': return <DashboardScreen onAddTransaction={handleAddTransaction} />;
        case 'history': return <HistoryScreen />;
        case 'profile': return <ProfileScreen />;
        default: return <DashboardScreen onAddTransaction={handleAddTransaction} />;
    }
  };

  return (
    <AppProvider>
        <div className="app-container">
            {renderScreen()}
            <TabBar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
            {isModalOpen && <AddTransactionModal type={modalType} onClose={() => setIsModalOpen(false)} />}
        </div>
    </AppProvider>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
