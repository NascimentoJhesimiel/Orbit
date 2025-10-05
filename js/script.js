// Variáveis globais que irao armazenar estado
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentId = parseInt(localStorage.getItem("currentId")) || 1;
let editingUserId = null;

// Função para inicializar a aplicação
const initApp = () => {
  bindEvents();
  renderUserList();
  setupRealTimeValidation();
};

// Função para vincular eventos
const bindEvents = () => {
  // Formulário
  const form = document.getElementById("user-form");
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Botão cancelar
  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelEdit);
  }

  // Busca
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => searchUsers(e.target.value));
  }

  // Limpar todos - corrigindo o ID para corresponder ao HTML
  const clearAllBtn = document.getElementById("clear-all");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", confirmClearAll);
  }

  // Máscara de telefone
  const phoneInput = document.getElementById("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => formatPhone(e.target));
  }
};

// Função para configurar validação em tempo real
const setupRealTimeValidation = () => {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");

  // Validação do nome
  if (nameInput) {
    nameInput.addEventListener("input", (e) => {
      let value = e.target.value;

      // Remove caracteres que não são letras ou espaços
      const filteredValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

      // Se o valor foi alterado, atualiza o campo
      if (value !== filteredValue) {
        e.target.value = filteredValue;
        value = filteredValue;
      }

      const trimmedValue = value.trim();
      const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;

      if (trimmedValue === "") {
        e.target.classList.remove("is-valid", "is-invalid");
      } else if (nameRegex.test(trimmedValue) && trimmedValue.length >= 2) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
      } else {
        e.target.classList.remove("is-valid");
        e.target.classList.add("is-invalid");
      }
    });
  }

  // Validação do email
  if (emailInput) {
    emailInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (value === "") {
        e.target.classList.remove("is-valid", "is-invalid");
      } else if (emailRegex.test(value)) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
      } else {
        e.target.classList.remove("is-valid");
        e.target.classList.add("is-invalid");
      }
    });
  }

  // Validação do telefone
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      const phoneRegex = /^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/;

      if (value === "") {
        e.target.classList.remove("is-valid", "is-invalid");
      } else if (phoneRegex.test(value)) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
      } else {
        e.target.classList.remove("is-valid");
        e.target.classList.add("is-invalid");
      }
    });
  }

  // Validação da rua
  const streetInput = document.getElementById("street");
  if (streetInput) {
    streetInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      if (value.length >= 3) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
      } else if (value.length > 0) {
        e.target.classList.remove("is-valid");
        e.target.classList.add("is-invalid");
      } else {
        e.target.classList.remove("is-valid", "is-invalid");
      }
    });
  }

  // Validação do número
  const numberInput = document.getElementById("number");
  if (numberInput) {
    numberInput.addEventListener("input", (e) => {
      const value = e.target.value.trim();
      if (value && parseInt(value) > 0) {
        e.target.classList.remove("is-invalid");
        e.target.classList.add("is-valid");
      } else if (value !== "") {
        e.target.classList.remove("is-valid");
        e.target.classList.add("is-invalid");
      } else {
        e.target.classList.remove("is-valid", "is-invalid");
      }
    });
  }
};

// Função para lidar com submissão do formulário
const handleFormSubmit = (e) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast("Por favor, corrija os erros no formulário.", "warning");
    return;
  }

  const userData = getUserDataFromForm();

  if (editingUserId) {
    updateUser(editingUserId, userData);
  } else {
    addUser(userData);
  }
};

