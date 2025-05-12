document.addEventListener("DOMContentLoaded", () => {
    // Referencias a elementos del DOM (Gestión de Clientes)
    const newUserBtn = document.getElementById("new-user-btn");
    const userFormContainer = document.getElementById("user-form-container");
    const cancelUserBtn = document.getElementById("cancel-user");
    const clientForm = document.getElementById("client-form");
    const clientsTableBody = document.querySelector("#clients-table tbody");

    // Referencias a elementos del DOM (Gestión de Espacios)
    const spaceForm = document.getElementById("space-form");
    const spaceTypeSelect = document.getElementById("space-type");
    const parkingGrid = document.getElementById("parking-grid");
    const availableSpaces = document.getElementById("available-spaces");
    const totalSpaces = document.getElementById("total-spaces");

    let total = 0; // Inicializamos en 0 y cargamos desde localStorage

    // ----- Funciones de Gestión de Clientes -----
    // Mostrar el formulario de nuevo cliente
    newUserBtn.addEventListener("click", () => {
        userFormContainer.classList.remove("hidden");
        clientForm.reset();
        document.getElementById("client-id").value = ""; // Limpiar ID al crear nuevo
    });

    // Ocultar el formulario de nuevo cliente
    cancelUserBtn.addEventListener("click", () => {
        userFormContainer.classList.add("hidden");
        clientForm.reset();
    });

    // Guardar cliente en la tabla y localStorage
    clientForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const clientId = document.getElementById("client-id").value;
        const name = document.getElementById("client-name").value.trim();
        const phone = document.getElementById("client-phone").value.trim();
        const plate = document.getElementById("client-vehicle").value.trim().toUpperCase();
        const type = document.getElementById("vehicle-type").value;
        const plan = document.getElementById("payment-plan").value;
        const typeText = document.getElementById("vehicle-type").selectedOptions[0].text;
        const planText = document.getElementById("payment-plan").selectedOptions[0].text;

        const client = { id: clientId || generateId(), name, phone, plate, type, plan, typeText, planText };

        if (clientId) {
            updateClientInTable(client);
            updateClientInLocalStorage(client);
        } else {
            addClientToTable(client);
            saveClientToLocalStorage(client);
        }

        clientForm.reset();
        userFormContainer.classList.add("hidden");
    });

    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    function addClientToTable(client) {
        const row = document.createElement("tr");
        row.dataset.clientId = client.id;
        row.innerHTML = `
            <td data-cell="name">${client.name}</td>
            <td data-cell="contact">${client.phone}</td>
            <td data-cell="vehicle">${client.plate}</td>
            <td data-cell="type">${client.typeText}</td>
            <td data-cell="plan">${client.planText}</td>
            <td class="actions-col">
                <button class="action-button small edit-btn" data-id="${client.id}">
                    <i class="fas fa-edit"></i>
                    <span>Editar</span>
                </button>
                <button class="action-button small danger delete-btn" data-id="${client.id}">
                    <i class="fas fa-trash"></i>
                    <span>Eliminar</span>
                </button>
            </td>
        `;
        clientsTableBody.appendChild(row);
        addClientRowEventListeners(row);
    }

    function updateClientInTable(client) {
        const row = clientsTableBody.querySelector(`tr[data-client-id="${client.id}"]`);
        if (row) {
            row.querySelector('[data-cell="name"]').textContent = client.name;
            row.querySelector('[data-cell="contact"]').textContent = client.phone;
            row.querySelector('[data-cell="vehicle"]').textContent = client.plate;
            row.querySelector('[data-cell="type"]').textContent = client.typeText;
            row.querySelector('[data-cell="plan"]').textContent = client.planText;
        }
    }

    function saveClientToLocalStorage(client) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        clients.push(client);
        localStorage.setItem("clients", JSON.stringify(clients));
    }

    function updateClientInLocalStorage(updatedClient) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const updatedClients = clients.map(client =>
            client.id === updatedClient.id ? updatedClient : client
        );
        localStorage.setItem("clients", JSON.stringify(updatedClients));
    }

    function loadClientsFromLocalStorage() {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        clients.forEach(client => addClientToTable(client));
    }

    function deleteClientFromLocalStorage(clientId) {
        const clients = JSON.parse(localStorage.getItem("clients")) || [];
        const updatedClients = clients.filter(client => client.id !== clientId);
        localStorage.setItem("clients", JSON.stringify(updatedClients));
    }

    function addClientRowEventListeners(row) {
        const editBtn = row.querySelector(".edit-btn");
        const deleteBtn = row.querySelector(".delete-btn");

        editBtn.addEventListener("click", () => {
            const clientId = editBtn.dataset.id;
            const clients = JSON.parse(localStorage.getItem("clients")) || [];
            const clientToEdit = clients.find(client => client.id === clientId);
            if (clientToEdit) {
                document.getElementById("client-id").value = clientToEdit.id;
                document.getElementById("client-name").value = clientToEdit.name;
                document.getElementById("client-phone").value = clientToEdit.phone;
                document.getElementById("client-vehicle").value = clientToEdit.plate;
                document.getElementById("vehicle-type").value = clientToEdit.type;
                document.getElementById("payment-plan").value = clientToEdit.plan;
                userFormContainer.classList.remove("hidden");
            }
        });

        deleteBtn.addEventListener("click", () => {
            const clientId = deleteBtn.dataset.id;
            if (confirm("¿Seguro que desea eliminar este cliente?")) {
                deleteClientFromLocalStorage(clientId);
                row.remove();
            }
        });
    }

    // ----- Funciones de Gestión de Espacios -----
    // Agregar nuevo espacio
    spaceForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const typeValue = spaceTypeSelect.value;
        if (!typeValue) return;

        const typeMap = {
            car: "Automóvil",
            motorcycle: "Motocicleta",
            bicycle: "Bicicleta",
            truck: "Vehículo Pesado"
        };

        const id = `${typeValue.charAt(0).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
        const newSpace = {
            id,
            type: typeValue,
            typeName: typeMap[typeValue],
            status: "available"
        };

        addSpaceToGrid(newSpace);
        saveSpaceToLocalStorage(newSpace);

        total++;
        updateSpaceSummary();
        spaceForm.reset();
    });

    function addSpaceToGrid(space) {
        const spaceDiv = document.createElement("div");
        spaceDiv.classList.add("parking-space");
        spaceDiv.dataset.type = space.type;
        spaceDiv.dataset.status = space.status;
        spaceDiv.dataset.spaceId = space.id; // Nuevo dataset ID para referenciar
        spaceDiv.innerHTML = `
            <span class="space-id">${space.id}</span>
            <span class="space-type">${space.typeName}</span>
            <span class="space-status" data-status="${space.status}">${space.status === "available" ? "Disponible" : "Ocupado"}</span>
        `;
        parkingGrid.appendChild(spaceDiv);
    }

    function saveSpaceToLocalStorage(space) {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        spaces.push(space);
        localStorage.setItem("spaces", JSON.stringify(spaces));
    }

    function loadSpacesFromLocalStorage() {
        const spaces = JSON.parse(localStorage.getItem("spaces")) || [];
        parkingGrid.innerHTML = ""; // Limpiar la grilla antes de cargar
        total = spaces.length;
        spaces.forEach(space => addSpaceToGrid(space));
        updateSpaceSummary();
    }

    // Actualizar contadores de espacios
    function updateSpaceSummary() {
        const disponibles = document.querySelectorAll('.parking-space[data-status="available"]').length;
        availableSpaces.textContent = `${disponibles} disponibles`;
        totalSpaces.textContent = `de ${total} totales`;
    }

    // Cargar datos al iniciar
    loadClientsFromLocalStorage();
    loadSpacesFromLocalStorage();
});