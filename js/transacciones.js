document.addEventListener("DOMContentLoaded", () => {
    const paymentStatus = document.getElementById("payment-status");
    const vehiclePaymentInfo = document.getElementById("vehicle-payment-info");
    const infoPlate = document.getElementById("info-plate");
    const infoTime = document.getElementById("info-time");
    const infoRate = document.getElementById("info-rate");
    const transactionForm = document.getElementById("transaction-form");
    const transactionAmountInput = document.getElementById("transaction-amount");
    const paymentMethodSelect = document.getElementById("payment-method");
    const transactionNotesTextarea = document.getElementById("transaction-notes");
    const transactionsTableBody = document.querySelector("#transactions-table tbody");
    const filterTabs = document.querySelectorAll(".filter-tab");

    const vehicleSelectionSection = document.createElement("section");
    vehicleSelectionSection.classList.add("vehicle-selection");
    vehicleSelectionSection.setAttribute("aria-labelledby", "select-vehicle-title");

    const selectVehicleTitle = document.createElement("h2");
    selectVehicleTitle.id = "select-vehicle-title";
    selectVehicleTitle.textContent = "Seleccionar Vehículo para Cobro";
    vehicleSelectionSection.appendChild(selectVehicleTitle);

    const vehicleSelect = document.createElement("select");
    vehicleSelect.id = "vehicle-to-pay";
    vehicleSelect.classList.add("select-input");
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Seleccione un vehículo...";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    vehicleSelect.appendChild(defaultOption);
    vehicleSelectionSection.appendChild(vehicleSelect);

    const mainPaymentContainer = document.querySelector(".payment-container");
    mainPaymentContainer.insertBefore(vehicleSelectionSection, mainPaymentContainer.firstChild);

    let currentVehicle = null; // Para almacenar la información del vehículo a pagar

    // ----- Funciones Auxiliares -----
    function formatDate(date) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(date).toLocaleDateString('es-CO', options);
    }

    function saveTransaction(transaction) {
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
        transactions.unshift(transaction); // Agregar al principio
        localStorage.setItem("transactions", JSON.stringify(transactions));
        loadTransactions();
    }

    function loadTransactions(filter = 'all') {
        transactionsTableBody.innerHTML = "";
        const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

        transactions.forEach(transaction => {
            if (filter === 'all' || transaction.status === filter) {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td data-cell="date">${formatDate(transaction.date)}</td>
                    <td data-cell="plate">${transaction.plate}</td>
                    <td data-cell="client">${transaction.clientName || 'N/A'}</td>
                    <td data-cell="amount">$${transaction.amount.toLocaleString('es-CO')}</td>
                    <td data-cell="status" class="${transaction.status}">${transaction.status === 'completed' ? 'Completado' : 'Pendiente'}</td>
                    <td data-cell="method">${transaction.paymentMethod}</td>
                    <td data-cell="actions" class="text-right">
                        <button class="action-button small view-details" data-id="${transaction.id}">
                            <i class="fas fa-info-circle"></i> Ver
                        </button>
                    </td>
                `;
                transactionsTableBody.appendChild(row);
            }
        });
    }

    function getClientNameByPlate(plate) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const client = clients.find(c => c.plate === plate);
        return client ? client.name : null;
    }

    // ----- Cargar Vehículos "En Movimiento" -----
    function loadVehiclesInParking() {
        const vehiclesInParking = JSON.parse(localStorage.getItem("vehiculos")) || [];
        vehicleSelect.innerHTML = '<option value="" disabled selected>Seleccione un vehículo...</option>';
        vehiclesInParking.forEach(vehicle => {
            const option = document.createElement("option");
            option.value = vehicle.placa;
            option.textContent = vehicle.placa;
            vehicleSelect.appendChild(option);
        });
    }

    // ----- Calcular (Simuladamente) Tiempo y Tarifa -----
    function calculateTimeAndFare(checkInTime) {
        console.log("Hora de Ingreso recibida:", checkInTime); // <-- AGREGAMOS ESTE LOG
        const horaIngreso = new Date(checkInTime);
        console.log("Objeto Date creado:", horaIngreso); // <-- AGREGAMOS ESTE LOG
        if (isNaN(horaIngreso.getTime())) {
            console.error("Error: La hora de ingreso no es válida:", checkInTime);
            return { timeElapsed: 'NaN', rate: '$3.000/hora', amount: NaN };
        }
        const ahora = new Date();
        const diffHoras = Math.ceil((ahora.getTime() - horaIngreso.getTime()) / (1000 * 60 * 60));
        const tarifaPorHora = 3000; // Tarifa de ejemplo
        const montoTotal = diffHoras * tarifaPorHora;
        return {
            timeElapsed: `${diffHoras} hora(s)`,
            rate: `$${tarifaPorHora.toLocaleString('es-CO')}/hora`,
            amount: montoTotal
        };
    }

    // ----- Evento al Seleccionar un Vehículo -----
    vehicleSelect.addEventListener("change", () => {
        const selectedPlate = vehicleSelect.value;
        if (selectedPlate) {
            const vehiclesInParking = JSON.parse(localStorage.getItem("vehiculos")) || [];
            const selectedVehicleData = vehiclesInParking.find(v => v.placa === selectedPlate);

            if (selectedVehicleData) {
                const paymentDetails = calculateTimeAndFare(selectedVehicleData.horaIngreso);
                currentVehicle = {
                    plate: selectedVehicleData.placa,
                    ...paymentDetails,
                    clientName: getClientNameByPlate(selectedVehicleData.placa)
                };
                infoPlate.textContent = currentVehicle.plate;
                infoTime.textContent = currentVehicle.timeElapsed;
                infoRate.textContent = currentVehicle.rate;
                transactionAmountInput.value = currentVehicle.amount;
                vehiclePaymentInfo.style.display = 'block';
            } else {
                vehiclePaymentInfo.style.display = 'none';
                currentVehicle = null;
            }
        } else {
            vehiclePaymentInfo.style.display = 'none';
            currentVehicle = null;
        }
    });

    // ----- Procesamiento del Pago -----
    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        if (!currentVehicle) {
            alert("Por favor, seleccione un vehículo para procesar el pago.");
            return;
        }

        const amountStr = transactionAmountInput.value;
        const amount = parseFloat(amountStr);
        const paymentMethod = paymentMethodSelect.value;
        const notes = transactionNotesTextarea.value.trim();
        const transactionId = Math.random().toString(36).substring(2, 15);

        console.log("Monto ingresado:", amountStr);
        console.log("Monto parseado:", amount);
        console.log("Método de pago seleccionado:", paymentMethod);
        console.log("Información del vehículo actual:", currentVehicle);

        if (isNaN(amount) || amount <= 0) {
            alert("El importe ingresado no es válido. Por favor, verifique.");
            return;
        }

        if (!paymentMethod) {
            alert("Por favor, seleccione un método de pago.");
            return;
        }

        const newTransaction = {
            id: transactionId,
            date: new Date().toISOString(),
            plate: currentVehicle.plate,
            clientName: currentVehicle.clientName,
            amount: amount,
            paymentMethod: paymentMethod,
            notes: notes,
            status: 'completed'
        };

        saveTransaction(newTransaction);
        paymentStatus.textContent = "Pago Procesado Exitosamente";
        paymentStatus.className = "status-badge completed";
        transactionForm.reset();
        vehiclePaymentInfo.style.display = 'none';
        currentVehicle = null;
        loadVehiclesInParking(); // Recargar la lista de vehículos después del pago
        setTimeout(() => {
            paymentStatus.textContent = "";
            paymentStatus.className = "status-badge";
        }, 3000);
    });

    // ----- Filtrado del Historial -----
    filterTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            filterTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            loadTransactions(tab.dataset.filter);
        });
    });

    // ----- Inicialización -----
    loadTransactions();
    loadVehiclesInParking();
});