// Função para obter dados do formulário
const getUserDataFromForm = () => {
  const street = document.getElementById("street").value.trim();
  const number = document.getElementById("number").value.trim();
  const address = street && number ? `${street}, ${number}` : street || "";

  return {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    age: document.getElementById("age").value
      ? parseInt(document.getElementById("age").value)
      : null,
    address: address,
    street: street,
    number: number,
    createdAt: editingUserId
      ? getUserById(editingUserId).createdAt
      : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// Função para validar formulário
const validateForm = () => {
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  let isValid = true;

  // Validar nome
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;
  const nameValue = name.value.trim();

  if (!nameValue || nameValue.length < 2 || !nameRegex.test(nameValue)) {
    name.classList.add("is-invalid");
    name.nextElementSibling.textContent =
      "Nome deve conter apenas letras e ter pelo menos 2 caracteres.";
    isValid = false;
  } else {
    name.classList.remove("is-invalid");
    name.nextElementSibling.textContent = "Insira um nome válido.";
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value.trim())) {
    email.classList.add("is-invalid");
    isValid = false;
  } else {
    // Verificar se email já existe
    const existingUser = users.find(
      (user) =>
        user.email.toLowerCase() === email.value.trim().toLowerCase() &&
        user.id !== editingUserId
    );

    if (existingUser) {
      email.classList.add("is-invalid");
      email.nextElementSibling.textContent = "Este e-mail já está sendo usado.";
      isValid = false;
    } else {
      email.classList.remove("is-invalid");
      email.nextElementSibling.textContent = "Insira, um e-mail válido.";
    }
  }

  return isValid;
};

// Função para adicionar usuário
const addUser = (userData) => {
  const newUser = {
    id: currentId++,
    ...userData,
  };

  users.push(newUser);
  saveToStorage();
  renderUserList();
  clearForm();
  showToast("Usuário adicionado com sucesso!", "success");
};

// Função para atualizar usuário
const updateUser = (id, userData) => {
  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...userData };
    saveToStorage();
    renderUserList();
    clearForm();
    cancelEdit();
    showToast("Usuário atualizado com sucesso!", "success");
  }
};

// Função para deletar usuário
const deleteUser = (id) => {
  if (confirm("Tem certeza que deseja excluir este usuário?")) {
    users = users.filter((user) => user.id !== id);
    saveToStorage();
    renderUserList();
    showToast("Usuário excluído com sucesso!", "success");
  }
};

// Função para editar usuário
const editUser = (id) => {
  const user = getUserById(id);
  if (user) {
    editingUserId = id;

    // Preencher formulário
    document.getElementById("name").value = user.name;
    document.getElementById("email").value = user.email;
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("age").value = user.age || "";
    document.getElementById("street").value = user.street || "";
    document.getElementById("number").value = user.number || "";

    // Atualizar UI do título do card - adaptado para o seu HTML
    const cardHeader = document.querySelector(".card-header h5");
    if (cardHeader) {
      cardHeader.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Usuário';
    }

    // Atualizar botões
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
      submitBtn.innerHTML =
        '<i class="bi bi-check-circle"></i> Atualizar Usuário';
      submitBtn.className = "btn btn-warning";
    }

    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) {
      cancelBtn.classList.remove("d-none");
    }

    // Scroll para o formulário
    const cardHeaderElement = document.querySelector(".card-header");
    if (cardHeaderElement) {
      cardHeaderElement.scrollIntoView({ behavior: "smooth" });
    }
  }
};

// Função para cancelar edição
const cancelEdit = () => {
  editingUserId = null;
  clearForm();

  // Restaurar UI do título - adaptado para o seu HTML
  const cardHeader = document.querySelector(".card-header h5");
  if (cardHeader) {
    cardHeader.innerHTML =
      '<i class="bi bi-person-plus-fill"></i> Adicionar Usuário';
  }

  // Restaurar botões
  const submitBtn = document.getElementById("submit-btn");
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="bi bi-plus-circle"></i> Adicionar Usuário';
    submitBtn.className = "btn btn-primary";
  }

  const cancelBtn = document.getElementById("cancel-btn");
  if (cancelBtn) {
    cancelBtn.classList.add("d-none");
  }
};

// Função para obter usuário por ID
const getUserById = (id) => {
  return users.find((user) => user.id === id);
};

// Função para buscar usuários
const searchUsers = (query) => {
  const filteredUsers =
    query.trim() === ""
      ? users
      : users.filter(
          (user) =>
            user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()) ||
            (user.address &&
              user.address.toLowerCase().includes(query.toLowerCase())) ||
            (user.street &&
              user.street.toLowerCase().includes(query.toLowerCase()))
        );

  renderUserList(filteredUsers);
};

// Função para confirmar limpeza de todos os usuários
const confirmClearAll = () => {
  if (users.length === 0) {
    showToast("Não há usuários para remover.", "warning");
    return;
  }

  if (
    confirm(
      `Tem certeza que deseja excluir todos os ${users.length} usuários? Esta ação não pode ser desfeita.`
    )
  ) {
    users = [];
    currentId = 1;
    editingUserId = null;
    saveToStorage();
    renderUserList();
    clearForm();
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.value = "";
    }
    showToast("Todos os usuários foram removidos.", "success");
  }
};

