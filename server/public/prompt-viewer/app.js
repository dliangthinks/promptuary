(() => {
  const state = {
    categories: [],
    prompts: [],
    filteredPrompts: [],
    activeCategory: null,
    activePromptId: null,
    activePromptDetail: null,
    searchTerm: "",
    isDirty: false,
    isSaving: false,
  };

  const elements = {
    categoryList: document.getElementById("category-list"),
    promptListTitle: document.getElementById("prompt-list-title"),
    promptCount: document.getElementById("prompt-count"),
    promptItems: document.getElementById("prompt-items"),
    editorTitle: document.getElementById("editor-title"),
    editorDescription: document.getElementById("editor-description"),
    editorMeta: document.getElementById("editor-meta"),
    contentField: document.getElementById("prompt-content"),
    saveButton: document.getElementById("save-button"),
    statusBar: document.getElementById("status-bar"),
    searchInput: document.getElementById("search-input"),
    addCategoryButton: document.getElementById("add-category-btn"),
    removeCategoryButton: document.getElementById("remove-category-btn"),
    addPromptButton: document.getElementById("add-prompt-btn"),
    removePromptButton: document.getElementById("remove-prompt-btn"),
  };

  const routes = {
    catalog: "/prompts",
    promptDetail: (id) => `/api/v1/prompts/${encodeURIComponent(id)}`,
    updateCategory: (id) => `/api/v1/categories/${encodeURIComponent(id)}`,
  };

  function setStatus(message, variant = "idle") {
    elements.statusBar.textContent = message;
    elements.statusBar.className = "status-bar";
    if (variant === "busy") {
      elements.statusBar.classList.add("status-bar--busy");
    } else if (variant === "error") {
      elements.statusBar.classList.add("status-bar--error");
    }
  }

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function getCategoryName(categoryId) {
    if (!categoryId) {
      return state.categories.length ? state.categories[0].name : "No category";
    }
    const category = state.categories.find((item) => item.id === categoryId);
    return category ? category.name : categoryId;
  }

  function applyFilters() {
    const trimmedSearch = state.searchTerm.trim().toLowerCase();
    state.filteredPrompts = state.prompts.filter((prompt) => {
      const matchesCategory = state.activeCategory
        ? prompt.category === state.activeCategory
        : false;
      const matchesSearch =
        !trimmedSearch ||
        prompt.searchText.includes(trimmedSearch) ||
        prompt.id.toLowerCase().includes(trimmedSearch);
      return matchesCategory && matchesSearch;
    });
  }

  function ensureActiveCategory() {
    if (!state.categories.length) {
      state.activeCategory = null;
      return;
    }

    const exists = state.categories.some(
      (category) => category.id === state.activeCategory
    );

    if (!exists) {
      state.activeCategory = state.categories[0].id;
    }
  }

  function renderCategories() {
    const container = elements.categoryList;
    container.innerHTML = "";

    if (!state.categories.length) {
      const empty = document.createElement("p");
      empty.className = "sidebar__empty";
      empty.textContent = "No categories yet.";
      container.appendChild(empty);
      updateActionStates();
      return;
    }

    const counts = state.prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      return acc;
    }, {});

    const list = document.createElement("ul");
    list.className = "sidebar__items";

    state.categories.forEach((category) => {
      const item = document.createElement("li");
      item.className = "sidebar__item";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "sidebar__button" +
        (state.activeCategory === category.id
          ? " sidebar__button--active"
          : "");
      button.title = category.description || category.name;
      button.addEventListener("click", () => selectCategory(category.id));

      const title = document.createElement("span");
      title.className = "sidebar__title";
      title.textContent = category.name;

      const detail = document.createElement("span");
      detail.className = "sidebar__description";
      const descriptionText = category.description?.trim()
        ? category.description.trim()
        : "No description provided.";
      const count = counts[category.id] || 0;
      const countLabel = count
        ? ` • ${count} prompt${count === 1 ? "" : "s"}`
        : "";
      detail.textContent = `${descriptionText}${countLabel}`;

      button.append(title, detail);
      item.appendChild(button);
      list.appendChild(item);
    });

    container.appendChild(list);

    updateActionStates();
  }

  function renderPromptList() {
    const list = elements.promptItems;
    list.innerHTML = "";

    if (!state.categories.length) {
      elements.promptListTitle.value = "Prompts";
      elements.promptListTitle.disabled = true;
      elements.promptCount.textContent = "";
      return;
    }

    let title = getCategoryName(state.activeCategory);
    if (state.searchTerm) {
      title = `Results for “${state.searchTerm}”`;
    }
    elements.promptListTitle.value = title;
    elements.promptListTitle.disabled = Boolean(state.searchTerm);

    const count = state.filteredPrompts.length;
    elements.promptCount.textContent = count
      ? `${count} prompt${count === 1 ? "" : "s"}`
      : "No prompts found";

    if (!count) {
      return;
    }

    state.filteredPrompts.forEach((prompt) => {
      const item = document.createElement("li");
      item.className = "prompt-list__item";

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "prompt-list__button" +
        (state.activePromptId === prompt.id
          ? " prompt-list__button--active"
          : "");
      button.dataset.promptId = prompt.id;

      const titleLine = document.createElement("span");
      titleLine.textContent = prompt.name;
      button.appendChild(titleLine);

      if (prompt.description) {
        const description = document.createElement("span");
        description.className = "prompt-list__description";
        description.textContent = prompt.description;
        button.appendChild(description);
      }

      button.addEventListener("click", () => {
        if (state.activePromptId !== prompt.id || state.isDirty) {
          selectPrompt(prompt.id);
        }
      });

      item.appendChild(button);
      list.appendChild(item);
    });

    updateActionStates();
  }

  function resetEditor() {
    state.activePromptDetail = null;
    state.activePromptId = null;
    state.isDirty = false;
    elements.editorTitle.textContent = "Select a prompt";
    elements.editorDescription.textContent =
      "Choose a prompt from the list to view and edit its markdown file.";
    elements.editorMeta.innerHTML = "";
    elements.contentField.value = "";
    elements.contentField.disabled = true;
    elements.saveButton.disabled = true;
    updateActionStates();
  }

  function updateEditor(promptDetail) {
    state.activePromptDetail = promptDetail;
    state.isDirty = false;
    elements.editorTitle.textContent = promptDetail.name;
    elements.editorDescription.textContent =
      promptDetail.description || "No description provided.";

    const categoryName = getCategoryName(promptDetail.category);
    const updatedAt = promptDetail.updatedAt
      ? new Date(promptDetail.updatedAt).toLocaleString()
      : "Unknown";
    const argsLabel = promptDetail.arguments?.length
      ? promptDetail.arguments
          .map((arg) => `${arg.name}${arg.required ? "" : "?"}`)
          .join(", ")
      : "No arguments";

    elements.editorMeta.innerHTML = [
      `<span>Category: ${categoryName}</span>`,
      `<span>File: ${promptDetail.file}</span>`,
      `<span>Arguments: ${argsLabel}</span>`,
      `<span>Last updated: ${updatedAt}</span>`,
    ].join("");

    elements.contentField.disabled = false;
    elements.contentField.value = promptDetail.content;
    elements.saveButton.disabled = true;
    updateActionStates();
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          message = errorBody.error;
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
      throw new Error(message);
    }
    return response.json();
  }

  async function loadCatalog() {
    try {
      setStatus("Loading prompts…", "busy");
      const data = await fetchJson(routes.catalog);
      const promptsArray = data.prompts || [];
      state.prompts = promptsArray.map((prompt) => {
        const updatedAt = prompt.updatedAt || null;
        const updatedAtValue = updatedAt ? Date.parse(updatedAt) : 0;
        return {
          ...prompt,
          updatedAt,
          updatedAtValue,
          searchText: `${prompt.name} ${prompt.description || ""}`.toLowerCase(),
        };
      });

      state.prompts.sort((a, b) => b.updatedAtValue - a.updatedAtValue);

      const categoriesWithRecency = (data.categories || []).map((category) => {
        const latestPrompt = state.prompts.find(
          (prompt) => prompt.category === category.id
        );
        return {
          ...category,
          updatedAtValue: latestPrompt?.updatedAtValue ?? 0,
        };
      });

      categoriesWithRecency.sort(
        (a, b) => b.updatedAtValue - a.updatedAtValue
      );

      state.categories = categoriesWithRecency;
      ensureActiveCategory();
      applyFilters();
      renderCategories();
      renderPromptList();
      if (!state.filteredPrompts.length) {
        resetEditor();
      }
      setStatus("Catalog loaded.");
    } catch (error) {
      resetEditor();
      setStatus(error.message || "Failed to load prompts.", "error");
    }
  }

  async function createCategory() {
    const name = prompt("New category name?");
    if (!name) {
      return;
    }

    const suggestedId = slugify(name);
    let idInput = prompt("Category ID?", suggestedId) || suggestedId;
    idInput = slugify(idInput);

    if (!idInput) {
      alert("A category ID is required.");
      return;
    }

    const description = prompt("Category description?", "") || "";

    try {
      setStatus("Creating category…", "busy");
      await fetchJson("/api/v1/tools/create_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idInput, name, description }),
      });

      state.activeCategory = idInput;
      state.activePromptId = null;
      state.activePromptDetail = null;
      state.isDirty = false;

      await loadCatalog();
      setStatus(`Category “${name}” created.`);
    } catch (error) {
      setStatus(error.message || "Failed to create category.", "error");
    }
  }

  async function deleteCategory() {
    const categoryId = state.activeCategory;
    if (!categoryId) {
      alert("Select a category to delete.");
      return;
    }

    const categoryName = getCategoryName(categoryId);

    if (!confirm(`Delete category “${categoryName}” and its prompts?`)) {
      return;
    }

    try {
      setStatus("Deleting category…", "busy");
      await fetchJson(`/api/v1/categories/${encodeURIComponent(categoryId)}`, {
        method: "DELETE",
      });

      state.activeCategory = null;
      state.activePromptId = null;
      state.activePromptDetail = null;
      state.isDirty = false;

      await loadCatalog();
      resetEditor();
      setStatus(`Category “${categoryName}” deleted.`);
    } catch (error) {
      setStatus(error.message || "Failed to delete category.", "error");
    }
  }

  async function createPrompt() {
    let categoryId = state.activeCategory;
    if (!categoryId) {
      categoryId = prompt("Category ID for the new prompt?") || "";
      categoryId = slugify(categoryId);
    }

    if (!categoryId) {
      alert("A category ID is required to create a prompt.");
      return;
    }

    const categoryExists = state.categories.some(
      (category) => category.id === categoryId
    );

    if (!categoryExists) {
      alert(
        `Category “${categoryId}” does not exist. Create the category before adding prompts.`
      );
      return;
    }

    const name = prompt("Prompt name?");
    if (!name) {
      return;
    }

    const suggestedId = slugify(name);
    let promptId = prompt("Prompt ID?", suggestedId) || suggestedId;
    promptId = slugify(promptId);

    if (!promptId) {
      alert("A prompt ID is required.");
      return;
    }

    if (state.prompts.some((prompt) => prompt.id === promptId)) {
      alert(`Prompt ID “${promptId}” already exists.`);
      return;
    }

    const description = prompt("Prompt description?", "") || "";

    const defaultContent = `# ${name}

## Description
${description || "Describe what this prompt should achieve."}

## System Message
You are a helpful AI assistant. Update this section with instructions for the assistant.

## User Message Template
Provide input variables using {{placeholders}}.
`;

    try {
      setStatus("Creating prompt…", "busy");
      await fetchJson("/api/v1/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promptId,
          name,
          category: categoryId,
          description,
          content: defaultContent,
        }),
      });

      state.activeCategory = categoryId;
      state.activePromptId = promptId;
      state.activePromptDetail = null;
      state.isDirty = false;

      await loadCatalog();
      await selectPrompt(promptId);
      setStatus(`Prompt “${name}” created.`);
    } catch (error) {
      setStatus(error.message || "Failed to create prompt.", "error");
    }
  }

  async function deletePrompt() {
    const promptId = state.activePromptId;
    if (!promptId) {
      alert("Select a prompt to delete.");
      return;
    }

    const promptName = state.activePromptDetail?.name || promptId;

    if (!confirm(`Delete prompt “${promptName}”?`)) {
      return;
    }

    try {
      setStatus("Deleting prompt…", "busy");
      await fetchJson(`/api/v1/prompts/${encodeURIComponent(promptId)}`, {
        method: "DELETE",
      });

      state.activePromptId = null;
      state.activePromptDetail = null;
      state.isDirty = false;

      await loadCatalog();
      resetEditor();
      setStatus(`Prompt “${promptName}” deleted.`);
    } catch (error) {
      setStatus(error.message || "Failed to delete prompt.", "error");
    }
  }

  function updateActionStates() {
    if (elements.removeCategoryButton) {
      const hasActiveCategory = Boolean(state.activeCategory);
      elements.removeCategoryButton.disabled =
        !hasActiveCategory || !state.categories.length;
    }

    if (elements.addPromptButton) {
      elements.addPromptButton.disabled = state.categories.length === 0;
    }

    if (elements.removePromptButton) {
      elements.removePromptButton.disabled = !state.activePromptId;
    }
  }


  async function selectPrompt(promptId) {
    if (state.isDirty && !confirm("Discard unsaved changes?")) {
      return;
    }

    state.activePromptId = promptId;
    renderPromptList();

    try {
      setStatus("Loading prompt…", "busy");
      const detail = await fetchJson(routes.promptDetail(promptId));
      updateEditor(detail);
      setStatus(`Loaded “${detail.name}”.`);
    } catch (error) {
      setStatus(error.message || "Failed to load prompt.", "error");
    }
  }

  async function savePrompt() {
    if (!state.activePromptDetail || !state.activePromptId || state.isSaving) {
      return;
    }

    state.isSaving = true;
    elements.saveButton.disabled = true;
    setStatus("Saving…", "busy");

    try {
      const response = await fetchJson(routes.promptDetail(state.activePromptId), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: elements.contentField.value }),
      });

      state.isDirty = false;
      const savedAt = response.updatedAt
        ? new Date(response.updatedAt).toLocaleTimeString()
        : "now";

      // Refresh catalog metadata to pick up any changes (e.g., hot reload)
      await loadCatalog();

      if (state.activePromptId) {
        // Keep the selection highlighted after reload
        const restored = state.filteredPrompts.find(
          (prompt) => prompt.id === state.activePromptId
        );
        if (!restored) {
          state.activeCategory = null;
          applyFilters();
          renderPromptList();
        }
      }

      setStatus(`Saved at ${savedAt}.`);
    } catch (error) {
      elements.saveButton.disabled = false;
      setStatus(error.message || "Failed to save prompt.", "error");
    } finally {
      state.isSaving = false;
    }
  }

  function selectCategory(categoryId) {
    if (!categoryId) {
      return;
    }
    if (state.activeCategory === categoryId) {
      return;
    }
    state.activeCategory = categoryId;
    state.activePromptId = null;
    state.activePromptDetail = null;
    state.isDirty = false;
    applyFilters();
    renderCategories();
    renderPromptList();
    resetEditor();
    setStatus(`Viewing prompts in “${getCategoryName(categoryId)}”.`);
    if (!state.searchTerm.trim()) {
      elements.promptListTitle.disabled = false;
      requestAnimationFrame(() => {
        elements.promptListTitle.focus();
        elements.promptListTitle.select();
      });
    }
  }

  function handleSearchInput(event) {
    state.searchTerm = event.target.value || "";
    applyFilters();
    renderPromptList();
  }

  function handleContentInput() {
    if (!state.activePromptDetail) {
      return;
    }
    state.isDirty = true;
    elements.saveButton.disabled = false;
    setStatus("Unsaved changes.", "busy");
  }

  elements.saveButton.addEventListener("click", savePrompt);
  elements.contentField.addEventListener("input", handleContentInput);
  elements.searchInput.addEventListener("input", handleSearchInput);

  if (elements.addCategoryButton) {
    elements.addCategoryButton.addEventListener("click", createCategory);
  }

  if (elements.removeCategoryButton) {
    elements.removeCategoryButton.addEventListener("click", deleteCategory);
  }

  if (elements.addPromptButton) {
    elements.addPromptButton.addEventListener("click", createPrompt);
  }

  if (elements.removePromptButton) {
    elements.removePromptButton.addEventListener("click", deletePrompt);
  }

  async function renameActiveCategory() {
    if (elements.promptListTitle.disabled) {
      return;
    }

    const activeCategory = state.categories.find(
      (category) => category.id === state.activeCategory
    );

    if (!activeCategory) {
      return;
    }

    const newName = elements.promptListTitle.value.trim();

    if (!newName || newName === activeCategory.name) {
      elements.promptListTitle.value = activeCategory.name;
      return;
    }

    try {
      setStatus("Renaming category…", "busy");
      await fetchJson(routes.updateCategory(activeCategory.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });

      await loadCatalog();
      setStatus(`Category renamed to “${newName}”.`);
    } catch (error) {
      setStatus(error.message || "Failed to rename category.", "error");
      elements.promptListTitle.value = activeCategory.name;
    }
  }

  elements.promptListTitle.addEventListener("blur", renameActiveCategory);
  elements.promptListTitle.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      elements.promptListTitle.blur();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key.toLowerCase() === "s" &&
      !elements.saveButton.disabled
    ) {
      event.preventDefault();
      savePrompt();
    }
  });

  updateActionStates();
  loadCatalog();
})();
