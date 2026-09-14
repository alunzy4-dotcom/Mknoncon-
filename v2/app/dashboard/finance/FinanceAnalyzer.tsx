"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Expense = {
  id: string;
  name: string;
  category: string;
  amount: number;
};

const categories = ["سكن", "تمويل", "فواتير", "غذاء", "نقل", "صحة", "تعليم", "ترفيه", "ادخار", "أخرى"];
const palette = ["#163a5f", "#2d6a8a", "#4f89a8", "#7da5b8", "#ad8540", "#7c6f5b", "#9d7d61", "#315f72", "#5c7480", "#8b9aa0"];

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function money(value: number) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(value || 0);
}

export default function FinanceAnalyzer({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [month, setMonth] = useState(currentMonth());
  const [budgetId, setBudgetId] = useState<string | null>(null);
  const [salary, setSalary] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("تمويل");
  const [amount, setAmount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const { data: budget, error } = await supabase
      .from("salary_budgets")
      .select("id,salary,savings_goal")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle();

    if (error) {
      setMessage("تعذر تحميل البيانات المالية.");
      setLoading(false);
      return;
    }

    if (!budget) {
      setBudgetId(null);
      setSalary(0);
      setSavingsGoal(0);
      setExpenses([]);
      setLoading(false);
      return;
    }

    setBudgetId(budget.id);
    setSalary(Number(budget.salary || 0));
    setSavingsGoal(Number(budget.savings_goal || 0));

    const { data: rows, error: expensesError } = await supabase
      .from("salary_expenses")
      .select("id,name,category,amount")
      .eq("budget_id", budget.id)
      .order("created_at", { ascending: true });

    if (expensesError) setMessage("تم تحميل الميزانية، لكن تعذر تحميل بعض المصروفات.");
    setExpenses((rows || []).map((row) => ({ ...row, amount: Number(row.amount || 0) })) as Expense[]);
    setLoading(false);
  }, [month, supabase, userId]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  async function saveBudget(showMessage = true) {
    setSaving(true);
    const { data, error } = await supabase
      .from("salary_budgets")
      .upsert(
        { user_id: userId, month, salary: Number(salary || 0), savings_goal: Number(savingsGoal || 0) },
        { onConflict: "user_id,month" }
      )
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      setMessage("تعذر حفظ الراتب والهدف الادخاري.");
      return null;
    }
    setBudgetId(data.id);
    if (showMessage) setMessage("تم الحفظ بنجاح.");
    return data.id as string;
  }

  async function submitExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || amount <= 0) {
      setMessage("أدخل اسم المصروف ومبلغًا أكبر من صفر.");
      return;
    }

    setSaving(true);
    const id = budgetId || (await saveBudget(false));
    if (!id) {
      setSaving(false);
      return;
    }

    if (editingId) {
      const { data, error } = await supabase
        .from("salary_expenses")
        .update({ name: name.trim(), category, amount: Number(amount) })
        .eq("id", editingId)
        .eq("user_id", userId)
        .select("id,name,category,amount")
        .single();
      if (!error && data) {
        setExpenses((old) => old.map((x) => (x.id === editingId ? { ...data, amount: Number(data.amount) } as Expense : x)));
        setMessage("تم تعديل المصروف.");
      } else setMessage("تعذر تعديل المصروف.");
    } else {
      const { data, error } = await supabase
        .from("salary_expenses")
        .insert({ budget_id: id, user_id: userId, name: name.trim(), category, amount: Number(amount) })
        .select("id,name,category,amount")
        .single();
      if (!error && data) {
        setExpenses((old) => [...old, { ...data, amount: Number(data.amount) } as Expense]);
        setMessage("تمت إضافة المصروف.");
      } else setMessage("تعذر إضافة المصروف.");
    }

    setName("");
    setAmount(0);
    setEditingId(null);
    setSaving(false);
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setName(expense.name);
    setCategory(expense.category);
    setAmount(expense.amount);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeExpense(id: string) {
    const { error } = await supabase.from("salary_expenses").delete().eq("id", id).eq("user_id", userId);
    if (error) setMessage("تعذر حذف المصروف.");
    else {
      setExpenses((old) => old.filter((x) => x.id !== id));
      setMessage("تم حذف المصروف.");
    }
  }

  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const balance = salary - totalExpenses;
  const savingsRate = salary > 0 ? (balance / salary) * 100 : 0;
  const goalGap = Math.max(0, savingsGoal - Math.max(0, balance));

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((item) => map.set(item.category, (map.get(item.category) || 0) + item.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const pieBackground = useMemo(() => {
    if (totalExpenses <= 0) return "#e8e3da";
    let cursor = 0;
    const stops = categoryTotals.map(([_, value], index) => {
      const start = cursor;
      cursor += (value / totalExpenses) * 100;
      return `${palette[index % palette.length]} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${stops.join(",")})`;
  }, [categoryTotals, totalExpenses]);

  const recommendation = balance < 0
    ? `العجز الحالي ${money(Math.abs(balance))}. ابدأ بأكبر بند متغير قبل إضافة التزامات جديدة.`
    : goalGap > 0
      ? `أنت بحاجة إلى خفض المصروفات أو زيادة الدخل بمقدار ${money(goalGap)} للوصول لهدف الادخار.`
      : balance > 0
        ? `وضعك الشهري موجب. الفائض المتوقع ${money(balance)} ويمكن تخصيصه للادخار أو سداد الالتزامات الأعلى كلفة.`
        : "أدخل الراتب والمصروفات للحصول على توصية مالية.";

  return (
    <div className="finance-page">
      <section className="panel finance-hero no-print">
        <div>
          <p className="eyebrow">أداة مالية</p>
          <h1>حاسبة الراتب والمصروفات</h1>
          <p className="muted">تحليل شهري محفوظ في حسابك، مع توزيع المصروفات وتوقع الفائض أو العجز.</p>
        </div>
        <div className="finance-actions">
          <button className="btn alt" type="button" onClick={() => window.print()}>تصدير PDF / طباعة</button>
        </div>
      </section>

      {message && <div className="notice no-print">{message}</div>}

      <section className="finance-grid">
        <div className="panel">
          <h2>بيانات الشهر</h2>
          <div className="finance-input-grid">
            <div className="field">
              <label>الشهر</label>
              <input type="month" value={month.slice(0, 7)} onChange={(e) => setMonth(`${e.target.value}-01`)} />
            </div>
            <div className="field">
              <label>الدخل / الراتب</label>
              <input type="number" min="0" value={salary || ""} onChange={(e) => setSalary(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>هدف الادخار</label>
              <input type="number" min="0" value={savingsGoal || ""} onChange={(e) => setSavingsGoal(Number(e.target.value))} />
            </div>
          </div>
          <button className="btn no-print" disabled={saving} type="button" onClick={() => void saveBudget(true)}>{saving ? "جاري الحفظ..." : "حفظ بيانات الشهر"}</button>
        </div>

        <div className="finance-summary">
          <div className="metric"><span>الدخل</span><strong>{money(salary)}</strong></div>
          <div className="metric"><span>المصروفات</span><strong>{money(totalExpenses)}</strong></div>
          <div className={`metric ${balance < 0 ? "danger" : "good"}`}><span>{balance < 0 ? "العجز" : "الفائض"}</span><strong>{money(Math.abs(balance))}</strong></div>
          <div className="metric"><span>نسبة الفائض</span><strong>{savingsRate.toFixed(1)}%</strong></div>
        </div>
      </section>

      <section className="panel no-print">
        <h2>{editingId ? "تعديل مصروف" : "إضافة مصروف"}</h2>
        <form className="expense-form" onSubmit={submitExpense}>
          <div className="field"><label>اسم المصروف</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: قسط التمويل العقاري" /></div>
          <div className="field"><label>التصنيف</label><select value={category} onChange={(e) => setCategory(e.target.value)}>{categories.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>المبلغ</label><input type="number" min="0" step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <div className="expense-buttons"><button className="btn" disabled={saving} type="submit">{editingId ? "حفظ التعديل" : "إضافة"}</button>{editingId && <button className="btn alt" type="button" onClick={() => { setEditingId(null); setName(""); setAmount(0); }}>إلغاء</button>}</div>
        </form>
      </section>

      <section className="finance-grid">
        <div className="panel">
          <h2>المصروفات</h2>
          {loading ? <p className="muted">جاري التحميل...</p> : !expenses.length ? <p className="muted">لا توجد مصروفات لهذا الشهر.</p> : (
            <div className="expense-list">
              {expenses.map((item) => (
                <div className="expense-row" key={item.id}>
                  <div><strong>{item.name}</strong><small>{item.category}</small></div>
                  <strong>{money(item.amount)}</strong>
                  <div className="row-actions no-print"><button type="button" onClick={() => startEdit(item)}>تعديل</button><button type="button" onClick={() => void removeExpense(item.id)}>حذف</button></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>توزيع الفئات</h2>
          <div className="finance-chart-wrap">
            <div className="finance-pie" style={{ background: pieBackground }} aria-label="رسم توزيع المصروفات" />
            <div className="legend">
              {categoryTotals.map(([label, value], index) => <div key={label}><i style={{ background: palette[index % palette.length] }} /><span>{label}</span><strong>{money(value)}</strong></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="panel finance-advice">
        <p className="eyebrow">قراءة سريعة</p>
        <h2>{recommendation}</h2>
        {balance > 0 && <div className="projection"><span>بعد 3 أشهر بنفس المستوى: <strong>{money(balance * 3)}</strong></span><span>بعد 6 أشهر: <strong>{money(balance * 6)}</strong></span><span>بعد سنة: <strong>{money(balance * 12)}</strong></span></div>}
      </section>
    </div>
  );
}