// Função para renderizar lista de usuários
const renderUserList = (usersToRender = users) => {
  const userList = document.getElementById("user-list");
  const emptyState = document.getElementById("empty-state");
  const userCount = document.getElementById("user-count");

  if (userCount) {
    userCount.textContent = users.length;
  }

  if (!userList) return;

  if (usersToRender.length === 0) {
    userList.innerHTML = "";
    if (emptyState) {
      emptyState.classList.remove("d-none");
    }
    return;
  }

  if (emptyState) {
    emptyState.classList.add("d-none");
  }

  const tableHTML = `
        <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
                <thead class="table-dark">
                <tr>
                    <th scope="col">ID</th>
                    <th scope="col" class="text-center">Nome</th>
                    <th scope="col" class="d-none d-md-table-cell text-center">E-mail</th>
                    <th scope="col" class="d-none d-lg-table-cell text-center">Telefone</th>
                    <th scope="col" class="d-none d-lg-table-cell text-center">Idade</th>
                    <th scope="col" class="d-none d-xl-table-cell text-center">Endereço</th>
                    <th scope="col" class="text-center">Ações</th>
                </tr>
            </thead>
            <tbody class="text-center">
                ${usersToRender
                  .map(
                    (user) => `
                    <tr>
                        <td class="text-start"><strong>${user.id}</strong></td>
                        <td>
                            <div>
                                <div class="fw-semibold">${user.name}</div>
                                <small class="text-muted d-md-none">${
                                  user.email
                                }</small>
                            </div>
                        </td>
                        <td class="d-none d-md-table-cell">
                            <a href="mailto:${
                              user.email
                            }" class="text-decoration-none">${user.email}</a>
                        </td>
                        <td class="d-none d-lg-table-cell">
                            ${
                              user.phone
                                ? `<a href="tel:${user.phone.replace(
                                    /\D/g,
                                    ""
                                  )}" class="text-decoration-none">${
                                    user.phone
                                  }</a>`
                                : '<span class="text-muted">-</span>'
                            }
                        </td>
                        <td class="d-none d-lg-table-cell">
                            ${
                              user.age
                                ? `${user.age}`
                                : '<span class="text-muted">-</span>'
                            }
                        </td>
                        <td class="d-none d-xl-table-cell">
                            ${
                              user.address
                                ? `<small>${user.address}</small>`
                                : '<span class="text-muted">-</span>'
                            }
                        </td>
                        <td class="text-center">
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-primary" 
                                        onclick="editUser(${user.id})"
                                        title="Editar usuário">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button type="button" class="btn btn-outline-danger" 
                                        onclick="deleteUser(${user.id})"
                                        title="Excluir usuário">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
            </table>
        </div>
    `;

  userList.innerHTML = tableHTML;
};

// Função para limpar formulário
const clearForm = () => {
  const form = document.getElementById("user-form");
  if (form) {
    form.reset();
    // Remover classes de validação
    form.querySelectorAll(".is-invalid, .is-valid").forEach((input) => {
      input.classList.remove("is-invalid", "is-valid");
    });
  }
};

// Função para formatar telefone
const formatPhone = (input) => {
  let value = input.value.replace(/\D/g, "");

  if (value.length <= 11) {
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d{4,5})(\d{4})$/, "$1-$2");
  }

  input.value = value;
};

// Função para mostrar toast
const showToast = (message, type = "success") => {
  const toast = document.getElementById("notification-toast");
  const toastMessage = document.getElementById("toast-message");

  if (!toast || !toastMessage) return;

  const toastHeader = toast.querySelector(".toast-header i");

  // Configurar ícone e cor baseado no tipo
  if (toastHeader) {
    if (type === "success") {
      toastHeader.className = "bi bi-check-circle-fill text-success me-2";
    } else if (type === "warning") {
      toastHeader.className =
        "bi bi-exclamation-triangle-fill text-warning me-2";
    } else if (type === "danger") {
      toastHeader.className = "bi bi-x-circle-fill text-danger me-2";
    }
  }

  toastMessage.textContent = message;

  const bootstrapToast = new bootstrap.Toast(toast);
  bootstrapToast.show();
};

// Função para salvar no localStorage
const saveToStorage = () => {
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("currentId", currentId.toString());
};

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener("DOMContentLoaded", initApp);

// Expor funções globalmente para uso nos event handlers inline
window.editUser = editUser;
window.deleteUser = deleteUser;
