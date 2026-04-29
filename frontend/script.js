const API_URL = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
    const providerSelect = document.getElementById('provider');
    const instanceSelect = document.getElementById('instance-type');
    const form = document.getElementById('calculator-form');
    const calculateBtn = document.getElementById('calculate-btn');
    const btnSpan = calculateBtn.querySelector('span');
    const loader = calculateBtn.querySelector('.loader');
    const resultsPanel = document.getElementById('results');

    let pricingData = {};

    // Fetch available pricing data from the backend
    try {
        const response = await fetch(`${API_URL}/pricing-data`);
        if(response.ok) {
            pricingData = await response.json();
            console.log("Loaded pricing context: ", pricingData);
        } else {
            console.error("Failed to load pricing data.");
        }
    } catch (e) {
        console.error("Backend not reachable. Ensure Flask is running on port 5000.");
    }

    // Handle Provider Change
    providerSelect.addEventListener('change', () => {
        const provider = providerSelect.value;
        const instances = pricingData[provider];
        
        // Reset and populate instances
        instanceSelect.innerHTML = '<option value="" disabled selected>Select Instance Type</option>';
        instanceSelect.disabled = true;

        if (instances) {
            for (const key in instances) {
                if(key !== "storage_per_gb_month") {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = key;
                    instanceSelect.appendChild(option);
                }
            }
            instanceSelect.disabled = false;
        }
    });

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const provider = providerSelect.value;
        const instance = instanceSelect.value;
        const durationInput = document.getElementById('duration').value;
        const unitMultiplier = document.getElementById('duration-unit').value;
        let hours = parseFloat(durationInput) * parseFloat(unitMultiplier);
        if (hours > 87600) hours = 87600; // Visual/Calculation cap at 10 years to protect browser memory
        const storage = document.getElementById('storage').value;

        if (!provider || !instance) return;

        // UI Loading State
        btnSpan.classList.add('hidden');
        loader.classList.remove('hidden');
        resultsPanel.classList.add('hidden');

        try {
            const response = await fetch(`${API_URL}/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: provider,
                    instance_type: instance,
                    hours: hours,
                    storage_gb: storage
                })
            });

            if (response.ok) {
                const results = await response.json();
                
                // Animate Numbers
                animateValue("compute-cost", 0, results.compute_cost, 600);
                animateValue("storage-cost", 0, results.storage_cost, 600);
                animateValue("total-cost", 0, results.total_cost, 800);

                // Reveal Results
                setTimeout(() => {
                    resultsPanel.classList.remove('hidden');
                    updateChart(results.compute_cost, results.storage_cost, parseFloat(hours), parseFloat(durationInput), unitMultiplier);
                }, 100);
            } else {
                alert("Error calculating cost. Check console. Ensure backend is running!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Could not reach backend. Make sure the Flask server is running on port 5000.");
        } finally {
            // Revert UI Loading State
            setTimeout(() => {
                btnSpan.classList.remove('hidden');
                loader.classList.add('hidden');
            }, 500);
        }
    });
});

// Animation helper for smooth number rolling
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        // easeOutQuart
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentVal = (progress * (end - start) + start).toFixed(2);
        obj.innerHTML = `$${currentVal}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerHTML = `$${end.toFixed(2)}`;
        }
    };
    window.requestAnimationFrame(step);
}

let costChart = null;
function updateChart(totalCompute, totalStorage, maxHours, durationVal, unitMultiplier) {
    const ctx = document.getElementById('costChart');
    if(!ctx) return;

    // Generate data points
    const labels = [];
    const computeData = [];
    const storageData = [];
    const totalData = [];
    
    // Determine the step and formatting base
    let steps = 10;
    let unitLabel = 'h';
    let divider = 1;
    
    unitMultiplier = parseInt(unitMultiplier);
    
    if (unitMultiplier === 8760) {
        // Years -> show in Months
        steps = Math.max(2, durationVal * 12);
        if (steps > 60) steps = 60;
        unitLabel = 'm';
        divider = 730;
    } else if (unitMultiplier === 730) {
        // Months
        steps = Math.max(2, durationVal);
        if (steps > 60) steps = 60;
        unitLabel = 'm';
        divider = 730;
    } else if (unitMultiplier === 168) {
        // Weeks
        steps = Math.max(2, durationVal);
        if (steps > 60) steps = 60;
        unitLabel = 'w';
        divider = 168;
    } else if (unitMultiplier === 24) {
        // Days
        steps = Math.max(2, durationVal);
        if (steps > 60) steps = 60;
        unitLabel = 'd';
        divider = 24;
    } else {
        // Hours
        steps = Math.max(2, Math.min(durationVal, 24));
        unitLabel = 'h';
        divider = 1;
    }

    const stepSize = maxHours / steps;
    
    for (let h = 0; h <= maxHours + 0.0001; h += stepSize) {
        labels.push(+(h / divider).toFixed(1) + unitLabel);
        computeData.push((totalCompute / maxHours) * h);
        storageData.push((totalStorage / maxHours) * h);
        totalData.push(((totalCompute + totalStorage) / maxHours) * h);
    }
    
    // Ensure final point is exactly maxHours
    const finalLabel = +(maxHours / divider).toFixed(1) + unitLabel;
    if (labels[labels.length - 1] !== finalLabel) {
        labels.push(finalLabel);
        computeData.push(totalCompute);
        storageData.push(totalStorage);
        totalData.push(totalCompute + totalStorage);
    }

    if (costChart) {
        costChart.destroy();
    }

    costChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Compute Cost ($)',
                    data: computeData,
                    borderColor: '#58a6ff',
                    backgroundColor: 'rgba(88, 166, 255, 0.05)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Storage Cost ($)',
                    data: storageData,
                    borderColor: '#a258ff',
                    backgroundColor: 'rgba(162, 88, 255, 0.05)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Total Cost ($)',
                    data: totalData,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#8b949e', font: {family: "'Outfit', sans-serif"} }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { 
                        color: '#8b949e',
                        font: {family: "'Outfit', sans-serif"},
                        callback: function(value) { return '$' + value; }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#f0f6fc', font: { family: "'Outfit', sans-serif" } }
                },
                tooltip: {
                    titleFont: { family: "'Outfit', sans-serif" },
                    bodyFont: { family: "'Outfit', sans-serif" },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y); }
                            return label;
                        }
                    }
                }
            }
        }
    });
}
