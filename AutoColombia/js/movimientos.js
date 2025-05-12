document.addEventListener("DOMContentLoaded", () => {
    const queryForm = document.getElementById("vehicle-query");
    const vehiclePlateInput = document.getElementById("vehicle-plate");
    const queryResultsSection = document.getElementById("query-results");
    const vehicleDetailsDiv = document.getElementById("vehicle-details");
    const checkoutButton = document.getElementById("checkout-action");

    const checkinForm = document.getElementById("checkin-form");
    const checkinPlateInput = document.getElementById("checkin-plate");
    const parkingSlotSelect = document.getElementById("parking-slot");

    const currentVehiclesTableBody = document.querySelector("#current-vehicles tbody");
    const refreshListBtn = document.getElementById("refresh-list");

    // ----- Funciones de Gestión de Espacios (Necesarias para el Check-in) -----
    function populateParkingSlotSelect(availableSpacesList) {
        parkingSlotSelect.innerHTML = '<option value="" disabled selected>Seleccione espacio</option>';
        availableSpacesList.forEach(space => {
            const option = document.createElement("option");
            option.value = space.id;
            option.textContent = space.id;
            parkingSlotSelect.appendChild(option);
        });
    }

    function getAvailableSpacesFromLocalStorage() {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        return spaces.filter(space => space.status === "available");
    }

    function updateSpaceStatus(spaceId, newStatus) {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        const updatedSpaces = spaces.map(space =>
            space.id === spaceId ? { ...space, status: newStatus } : space
        );
        localStorage.setItem("spaces", JSON.stringify(updatedSpaces));
        loadCurrentVehicles(); // Recargar la lista para actualizar la disponibilidad visualmente
        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage()); // Actualizar opciones de check-in
    }

    // ----- Gestión de Consulta de Vehículos -----
    queryForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const placa = vehiclePlateInput.value.trim().toUpperCase();

        if (!placa) {
            alert("Por favor, ingrese una placa.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const vehiculo = vehiculos.find(v => v.placa === placa);

        if (vehiculo) {
            const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
            const espacioInfo = spaces.find(s => s.id === vehiculo.espacio);
            const espacioNombre = espacioInfo ? espacioInfo.id : "No asignado";

            vehicleDetailsDiv.innerHTML = `
                <p><strong>Placa:</strong> ${vehiculo.placa}</p>
                <p><strong>Ubicación:</strong> ${espacioNombre}</p>
                <p><strong>Hora de Ingreso:</strong> ${vehiculo.horaIngreso}</p>
            `;
            queryResultsSection.classList.remove("hidden");
        } else {
            alert("No se encontró ningún vehículo con esa placa.");
            queryResultsSection.classList.add("hidden");
            vehicleDetailsDiv.innerHTML = "";
        }
    });

    checkoutButton.addEventListener("click", () => {
        const placaConsulta = vehiclePlateInput.value.trim().toUpperCase();
        if (!placaConsulta) {
            alert("Por favor, ingrese la placa del vehículo a retirar.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const vehiculoIndex = vehiculos.findIndex(v => v.placa === placaConsulta);

        if (vehiculoIndex > -1) {
            const vehiculo = vehiculos[vehiculoIndex];
            if (confirm(`¿Confirmar la salida del vehículo con placa ${vehiculo.placa} del espacio ${vehiculo.espacio}?`)) {
                // Liberar el espacio
                updateSpaceStatus(vehiculo.espacio, "available");
                // Eliminar el vehículo del registro
                vehiculos.splice(vehiculoIndex, 1);
                localStorage.setItem("vehiculos", JSON.stringify(vehiculos));
                alert(`Salida del vehículo ${vehiculo.placa} registrada.`);
                queryResultsSection.classList.add("hidden");
                vehicleDetailsDiv.innerHTML = "";
                vehiclePlateInput.value = "";
                loadCurrentVehicles();
            }
        } else {
            alert("No se encontró ningún vehículo con esa placa para realizar la salida.");
        }
    });

    // ----- Gestión de Registro de Ingreso -----
    checkinForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const placa = checkinPlateInput.value.trim().toUpperCase();
        const espacio = parkingSlotSelect.value;

        if (!placa || !espacio) {
            alert("Por favor, complete la placa y seleccione un espacio.");
            return;
        }

        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        const espacioOcupado = vehiculos.find(v => v.espacio === espacio);
        if (espacioOcupado) {
            alert(`El espacio ${espacio} ya está ocupado por el vehículo con placa ${espacioOcupado.placa}.`);
            return;
        }

        const horaIngreso = new Date().toISOString(); // Guardar la hora actual en formato ISO

        const nuevoVehiculo = {
            placa,
            espacio,
            horaIngreso // <-- GUARDAMOS LA HORA DE INGRESO EN FORMATO ISO
        };

        vehiculos.push(nuevoVehiculo);
        localStorage.setItem("vehiculos", JSON.stringify(vehiculos));

        // Marcar el espacio como ocupado
        updateSpaceStatus(espacio, "occupied");

        alert(`Ingreso del vehículo ${placa} al espacio ${espacio} registrado.`);
        checkinForm.reset();
        loadCurrentVehicles();
        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
    });

    // ----- Gestión de Listado Actual de Vehículos -----
    function loadCurrentVehicles() {
        const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
        currentVehiclesTableBody.innerHTML = "";

        vehiculos.forEach(v => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${v.placa}</td>
                <td>${v.espacio}</td>
                <td>${v.horaIngreso}</td>
                <td class="actions-column">
                    <button class="action-button small delete-btn" data-plate="${v.placa}">Retirar</button>
                </td>
            `;
            currentVehiclesTableBody.appendChild(tr);
        });

        // Añadir event listeners a los botones de "Retirar" en la tabla
        const retirarButtons = currentVehiclesTableBody.querySelectorAll(".delete-btn");
        retirarButtons.forEach(button => {
            button.addEventListener("click", () => {
                const placaToRemove = button.dataset.plate;
                const vehiculos = JSON.parse(localStorage.getItem("vehiculos")) || [];
                const vehiculoToRemove = vehiculos.find(v => v.placa === placaToRemove);

                if (vehiculoToRemove) {
                    if (confirm(`¿Confirmar la salida del vehículo con placa ${placaToRemove} del espacio ${vehiculoToRemove.espacio}?`)) {
                        // Liberar el espacio
                        updateSpaceStatus(vehiculoToRemove.espacio, "available");
                        // Eliminar el vehículo del registro
                        const updatedVehiculos = vehiculos.filter(v => v.placa !== placaToRemove);
                        localStorage.setItem("vehiculos", JSON.stringify(updatedVehiculos));
                        alert(`Salida del vehículo ${placaToRemove} registrada.`);
                        loadCurrentVehicles();
                        populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
                    }
                }
            });
        });
    }

    refreshListBtn.addEventListener("click", loadCurrentVehicles);

    // ----- Inicialización -----
    populateParkingSlotSelect(getAvailableSpacesFromLocalStorage());
    loadCurrentVehicles();
});