const SECRET_PASSCODE = "314159";
const SECRET_ENDPOINT = "https://google.com";

const display = document.getElementById("display");
const historyText = document.getElementById("history");
const toast = document.getElementById("toast");
const buttons = document.querySelectorAll(".key");

let expression = "0";
let secretBuffer = "";
let toastTimer;

function updateDisplay() {
  display.value = expression;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function resetCalculator() {
  expression = "0";
  historyText.textContent = "Ready";
  updateDisplay();
}

function sanitizeExpression(raw) {
  return raw.replace(/x/g, "*").replace(/÷/g, "/");
}

function isOperator(value) {
  return ["+", "-", "*", "/", "%"].includes(value);
}

function appendValue(value) {
  if (expression === "0" && value !== ".") {
    expression = value;
  } else {
    const lastChar = expression.slice(-1);
    if (isOperator(lastChar) && isOperator(value)) {
      expression = expression.slice(0, -1) + value;
    } else {
      expression += value;
    }
  }

  trackSecret(value);
  updateDisplay();
}

function deleteValue() {
  expression = expression.length <= 1 ? "0" : expression.slice(0, -1);
  updateDisplay();
}

function formatResult(result) {
  if (!Number.isFinite(result)) {
    throw new Error("Invalid result");
  }

  const rounded = Number(result.toFixed(10));
  return `${rounded}`;
}

function calculate() {
  try {
    const safeExpression = sanitizeExpression(expression);
    if (!/^[0-9+\-*/%.() ]+$/.test(safeExpression)) {
      throw new Error("Unsafe expression");
    }

    const result = Function(`"use strict"; return (${safeExpression})`)();
    historyText.textContent = `${expression} =`;
    expression = formatResult(result);
    updateDisplay();
  } catch (error) {
    historyText.textContent = "Calculation error";
    showToast("That expression could not be calculated.");
  }
}

function applyUnaryOperation(action) {
  try {
    const current = Number(expression);
    if (!Number.isFinite(current)) {
      throw new Error("Invalid number");
    }

    let result;
    let label;

    if (action === "sqrt") {
      if (current < 0) {
        throw new Error("Negative root");
      }
      result = Math.sqrt(current);
      label = `sqrt(${expression})`;
    } else if (action === "square") {
      result = current ** 2;
      label = `sqr(${expression})`;
    } else if (action === "reciprocal") {
      if (current === 0) {
        throw new Error("Divide by zero");
      }
      result = 1 / current;
      label = `1/(${expression})`;
    }

    historyText.textContent = `${label} =`;
    expression = formatResult(result);
    updateDisplay();
  } catch (error) {
    historyText.textContent = "Operation error";
    showToast("That operation is not valid for the current value.");
  }
}

function trackSecret(input) {
  if (/^\d$/.test(input)) {
    secretBuffer = (secretBuffer + input).slice(-SECRET_PASSCODE.length);
    if (secretBuffer === SECRET_PASSCODE) {
      historyText.textContent = "Secret code accepted";
      showToast("Secret endpoint opened in a new tab.");
      window.open(SECRET_ENDPOINT, "_blank", "noopener,noreferrer");
      secretBuffer = "";
    }
    return;
  }

  if (input !== ".") {
    secretBuffer = "";
  }
}

function handleAction(action) {
  if (action === "clear") {
    secretBuffer = "";
    resetCalculator();
    return;
  }

  if (action === "delete") {
    deleteValue();
    return;
  }

  if (action === "equals") {
    calculate();
    return;
  }

  applyUnaryOperation(action);
}

buttons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value) {
      appendValue(value);
    } else if (action) {
      handleAction(action);
    }
  });
});

window.addEventListener("keydown", (event) => {
  const { key } = event;

  if (/^[0-9.+\-*/%]$/.test(key)) {
    appendValue(key);
    return;
  }

  if (key === "Enter" || key === "=") {
    event.preventDefault();
    calculate();
    return;
  }

  if (key === "Backspace") {
    deleteValue();
    return;
  }

  if (key === "Escape") {
    secretBuffer = "";
    resetCalculator();
  }
});

resetCalculator();