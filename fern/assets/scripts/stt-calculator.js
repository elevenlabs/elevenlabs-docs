const pricingData = {
  free: { basePrice: 0, includedHours: 2.5, extraHourCost: null },
  starter: { basePrice: 5, includedHours: 12.5, extraHourCost: 0.4 },
  creator: { basePrice: 22, includedHours: 63, extraHourCost: 0.35 },
  pro: { basePrice: 99, includedHours: 320, extraHourCost: 0.31 },
  scale: { basePrice: 330, includedHours: 1220, extraHourCost: 0.27 },
  business: { basePrice: 1320, includedHours: 6000, extraHourCost: 0.22 },
};

function formatPrice(value) {
  return '$' + value.toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
}

function calculatePrice() {
  const tier = document.getElementById('tier-select').value;
  const hours = parseFloat(document.getElementById('hours-input').value) || 0;
  const tierData = pricingData[tier];

  const basePrice = tierData.basePrice;
  const extraHours = Math.max(0, hours - tierData.includedHours);
  const extraHoursCost = tierData.extraHourCost ? extraHours * tierData.extraHourCost : 0;
  const totalCost = basePrice + extraHoursCost;

  document.getElementById('base-price').textContent = formatPrice(basePrice);
  document.getElementById('extra-hours-cost').textContent = formatPrice(extraHoursCost);
  document.getElementById('total-cost').textContent = formatPrice(totalCost);

  // Add animation class to prices
  document.querySelectorAll('.price').forEach((el) => {
    el.classList.add('price-updated');
    setTimeout(() => el.classList.remove('price-updated'), 300);
  });
}

// Initialize calculator
document.getElementById('tier-select')?.addEventListener('change', calculatePrice);
document.getElementById('hours-input')?.addEventListener('input', calculatePrice);

// Calculate initial values
calculatePrice();
