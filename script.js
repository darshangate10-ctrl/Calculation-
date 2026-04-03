// --- State Management ---
let state = {
    incomeSources: [],
    expenses: [],
    taxRate: 0,
    theme: 'light'
};

// --- DOM Elements ---
const incomeListEl = document.getElementById('income-list');
const expenseListEl = document.getElementById('expense-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const taxDeductedEl = document.getElementById('tax-deducted');
const balanceEl = document.getElementById('remaining-balance');
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const topCategoryEl = document.getElementById('top-category-name');
const insightsEl = document.getElementById('insights');

// --- Initialization ---
function init() {
    loadData();
    applyTheme();
    updateDashboard();
    initChart();
}

// --- LocalStorage ---
function saveData() {
    localStorage.setItem('budgetData', JSON.stringify(state));
}

function loadData() {
    const saved = localStorage.getItem('budgetData');
    if (saved) {
        state = JSON.parse(saved);
        // Ensure theme is loaded
        if (!state.theme) state.theme = 'light';
        // Hydrate tax rate input
        document.getElementById('tax-rate-input').value = state.taxRate;
    }
}

// --- Theme Management ---
function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    themeIcon.name = state.theme === 'dark' ? 'sunny-outline' : 'moon-outline';
}

themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveData();
});

// --- Chart setup ---
let myChart;
function initChart() {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    // Default categories
    const categories = ['Food', 'Rent', 'Travel', 'Utilities', 'Entertainment', 'Others'];
    const data = categories.map(cat => {
        return state.expenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);
    });

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#94a3b8'],
                borderWidth: 0,
                hoverOffset: 12
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: state.theme === 'dark' ? '#f1f5f9' : '#1e293b',
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return ` ${label}: ₹${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function updateChart() {
    if (!myChart) return;
    const categories = ['Food', 'Rent', 'Travel', 'Utilities', 'Entertainment', 'Others'];
    const data = categories.map(cat => {
        return state.expenses
            .filter(e => e.category === cat)
            .reduce((sum, e) => sum + Number(e.amount), 0);
    });
    myChart.data.datasets[0].data = data;
    myChart.update();
}

// --- Dashboard Logic ---
function updateDashboard() {
    const totalIncome = state.incomeSources.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalExpenses = state.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const taxDeducted = (totalIncome * state.taxRate) / 100;
    const balance = totalIncome - totalExpenses - taxDeducted;

    totalIncomeEl.innerText = `₹${totalIncome.toLocaleString()}`;
    totalExpensesEl.innerText = `₹${totalExpenses.toLocaleString()}`;
    taxDeductedEl.innerText = `₹${taxDeducted.toLocaleString()}`;
    balanceEl.innerText = `₹${balance.toLocaleString()}`;

    // Percentages
    const expPercent = totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : 0;
    document.getElementById('expense-percentage').innerText = `${expPercent}% of income`;
    document.getElementById('tax-percentage-label').innerText = `${state.taxRate}% rate`;

    // Analytics
    updateAnalytics();
    renderLists();
    updateChart();
}

function updateAnalytics() {
    if (state.expenses.length === 0) {
        topCategoryEl.innerText = "—";
        insightsEl.innerText = "Add expenses to see insights.";
        return;
    }

    const categories = ['Food', 'Rent', 'Travel', 'Utilities', 'Entertainment', 'Others'];
    const totals = categories.map(cat => ({
        name: cat,
        total: state.expenses.filter(e => e.category === cat).reduce((sum, e) => sum + Number(e.amount), 0)
    }));

    const top = totals.reduce((prev, current) => (prev.total > current.total) ? prev : current);
    topCategoryEl.innerText = `${top.name} (₹${top.total.toLocaleString()})`;

    const totalIncome = state.incomeSources.reduce((sum, s) => sum + Number(s.amount), 0);
    const percent = totalIncome > 0 ? ((top.total / totalIncome) * 100).toFixed(1) : 0;
    
    if (totalIncome > 0) {
        insightsEl.innerText = `You are spending ${percent}% of your income on ${top.name}.`;
    } else {
        insightsEl.innerText = `Budget carefully! You spend the most on ${top.name}.`;
    }
}

// --- List Rendering ---
function renderLists() {
    // Income
    incomeListEl.innerHTML = '';
    state.incomeSources.forEach((source, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="item-info">
                <h4>${source.name}</h4>
                <div class="text-muted">₹${source.amount.toLocaleString()}</div>
            </div>
            <div class="item-actions">
                <button onclick="deleteIncome(${index})" class="delete-btn btn-ghost">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        `;
        incomeListEl.appendChild(div);
    });

    // Expenses
    expenseListEl.innerHTML = '';
    state.expenses.forEach((expense, index) => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.innerHTML = `
            <div class="item-info">
                <h4>${expense.name}</h4>
                <div class="text-muted">₹${expense.amount.toLocaleString()} • ${expense.category}</div>
            </div>
            <div class="item-actions">
                <button onclick="deleteExpense(${index})" class="delete-btn btn-ghost">
                    <ion-icon name="trash-outline"></ion-icon>
                </button>
            </div>
        `;
        expenseListEl.appendChild(div);
    });
}

