import React, { useState, useEffect } from 'react';
import { Plus, Minus, Send, Wallet, ArrowUpRight, ArrowDownRight, Activity, History, Tag, Calendar, Trash2, Coffee, ShoppingBag, Home, Car, HeartPulse, Zap, DollarSign, Briefcase, Gift, MoreHorizontal, X, Receipt, ChevronRight, Check } from 'lucide-react';

type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
}

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw7N3_BlNWm4u-PAU3KNXxw4i2mEfipuI_MEXIuIxRY1JQ2kGDMwpCkp2z552z5IiKovQ/exec';

const EXPENSE_CATEGORIES = ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Compras', 'Otros'];
const INCOME_CATEGORIES = ['Salario', 'Negocio', 'Transferencia', 'Inversiones', 'Otros'];

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getMonthString = (date: string | Date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Desconocido';
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${month} ${year}`;
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => getMonthString(new Date()));
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const uniqueMonths = Array.from(new Set(transactions.map(t => getMonthString(t.date))));
  const availableMonths = uniqueMonths.length > 0 ? uniqueMonths : [getMonthString(new Date())];
  
  // Sort available months chronologically (newest first)
  availableMonths.sort((a, b) => {
    if (a === 'Desconocido') return 1;
    if (b === 'Desconocido') return -1;
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const monthIndexA = MONTH_NAMES.indexOf(monthA);
    const monthIndexB = MONTH_NAMES.indexOf(monthB);
    const dateA = new Date(parseInt(yearA), monthIndexA, 1);
    const dateB = new Date(parseInt(yearB), monthIndexB, 1);
    return dateB.getTime() - dateA.getTime();
  });

  const fetchTransactions = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    try {
      const response = await fetch(SCRIPT_URL);
      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch transactions on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Touch handlers for pull-to-refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY > 0 && window.scrollY === 0) {
      const y = e.touches[0].clientY;
      const distance = y - startY;
      if (distance > 0) {
        // Add resistance to the pull
        setPullDistance(Math.min(distance * 0.5, 120));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      setIsRefreshing(true);
      fetchTransactions(true);
    }
    setStartY(0);
    setPullDistance(0);
  };

  // Handle scroll to toggle compact header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update category list when type changes
  useEffect(() => {
    setCategory(type === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
  }, [type]);

  const filteredTransactions = transactions.filter(t => getMonthString(t.date) === selectedMonth);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setIsSubmitting(true);
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description,
      amount: parseFloat(amount),
      type,
      category,
    };

    // Optimistic update
    setTransactions([newTransaction, ...transactions]);
    setAmount('');
    setDescription('');
    setIsModalOpen(false);

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(newTransaction),
      });
    } catch (error) {
      console.error("Error saving transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    const dObj = new Date(date);
    if (isNaN(dObj.getTime())) return String(date);
    const d = dObj.getDate().toString().padStart(2, '0');
    const m = (dObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dObj.getFullYear().toString().slice(-2);
    return `${d}-${m}-${y}`;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Focus the amount input after scrolling
    setTimeout(() => {
      document.getElementById('amount')?.focus();
    }, 300);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Comida': return <Coffee size={20} className="text-orange-500" />;
      case 'Compras': return <ShoppingBag size={20} className="text-purple-500" />;
      case 'Servicios': return <Zap size={20} className="text-yellow-500" />;
      case 'Transporte': return <Car size={20} className="text-blue-500" />;
      case 'Salud': return <HeartPulse size={20} className="text-rose-500" />;
      case 'Salario': return <Briefcase size={20} className="text-emerald-500" />;
      case 'Negocio': return <DollarSign size={20} className="text-emerald-500" />;
      case 'Transferencia': return <ArrowUpRight size={20} className="text-pink-500" />;
      default: return <Tag size={20} className="text-zinc-500 dark:text-zinc-400" />;
    }
  };

  const getCategoryBg = (cat: string) => {
    switch (cat) {
      case 'Comida': return 'bg-orange-100 dark:bg-orange-500/10';
      case 'Compras': return 'bg-purple-100 dark:bg-purple-500/10';
      case 'Servicios': return 'bg-yellow-100 dark:bg-yellow-500/10';
      case 'Transporte': return 'bg-blue-100 dark:bg-blue-500/10';
      case 'Salud': return 'bg-rose-100 dark:bg-rose-500/10';
      case 'Salario': 
      case 'Negocio': return 'bg-emerald-100 dark:bg-emerald-500/10';
      case 'Transferencia': return 'bg-pink-100 dark:bg-pink-500/10';
      default: return 'bg-zinc-100 dark:bg-zinc-500/10';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Seguro que quieres borrar esta transacción?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  return (
    <div 
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-blue-500/30 pb-12"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Pull to refresh indicator */}
      <div 
        className="fixed left-0 right-0 flex justify-center items-center z-[60] pointer-events-none transition-transform duration-200"
        style={{ 
          top: 'max(env(safe-area-inset-top), 16px)',
          marginTop: '-40px',
          transform: `translateY(${isRefreshing ? 40 : Math.max(0, pullDistance - 20)}px)` 
        }}
      >
        <div className={`bg-white dark:bg-zinc-800 rounded-full p-2.5 shadow-md border border-zinc-200 dark:border-zinc-700 transition-opacity duration-200 ${pullDistance > 10 || isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
          <Activity size={20} className={`text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
        </div>
      </div>

      {/* Sticky Top Section */}
      <div className="sticky top-0 z-50 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-xl px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-6 transition-all duration-300">
        <div className="max-w-md mx-auto">
          
          {/* Dashboard Card */}
          <div className={`bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 relative overflow-hidden transition-all duration-300 ${isScrolled ? 'p-4' : 'p-6'}`}>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              {/* Compact View (Scrolled) */}
              <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                <div className="flex items-center gap-2 sm:gap-4 w-full min-w-0">
                  <div className="flex items-center gap-2 shrink min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold tracking-tighter truncate">
                      {formatCurrency(balance)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 ml-auto shrink min-w-0">
                    <div className="flex items-center gap-0.5 shrink min-w-0">
                      <ArrowUpRight size={14} className="text-emerald-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink min-w-0">
                      <ArrowDownRight size={14} className="text-rose-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{formatCurrency(totalExpense)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full View (Top) */}
              <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Balance Actual</p>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tighter mb-6">
                  {formatCurrency(balance)}
                </h2>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 text-emerald-500">
                      <ArrowUpRight size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">Ingresos</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(totalIncome)}
                    </p>
                  </div>
                  
                  <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 sm:mx-0"></div>
                  
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center gap-1 text-rose-500">
                      <ArrowDownRight size={16} strokeWidth={2.5} />
                      <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider">Gastos</span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(totalExpense)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-w-md mx-auto px-4 sm:px-6 md:px-8 space-y-6 relative z-0">

        {/* History Section */}
        <div className="pt-2">
          <div className="mb-6 flex flex-col gap-3">
            <button 
              onClick={() => setIsMonthModalOpen(true)}
              className="flex items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors px-5 py-4 rounded-3xl shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 w-full"
            >
              <History size={24} className="text-blue-500" strokeWidth={2.5} />
              <span className="font-bold tracking-wide text-base uppercase text-zinc-900 dark:text-zinc-100">
                HISTORIAL DE {selectedMonth}
              </span>
              <ChevronRight size={20} className="text-zinc-400 ml-auto" strokeWidth={2.5} />
            </button>
            <div className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 px-2">
              <Activity size={16} />
              <span>{filteredTransactions.length} transacciones</span>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center opacity-60">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Cargando transacciones...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center opacity-40">
              <Receipt size={64} strokeWidth={1} className="mb-4" />
              <p className="text-sm font-medium">Sin transacciones</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-4">
                  
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getCategoryBg(t.category)}`}>
                    {getCategoryIcon(t.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate text-base">
                        {t.description}
                      </p>
                      <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 shrink-0 ml-2">
                        <span className={t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}>
                          {t.type === 'income' ? '+' : '-'}
                        </span>
                        ${t.amount.toFixed(2)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                      <span>{formatDate(t.date)}</span>
                      <span>•</span>
                      <span className="truncate">{t.category}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0 ml-1"
                  >
                    <Trash2 size={18} />
                  </button>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 sm:right-1/2 sm:translate-x-[180px] z-40 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center hover:bg-blue-600 transition-transform active:scale-95"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Month Selection Modal */}
      {isMonthModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => setIsMonthModalOpen(false)}
          />
          
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-[101] bg-zinc-50 dark:bg-zinc-950 rounded-t-[32px] shadow-2xl transform transition-transform duration-300 flex flex-col max-h-[90vh] sm:max-w-md sm:mx-auto">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={() => setIsMonthModalOpen(false)}>
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="w-8" /> {/* Spacer for centering */}
              <h2 className="text-lg font-semibold">Seleccionar Mes</h2>
              <button 
                onClick={() => setIsMonthModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto pb-safe">
              <div className="space-y-2">
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setIsMonthModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className={`text-lg font-medium ${selectedMonth === month ? 'text-blue-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                      {month}
                    </span>
                    {selectedMonth === month && (
                      <Check size={20} className="text-blue-500" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* iOS Bottom Sheet Modal for New Transaction */}
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-[101] bg-zinc-50 dark:bg-zinc-950 rounded-t-[32px] shadow-2xl transform transition-transform duration-300 flex flex-col max-h-[90vh] sm:max-w-md sm:mx-auto">
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={() => setIsModalOpen(false)}>
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="w-8" /> {/* Spacer for centering */}
              <h2 className="text-lg font-semibold">Nueva transacción</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
            
            {/* Form Content */}
            <div className="p-6 overflow-y-auto pb-safe">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Type Selector */}
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      type === 'expense' 
                        ? 'bg-white dark:bg-zinc-700 text-rose-500 shadow-sm' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Minus size={16} strokeWidth={3} />
                    Gasto
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      type === 'income' 
                        ? 'bg-white dark:bg-zinc-700 text-emerald-500 shadow-sm' 
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Plus size={16} strokeWidth={3} />
                    Ingreso
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                      Cantidad
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-zinc-400 font-medium">$</span>
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        className="block w-full pl-8 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-lg font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                      Descripción
                    </label>
                    <textarea
                      id="description"
                      inputMode="text"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                      placeholder="Ej. Supermercado, Salario..."
                      required
                      rows={1}
                      className="block w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-base font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none overflow-hidden min-h-[56px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                      Categoría
                    </label>
                    <div className="relative">
                      <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="block w-full px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-base font-medium text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                      >
                        {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-zinc-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !amount || !description}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      Registrar
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
