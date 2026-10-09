"use strict";

function calculatePool(length, width, shallow, deep) {
  if (![length, width, shallow, deep].every(value => Number.isFinite(value) && value > 0)) {
    throw new Error("أدخل أرقامًا صحيحة أكبر من صفر لجميع الأبعاد.");
  }
  if (deep < shallow) {
    throw new Error("يجب أن يكون العمق العميق أكبر من العمق الضحل أو مساويًا له.");
  }
  const averageDepth = shallow / 2 + deep / 2;
  const volume = length * width * averageDepth;
  const floor = width * Math.hypot(length, deep - shallow);
  const walls = (length + width) * (shallow + deep);
  const total = floor + walls;
  const liters = volume * 1000;
  if (![volume, floor, walls, total, liters].every(Number.isFinite)) {
    throw new Error("الأبعاد كبيرة جدًا. أدخل أبعادًا أصغر.");
  }
  return { averageDepth, volume, floor, walls, total, liters };
}

if (typeof document !== "undefined") {
  const form = document.getElementById("pool-form");
  const results = document.getElementById("results");
  const error = document.getElementById("error");
  const format = new Intl.NumberFormat("ar", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function updateResults() {
    try {
      const values = ["length", "width", "shallow", "deep"].map(name => form.elements.namedItem(name).valueAsNumber);
      const quantities = calculatePool(...values);
      for (const name of ["averageDepth", "volume", "floor", "walls", "total"]) {
        document.getElementById(name).textContent = format.format(quantities[name]);
      }
      document.getElementById("liters").textContent = `${format.format(quantities.liters)} لتر`;
      error.hidden = true;
      results.hidden = false;
    } catch (problem) {
      error.textContent = problem.message;
      error.hidden = false;
      results.hidden = true;
    }
  }
  form.addEventListener("input", updateResults);
  form.addEventListener("submit", event => {
    event.preventDefault();
    updateResults();
  });
  updateResults();
}

if (typeof module !== "undefined") module.exports = { calculatePool };