// --- Event Listeners ---

// Add Income
document.getElementById('add-income').addEventListener('click', () => {
    const nameEl = document.getElementById('income-source');
    const amountEl = document.getElementById('income-amount');
    
    if (nameEl.value && amountEl.value > 0) {
        state.incomeSources.push({ name: nameEl.value, amount: Number(amountEl.value) });
        nameEl.value = '';
        amountEl.value = '';
        saveData();
        updateDashboard();
    }
});

// Add Expense
document.getElementById('add-expense').addEventListener('click', () => {
    const nameEl = document.getElementById('expense-name');
    const amountEl = document.getElementById('expense-amount-input');
    const catEl = document.getElementById('expense-category');

    if (nameEl.value && amountEl.value > 0) {
        state.expenses.push({ 
            name: nameEl.value, 
            amount: Number(amountEl.value), 
            category: catEl.value 
        });
        nameEl.value = '';
        amountEl.value = '';
        saveData();
        updateDashboard();
    }
});

// Tax Rate Change
document.getElementById('tax-rate-input').addEventListener('input', (e) => {
    state.taxRate = Number(e.target.value) || 0;
    saveData();
    updateDashboard();
});

// Deletion
window.deleteIncome = (index) => {
    state.incomeSources.splice(index, 1);
    saveData();
    updateDashboard();
};

window.deleteExpense = (index) => {
    state.expenses.splice(index, 1);
    saveData();
    updateDashboard();
};

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset all data for this month?")) {
        state.incomeSources = [];
        state.expenses = [];
        state.taxRate = 0;
        document.getElementById('tax-rate-input').value = 0;
        saveData();
        updateDashboard();
    }
});

// PDF Download
document.getElementById('download-btn').addEventListener('click', () => {
    const element = document.getElementById('report-content');
    element.style.display = 'block';

    // Populate data
    const totalIncome = state.incomeSources.reduce((sum, s) => sum + Number(s.amount), 0);
    const totalExpenses = state.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const taxDeducted = (totalIncome * state.taxRate) / 100;
    const balance = totalIncome - totalExpenses - taxDeducted;

    document.getElementById('pdf-income').innerText = `₹${totalIncome.toLocaleString()}`;
    document.getElementById('pdf-expenses').innerText = `₹${totalExpenses.toLocaleString()}`;
    document.getElementById('pdf-tax').innerText = `₹${taxDeducted.toLocaleString()} (${state.taxRate}%)`;
    document.getElementById('pdf-balance').innerText = `₹${balance.toLocaleString()}`;

    const opt = {
        margin:       1,
        filename:     'Monthly_Budget_Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.display = 'none';
    });
});

// Run Init
init();
