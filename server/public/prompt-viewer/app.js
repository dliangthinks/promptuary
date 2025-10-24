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
  };

  const routes = {
    catalog: "/prompts",
    promptDetail: (id) => `/api/v1/prompts/${encodeURIComponent(id)}`,
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

  function getCategoryName(categoryId) {
    if (!categoryId) return "All prompts";
    const category = state.categories.find((item) => item.id === categoryId);
    return category ? category.name : categoryId;
  }

  function applyFilters() {
    const trimmedSearch = state.searchTerm.trim().toLowerCase();
    state.filteredPrompts = state.prompts.filter((prompt) => {
      const matchesCategory =
        !state.activeCategory || prompt.category === state.activeCategory;
      const matchesSearch =
        !trimmedSearch ||
        prompt.searchText.includes(trimmedSearch) ||
        prompt.id.toLowerCase().includes(trimmedSearch);
      return matchesCategory && matchesSearch;
    });
  }

  function renderCategories() {
    const container = elements.categoryList;
    container.innerHTML = "";

    const counts = state.prompts.reduce((acc, prompt) => {
      acc[prompt.category] = (acc[prompt.category] || 0) + 1;
      return acc;
    }, {});

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.className =
      "sidebar__prompt" +
      (state.activeCategory === null ? " sidebar__prompt--active" : "");
    allButton.textContent = `All Prompts (${state.prompts.length})`;
    allButton.addEventListener("click", () => selectCategory(null));
    container.appendChild(allButton);

    state.categories.forEach((category) => {
      const wrapper = document.createElement("div");
      wrapper.className = "sidebar__category";

      const title = document.createElement("p");
      title.className = "sidebar__category-title";
      title.textContent = category.name;
      wrapper.appendChild(title);

      const button = document.createElement("button");
      button.type = "button";
      button.className =
        "sidebar__prompt" +
        (state.activeCategory === category.id
          ? " sidebar__prompt--active"
          : "");
      const count = counts[category.id] || 0;
      button.textContent = count
        ? `${category.name} (${count})`
        : `${category.name}`;
      button.addEventListener("click", () => selectCategory(category.id));

      wrapper.appendChild(button);
      container.appendChild(wrapper);
    });
  }

  function renderPromptList() {
    const list = elements.promptItems;
    list.innerHTML = "";

    let title = "All Prompts";
    if (state.searchTerm) {
      title = `Results for “${state.searchTerm}”`;
    } else if (state.activeCategory) {
      title = getCategoryName(state.activeCategory);
    }
    elements.promptListTitle.textContent = title;

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
      state.categories = data.categories || [];
      state.prompts = (data.prompts || []).map((prompt) => ({
        ...prompt,
        searchText: `${prompt.name} ${prompt.description || ""}`.toLowerCase(),
      }));
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
    if (state.activeCategory === categoryId) {
      return;
    }
    state.activeCategory = categoryId;
    applyFilters();
    renderCategories();
    renderPromptList();
    resetEditor();
    setStatus(
      categoryId
        ? `Viewing prompts in “${getCategoryName(categoryId)}”.`
        : "Viewing all prompts."
    );
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

  loadCatalog();
})();
