"use client";

import { useMemo, useState } from "react";

type CustomerType = "employee" | "retired";
type FinancingType = "consumer" | "mortgage";

function money(value: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
}

function pct(value: number | null) {
  return value == null ? "—" : `${(value * 100).toFixed(value === 0.3333 ? 2 : 0)}%`;
}

export default function MortgageCalculator() {
  const [customerType, setCustomerType] = useState<CustomerType>("employee");
  const [financingType, setFinancingType] = useState<FinancingType>("mortgage");
  const [grossSalary, setGrossSalary] = useState(0);
  const [otherIncome, setOtherIncome] = useState(0);
  const [housingSupport, setHousingSupport] = useState(0);
  const [hasHousingSupport, setHasHousingSupport] = useState(false);
  const [consumerSalaryDeductions, setConsumerSalaryDeductions] = useState(0);
  const [otherNonMortgageObligations, setOtherNonMortgageObligations] = useState(0);
  const [existingMortgageObligations, setExistingMortgageObligations] = useState(0);
  const [bankPolicyPercent, setBankPolicyPercent] = useState(0);

  const result = useMemo(() => {
    const salary = Math.max(0, grossSalary || 0);
    const regularIncome = Math.max(0, otherIncome || 0);
    const support = financingType === "mortgage" && hasHousingSupport
      ? Math.max(0, housingSupport || 0)
      : 0;

    const totalIncome = salary + regularIncome + support;
    const salaryDeductionRatio = customerType === "retired" ? 0.25 : 0.3333;
    const salaryDeductionCap = salary * salaryDeductionRatio;

    const consumerFromSalary = Math.max(0, consumerSalaryDeductions || 0);
    const otherNonMortgage = Math.max(0, otherNonMortgageObligations || 0);
    const existingMortgage = Math.max(0, existingMortgageObligations || 0);
    const nonMortgageExisting = consumerFromSalary + otherNonMortgage;
    const allExisting = nonMortgageExisting + existingMortgage;

    const salaryDeductionRemaining = Math.max(0, salaryDeductionCap - consumerFromSalary);
    const salaryDeductionExceeded = consumerFromSalary > salaryDeductionCap;

    let fixedNonMortgageRatio: number | null = null;
    if (totalIncome < 25000) fixedNonMortgageRatio = 0.45;
    else if (bankPolicyPercent > 0) fixedNonMortgageRatio = bankPolicyPercent / 100;

    const nonMortgageCap = fixedNonMortgageRatio == null ? null : totalIncome * fixedNonMortgageRatio;
    const nonMortgageRemaining = nonMortgageCap == null ? null : Math.max(0, nonMortgageCap - nonMortgageExisting);
    const nonMortgageExceeded = nonMortgageCap == null ? false : nonMortgageExisting > nonMortgageCap;

    let totalRatio: number | null = null;
    let ruleLabel = "";

    if (financingType === "mortgage") {
      if (totalIncome <= 15000) {
        totalRatio = hasHousingSupport ? 0.65 : 0.55;
        ruleLabel = hasHousingSupport
          ? "دخل 15,000 ريال فأقل مع دعم سكني موثق: الحد الشامل 65%."
          : "دخل 15,000 ريال فأقل: الحد الشامل 55%.";
      } else if (totalIncome < 25000) {
        totalRatio = 0.65;
        ruleLabel = "دخل أكثر من 15,000 وأقل من 25,000 ريال: الحد الشامل 65%.";
      } else if (bankPolicyPercent > 0) {
        totalRatio = bankPolicyPercent / 100;
        ruleLabel = "دخل 25,000 ريال فأكثر: النسبة المدخلة هي سياسة الممول وليست نسبة ثابتة من ساما.";
      } else {
        ruleLabel = "دخل 25,000 ريال فأكثر: ساما لا تضع نسبة شاملة ثابتة؛ يلزم إدخال نسبة سياسة الممول.";
      }
    }

    const totalCap = totalRatio == null ? null : totalIncome * totalRatio;
    const totalRemaining = totalCap == null ? null : Math.max(0, totalCap - allExisting);
    const totalExceeded = totalCap == null ? false : allExisting > totalCap;

    let availableNewInstallment: number | null;
    if (financingType === "consumer") {
      if (nonMortgageRemaining == null) availableNewInstallment = salaryDeductionRemaining;
      else availableNewInstallment = Math.max(0, Math.min(salaryDeductionRemaining, nonMortgageRemaining));
    } else {
      availableNewInstallment = totalRemaining;
    }

    return {
      totalIncome,
      salaryDeductionRatio,
      salaryDeductionCap,
      salaryDeductionRemaining,
      salaryDeductionExceeded,
      fixedNonMortgageRatio,
      nonMortgageCap,
      nonMortgageRemaining,
      nonMortgageExceeded,
      totalRatio,
      totalCap,
      totalRemaining,
      totalExceeded,
      allExisting,
      availableNewInstallment,
      ruleLabel
    };
  }, [
    bankPolicyPercent,
    consumerSalaryDeductions,
    customerType,
    existingMortgageObligations,
    financingType,
    grossSalary,
    hasHousingSupport,
    housingSupport,
    otherIncome,
    otherNonMortgageObligations
  ]);

  const needsBankPolicy = result.totalIncome >= 25000 && bankPolicyPercent <= 0;

  return (
    <div className="mortgage-calculator">
      <section className="panel mortgage-intro">
        <p className="eyebrow">وفق مبادئ التمويل المسؤول للأفراد</p>
        <h1>حاسبة نسبة الاستقطاع والقدرة التمويلية</h1>
        <p className="muted">
          تحسب حدود الاستقطاع النظامية بحسب نوع العميل، شريحة الدخل، وجود التمويل العقاري والدعم السكني الموثق.
        </p>
      </section>

      <section className="panel">
        <h2>بيانات العميل</h2>
        <div className="mortgage-input-grid">
          <div className="field">
            <label>حالة العميل</label>
            <select value={customerType} onChange={(e) => setCustomerType(e.target.value as CustomerType)}>
              <option value="employee">موظف</option>
              <option value="retired">متقاعد</option>
            </select>
          </div>
          <div className="field">
            <label>نوع التمويل المطلوب</label>
            <select value={financingType} onChange={(e) => setFinancingType(e.target.value as FinancingType)}>
              <option value="consumer">استهلاكي / غير عقاري</option>
              <option value="mortgage">عقاري أو عقاري + استهلاكي</option>
            </select>
          </div>
          <div className="field">
            <label>{customerType === "retired" ? "المعاش الإجمالي" : "الراتب الإجمالي"}</label>
            <input type="number" min="0" value={grossSalary || ""} onChange={(e) => setGrossSalary(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>دخل شهري منتظم موثق آخر</label>
            <input type="number" min="0" value={otherIncome || ""} onChange={(e) => setOtherIncome(Number(e.target.value))} />
          </div>
        </div>

        {financingType === "mortgage" && (
          <div className="support-box">
            <label className="check-row">
              <input type="checkbox" checked={hasHousingSupport} onChange={(e) => setHasHousingSupport(e.target.checked)} />
              <span>العميل مستفيد من دعم سكني حكومي موثق تعاقديًا لمنتج التمويل العقاري</span>
            </label>
            {hasHousingSupport && (
              <div className="field support-amount">
                <label>مبلغ الدعم الشهري</label>
                <input type="number" min="0" value={housingSupport || ""} onChange={(e) => setHousingSupport(Number(e.target.value))} />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>الالتزامات الشهرية الحالية</h2>
        <div className="mortgage-input-grid">
          <div className="field">
            <label>تمويل استهلاكي مرتبط بالاستقطاع من الراتب/المعاش</label>
            <input type="number" min="0" value={consumerSalaryDeductions || ""} onChange={(e) => setConsumerSalaryDeductions(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>التزامات أخرى غير عقارية</label>
            <input type="number" min="0" value={otherNonMortgageObligations || ""} onChange={(e) => setOtherNonMortgageObligations(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>أقساط عقارية قائمة</label>
            <input type="number" min="0" value={existingMortgageObligations || ""} onChange={(e) => setExistingMortgageObligations(Number(e.target.value))} />
          </div>
          {result.totalIncome >= 25000 && (
            <div className="field">
              <label>نسبة سياسة الممول %</label>
              <input type="number" min="0" max="100" step="0.01" placeholder="تدخل من سياسة البنك" value={bankPolicyPercent || ""} onChange={(e) => setBankPolicyPercent(Number(e.target.value))} />
              <small className="muted">ليست نسبة ثابتة مقررة من ساما.</small>
            </div>
          )}
        </div>
      </section>

      <section className="mortgage-results">
        <div className="metric">
          <span>إجمالي الدخل المحتسب</span>
          <strong>{money(result.totalIncome)}</strong>
          {financingType === "mortgage" && hasHousingSupport && <small>يشمل الدعم السكني الموثق</small>}
        </div>
        <div className={`metric ${result.salaryDeductionExceeded ? "danger" : "good"}`}>
          <span>حد الاستقطاع من الراتب/المعاش</span>
          <strong>{pct(result.salaryDeductionRatio)} = {money(result.salaryDeductionCap)}</strong>
          <small>المتبقي ضمن هذا الحد: {money(result.salaryDeductionRemaining)}</small>
        </div>
        <div className={`metric ${result.nonMortgageExceeded ? "danger" : ""}`}>
          <span>حد الالتزامات غير العقارية</span>
          <strong>{result.nonMortgageCap == null ? "وفق سياسة الممول" : `${pct(result.fixedNonMortgageRatio)} = ${money(result.nonMortgageCap)}`}</strong>
          <small>{result.nonMortgageRemaining == null ? "لا توجد نسبة ثابتة لهذه الشريحة" : `المتبقي: ${money(result.nonMortgageRemaining)}`}</small>
        </div>
        {financingType === "mortgage" && (
          <div className={`metric ${result.totalExceeded ? "danger" : result.totalCap != null ? "good" : ""}`}>
            <span>الحد الشامل مع العقاري</span>
            <strong>{result.totalCap == null ? "يتطلب سياسة الممول" : `${pct(result.totalRatio)} = ${money(result.totalCap)}`}</strong>
            <small>إجمالي الالتزامات الحالية: {money(result.allExisting)}</small>
          </div>
        )}
      </section>

      <section className={`panel mortgage-answer ${result.availableNewInstallment != null && result.availableNewInstallment > 0 ? "good-answer" : ""}`}>
        <p className="eyebrow">النتيجة التقديرية</p>
        <h2>
          {needsBankPolicy && financingType === "mortgage"
            ? "أدخل نسبة سياسة الممول لإكمال حساب الحد العقاري لهذه الشريحة."
            : <>أقصى قسط جديد متاح تقريبًا: <strong>{money(result.availableNewInstallment ?? 0)}</strong></>}
        </h2>
        <p>{result.ruleLabel}</p>
        {result.salaryDeductionExceeded && <p className="warning-text">تنبيه: الاستقطاع الاستهلاكي المرتبط بالراتب/المعاش يتجاوز الحد المحدد لهذه الفئة.</p>}
        {result.nonMortgageExceeded && <p className="warning-text">تنبيه: الالتزامات غير العقارية الحالية تتجاوز الحد المحتسب.</p>}
        {result.totalExceeded && <p className="warning-text">تنبيه: إجمالي الالتزامات الحالية يتجاوز الحد الشامل المحتسب.</p>}
      </section>

      <section className="panel sama-note">
        <h2>ملاحظات نظامية</h2>
        <ul>
          <li>33.33% للموظف و25% للمتقاعد تخص الالتزامات المرتبطة بالاستقطاع الشهري من إجمالي الراتب أو المعاش.</li>
          <li>للدخل الأقل من 25,000 ريال، الالتزامات غير العقارية لا تتجاوز 45% من إجمالي الدخل الشهري.</li>
          <li>للدخل 15,000 ريال فأقل، الحد الشامل 55%، ويرتفع إلى 65% للمستفيد من الدعم السكني الموثق في منتجات التمويل العقاري.</li>
          <li>للدخل أكثر من 15,000 وأقل من 25,000 ريال، الحد الشامل 65%.</li>
          <li>للدخل 25,000 ريال فأكثر، تخضع الالتزامات لسياسة الممول الائتمانية وتقييم القدرة على السداد؛ لا توجد نسبة شاملة ثابتة من ساما.</li>
        </ul>
        <p className="muted">النتيجة استرشادية ولا تمثل موافقة ائتمانية أو عرض تمويل ملزم.</p>
        <div className="source-links">
          <a href="https://rulebook.sama.gov.sa/ar/%D8%A7%D9%84%D9%81%D8%B5%D9%84-%D8%A7%D9%84%D8%B1%D8%A7%D8%A8%D8%B9-%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D8%AF%D8%A6-%D8%A7%D9%84%D9%83%D9%85%D9%8A%D8%A9-%D9%84%D9%84%D8%AA%D9%85%D9%88%D9%8A%D9%84-%D8%A7%D9%84%D9%85%D8%B3%D8%A4%D9%88%D9%84" target="_blank" rel="noreferrer">المصدر: الفصل الرابع من مبادئ التمويل المسؤول — ساما</a>
          <a href="https://rulebook.sama.gov.sa/ar/%D8%AA%D8%B9%D8%AF%D9%8A%D9%84-%D9%85%D8%A8%D8%A7%D8%AF%D8%A6-%D8%A7%D9%84%D8%AA%D9%85%D9%88%D9%8A%D9%84-%D8%A7%D9%84%D9%85%D8%B3%D8%A4%D9%88%D9%84-%D9%84%D9%84%D8%A3%D9%81%D8%B1%D8%A7%D8%AF" target="_blank" rel="noreferrer">المصدر: تعديل احتساب الدعم السكني — ساما</a>
        </div>
      </section>
    </div>
  );
}
