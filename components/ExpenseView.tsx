import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { DollarSign, Trash2, UserPlus, Plus, TrendingUp, X, PieChart as PieIcon, List, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatMoney } from '../utils/travelLibrary';

interface ExpenseViewProps {
  expenses: Expense[];
  companions: string[];
  onAddExpense: (expense: Expense) => void;
  onRemoveExpense: (id: string) => void;
  onUpdateCompanions: (newCompanions: string[], renames: Record<string, string>) => void;
  currencyCode?: string;
  exchangeRate?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ExpenseView: React.FC<ExpenseViewProps> = ({ 
    expenses, 
    companions,
    onAddExpense, 
    onRemoveExpense,
    onUpdateCompanions,
    currencyCode = 'TWD',
    exchangeRate = 1
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
      description: '',
      amount: 0,
      payer: companions[0] || '我',
      date: new Date().toISOString().split('T')[0]
  });

  const [isManageCompanionsOpen, setIsManageCompanionsOpen] = useState(false);
  const [tempCompanions, setTempCompanions] = useState<string[]>([...companions]);
  const [newCompanionName, setNewCompanionName] = useState('');

  // Calculations
  const totalAmount = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  const totalTWD = useMemo(() => totalAmount * exchangeRate, [totalAmount, exchangeRate]);

  // Chart Data: Expenses by Payer
  const dataByPayer = useMemo(() => {
      const map: Record<string, number> = {};
      expenses.forEach(e => {
          map[e.payer] = (map[e.payer] || 0) + e.amount;
      });
      return Object.keys(map).map(key => ({ name: key, value: map[key] }));
  }, [expenses]);

  // Handlers
  const handleAdd = () => {
      if (!newExpense.description || !newExpense.amount) return;
      onAddExpense({
          id: Date.now().toString(),
          description: newExpense.description,
          amount: Number(newExpense.amount),
          payer: newExpense.payer || companions[0],
          date: newExpense.date || new Date().toISOString().split('T')[0]
      });
      setNewExpense({ ...newExpense, description: '', amount: 0 });
  };

  const handleSaveCompanions = () => {
      onUpdateCompanions(tempCompanions, {});
      setIsManageCompanionsOpen(false);
  };

  const addCompanion = () => {
      if(newCompanionName && !tempCompanions.includes(newCompanionName)) {
          setTempCompanions([...tempCompanions, newCompanionName]);
          setNewCompanionName('');
      }
  };

  const removeCompanion = (name: string) => {
      if(window.confirm(`確定要移除 ${name} 嗎？`)) {
          setTempCompanions(tempCompanions.filter(c => c !== name));
      }
  };

  return (
    <div className="pb-64 pt-4 px-4 bg-gray-50 min-h-full">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10">
              <p className="text-teal-100 text-sm font-bold mb-1">總支出 ({currencyCode})</p>
              <h2 className="text-4xl font-black mb-1">{formatMoney(totalAmount, currencyCode === 'TWD' ? 'NT$' : '$')}</h2>
              {currencyCode !== 'TWD' && (
                  <p className="text-teal-200 text-sm font-medium">
                      ≈ NT$ {formatMoney(totalTWD, '')} (匯率 {exchangeRate})
                  </p>
              )}
          </div>
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
              <DollarSign className="w-40 h-40" />
          </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
          <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <List className="w-4 h-4"/> 列表
              </button>
              <button 
                  onClick={() => setViewMode('chart')}
                  className={`p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'chart' ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <PieIcon className="w-4 h-4"/> 圖表
              </button>
          </div>
          <button 
              onClick={() => { setTempCompanions(companions); setIsManageCompanionsOpen(true); }}
              className="text-teal-600 text-sm font-bold flex items-center gap-1 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-teal-50"
          >
              <UserPlus className="w-4 h-4"/> 管理成員
          </button>
      </div>

      {/* Chart View */}
      {viewMode === 'chart' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6 h-80">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-teal-500"/> 支出分佈 (依墊付人)</h3>
              {expenses.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={dataByPayer}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              fill="#8884d8"
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {dataByPayer.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatMoney(value, currencyCode === 'TWD' ? 'NT$' : '$')} />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <p>尚無支出資料</p>
                  </div>
              )}
          </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
          <div className="space-y-3 mb-24">
              {expenses.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                      <p>點擊下方按鈕新增第一筆支出</p>
                  </div>
              ) : (
                  expenses.map((expense) => (
                      <div key={expense.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                                  {expense.payer.substring(0, 1)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-gray-800">{expense.description}</h4>
                                  <p className="text-xs text-gray-500">{expense.date} • {expense.payer} 墊付</p>
                              </div>
                          </div>
                          <div className="text-right">
                              <p className="font-black text-gray-800">{formatMoney(expense.amount, '')}</p>
                              <button onClick={() => onRemoveExpense(expense.id)} className="text-gray-300 hover:text-red-400 mt-1">
                                  <Trash2 className="w-4 h-4"/>
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>
      )}

      {/* Add Expense Form (Fixed Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 bg-gray-50/80 backdrop-blur-md z-10 max-w-md mx-auto border-t border-gray-200">
          <div className="bg-white rounded-3xl shadow-xl p-4 border border-teal-100">
              <div className="grid grid-cols-4 gap-2 mb-2">
                  <input 
                      className="col-span-2 bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="項目 (如: 晚餐)"
                      value={newExpense.description}
                      onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  />
                  <input 
                      type="number"
                      className="col-span-2 bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 text-right"
                      placeholder="金額"
                      value={newExpense.amount || ''}
                      onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})}
                  />
              </div>
              <div className="flex gap-2">
                  <select 
                      className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 flex-1"
                      value={newExpense.payer}
                      onChange={e => setNewExpense({...newExpense, payer: e.target.value})}
                  >
                      {companions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button 
                      onClick={handleAdd}
                      className="bg-teal-600 text-white rounded-xl px-6 py-2 font-bold shadow-lg hover:bg-teal-700 active:scale-95 transition-all"
                  >
                      <Plus className="w-5 h-5"/>
                  </button>
              </div>
          </div>
      </div>

      {/* Manage Companions Modal */}
      {isManageCompanionsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsManageCompanionsOpen(false)}/>
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl">
                  <h3 className="text-xl font-black text-gray-800 mb-4">管理分帳成員</h3>
                  
                  <div className="flex gap-2 mb-4">
                      <input 
                          className="flex-1 bg-gray-50 rounded-xl px-4 py-2 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-teal-500"
                          placeholder="輸入名字"
                          value={newCompanionName}
                          onChange={e => setNewCompanionName(e.target.value)}
                      />
                      <button onClick={addCompanion} className="bg-teal-100 text-teal-700 px-4 rounded-xl font-bold hover:bg-teal-200">
                          新增
                      </button>
                  </div>

                  <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                      {tempCompanions.map(person => (
                          <div key={person} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                              <span className="font-bold text-gray-700">{person}</span>
                              {person !== '我' && (
                                  <button onClick={() => removeCompanion(person)} className="text-gray-400 hover:text-red-500">
                                      <X className="w-5 h-5"/>
                                  </button>
                              )}
                          </div>
                      ))}
                  </div>

                  <button onClick={handleSaveCompanions} className="w-full bg-teal-600 text-white font-bold py-3 rounded-xl shadow-lg">
                      完成
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ExpenseView;