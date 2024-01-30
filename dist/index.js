"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/greenhouse.ts
  var greenhouse = async () => {
    const hiddenStyle = document.createElement("hidden");
    hiddenStyle.style.display = "hidden";
    let current_page = 1;
    let max_page = 1;
    let apiData = [];
    let dataStore = [];
    let filteredData = [];
    let paginatedData = [];
    let filters = [{
      name: "department",
      options: ["All Departments"]
    }, {
      name: "location",
      options: ["All Locations"]
    }];
    const ALLOWED_FIELDS = ["department", "title", "location", "content", "open"];
    const mainElement = document.querySelector('[tc-greenhouse-element="main"]');
    const list = mainElement?.querySelector('[tc-greenhouse-element="list"]');
    const listElement = list?.querySelector('[tc-greenhouse-element="list-item"]');
    if (!mainElement || !list || !listElement)
      return;
    const errorComponent = mainElement?.querySelector('[tc-greenhouse-element="error"]');
    errorComponent?.remove();
    const emptyComponent = mainElement?.querySelector('[tc-greenhouse-element="empty-state"]');
    emptyComponent?.remove();
    const searchElement = mainElement?.querySelectorAll('[tc-greenhouse-element="search"]')[0];
    searchElement && searchElement.addEventListener("input", (e) => handleInputChange(e.target.value));
    let paginate = mainElement.getAttribute("tc-greenhouse-paginate") === "true" ? true : false;
    paginate ? addPagination() : addVerticalLoader();
    let contentSearch = mainElement.querySelector('[tc-greenhouse-content-search="true"]') ? true : false;
    let resultsPerPage = Number(mainElement.getAttribute("tc-greenhouse-results-per-page")) || 5;
    const loader = mainElement.querySelector('[tc-greenhouse-element="loader"]');
    const mainParent = mainElement.parentElement;
    const mainDisplayStyle = mainElement.style.display;
    mainElement.style.display = "none";
    if (loader)
      mainParent.appendChild(loader);
    console.log(loader);
    let componentData = await getDataFromGreenhouseAPI();
    if (loader)
      mainParent.removeChild(loader);
    if (componentData instanceof Error)
      return renderErrorComponent(componentData.message);
    mainElement.style.display = mainDisplayStyle;
    setFilters();
    function renderErrorComponent(err) {
      mainElement.innerHTML = "";
      if (err === "No jobs found") {
        if (emptyComponent)
          mainElement.appendChild(emptyComponent);
        console.log(emptyComponent);
      } else if (errorComponent) {
        mainElement.appendChild(errorComponent);
      }
      mainElement.style.display = mainDisplayStyle;
    }
    function renderList() {
      if (!listElement)
        return;
      handlePaginateButtonStatus();
      let items = [];
      paginatedData.forEach((item) => {
        let newElement = listElement.cloneNode(true);
        ALLOWED_FIELDS.forEach((field) => {
          newElement.querySelectorAll(`[tc-greenhouse-element="${field}"]`).forEach((element) => {
            if (field === "location") {
              element.innerHTML = item.location.name;
            } else if (field === "department") {
              element.innerHTML = item.departments[0].name;
            } else if (field === "open") {
              element.setAttribute("href", item.absolute_url || "#");
            } else if (field === "content") {
            } else {
              element.innerHTML = item[field];
            }
          });
        });
        items.push(newElement);
      });
      list.innerHTML = "";
      list?.append(...items);
    }
    function setCurrentPageData() {
      if (!filteredData)
        return;
      console.log("current_page", current_page);
      if (paginate) {
        paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage);
        console.log("paginatedData", paginatedData);
      } else {
        if (!paginatedData.length)
          paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage);
        else {
          paginatedData = filteredData.slice(0, resultsPerPage * current_page);
        }
      }
      renderList();
    }
    function handleInputChange(value) {
      if (!apiData)
        return;
      console.log(value.trim());
      if (!value.trim()) {
        filteredData = dataStore;
        dataStore = [];
      } else {
        if (!dataStore.length)
          dataStore = filteredData;
        filteredData = dataStore.filter((item) => {
          return item.title.trim().toLowerCase().includes(value.trim().toLowerCase());
        });
      }
      setCurrentPageData();
    }
    function addVerticalLoader() {
      const loadMoreButton = mainElement?.querySelector('[tc-greenhouse-element="load-more"]');
      console.log(loadMoreButton);
      loadMoreButton?.addEventListener("click", handleLoadMore);
    }
    function handleLoadMore() {
      if (current_page < Math.ceil(filteredData.length / resultsPerPage)) {
        current_page++;
        const newData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage);
        paginatedData = paginatedData.concat(newData);
        renderList();
      }
    }
    function addPagination() {
      const nextButton = document.getElementsByClassName("wf-next")[0];
      const previousButton = document.getElementsByClassName("wf-previous")[0];
      nextButton?.addEventListener("click", handleNext);
      previousButton?.addEventListener("click", handlePrevious);
    }
    function handlePaginateButtonStatus() {
      if (paginate) {
        const nextButton = document.getElementsByClassName("wf-next")[0];
        const previousButton = document.getElementsByClassName("wf-previous")[0];
        if (!nextButton || !previousButton)
          return;
        if (current_page === 1) {
          previousButton.classList.add("hidden");
          nextButton.classList.remove("hidden");
        } else if (current_page === Math.ceil(filteredData.length / resultsPerPage)) {
          nextButton.classList.add("hidden");
          previousButton.classList.remove("hidden");
        } else if (filteredData?.length <= resultsPerPage) {
          nextButton.classList.add("hidden");
          previousButton.classList.add("hidden");
        } else {
          nextButton.classList.remove("hidden");
          previousButton.classList.remove("hidden");
        }
      } else {
        const loadMoreButton = mainElement?.querySelector('[tc-greenhouse-element="load-more"]');
        if (!loadMoreButton)
          return;
        if (current_page === Math.ceil(filteredData.length / resultsPerPage) || filteredData?.length <= resultsPerPage) {
          loadMoreButton.classList.add("hidden");
        } else {
          loadMoreButton.classList.remove("hidden");
        }
      }
    }
    function handlePrevious() {
      if (current_page > 1) {
        current_page--;
        paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage);
        renderList();
      }
      list?.scrollIntoView({ behavior: "smooth" });
    }
    function handleNext() {
      if (current_page < Math.ceil(filteredData.length / resultsPerPage)) {
        current_page++;
        paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage);
        renderList();
      }
      list?.scrollIntoView({ behavior: "smooth" });
    }
    function setFilters() {
      let filter_options = filters.map((filter) => filter.name);
      if (!apiData)
        return;
      apiData.forEach((item) => {
        let existing_department = filters[0].options.map((option) => option);
        let existing_location = filters[1].options.map((option) => option);
        let department = item.departments[0].name;
        let location2 = item.location.name;
        if (!existing_department.includes(department))
          filters[0].options.push(item.departments[0].name);
        if (!existing_location.includes(location2))
          filters[1].options.push(item.location.name);
      });
      let filterElements = mainElement?.querySelectorAll("[tc-greenhouse-filter]");
      console.log(filterElements, "filterElements");
      if (filterElements?.length)
        filterElements.forEach((item) => {
          let filter_type = item.getAttribute("tc-greenhouse-filter");
          if (filter_options.includes(filter_type)) {
            let options = filters.find((filter) => filter.name === filter_type)?.options;
            if (options?.length) {
              options.forEach((option) => {
                let newOption = document.createElement("option");
                newOption.value = option;
                newOption.textContent = option;
                item.appendChild(newOption);
              });
            }
          }
          item.onchange = (e) => {
            handleFilterChange(e);
          };
        });
    }
    function handleFilterChange(e) {
      if (!apiData)
        return;
      console.log(e.target);
      const locationFilter = document.querySelector('[tc-greenhouse-filter="location"]');
      const departmentFilter = document.querySelector('[tc-greenhouse-filter="department"]');
      let sortedData = [];
      if (locationFilter?.value && departmentFilter?.value) {
        if (locationFilter.value === "All Locations" && departmentFilter.value === "All Departments")
          sortedData = apiData;
        else if (locationFilter.value === "All Locations") {
          apiData.forEach((item) => {
            if (item.departments[0].name === departmentFilter.value) {
              sortedData.push(item);
            }
          });
        } else if (departmentFilter.value === "All Departments") {
          apiData.forEach((item) => {
            if (item.location.name === locationFilter.value) {
              sortedData.push(item);
            }
          });
        } else {
          apiData.forEach((item) => {
            if (item.departments[0].name === departmentFilter.value && item.location.name === locationFilter.value) {
              sortedData.push(item);
            }
          });
        }
      }
      console.log(sortedData.length);
      filteredData = sortedData;
      current_page = 1;
      setCurrentPageData();
    }
    async function getDataFromGreenhouseAPI() {
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      let data = [];
      try {
        const board_id = mainElement.getAttribute("tc-greenhouse-board-id");
        if (!board_id)
          throw new Error("Board id not found");
        const fetch_content = mainElement.getAttribute("tc-greenhouse-content") === "true" ? true : false;
        let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board_id}/jobs?content=${fetch_content}`, {
          method: "GET"
        }).then((res2) => res2.json());
        if (!res.jobs)
          throw new Error("No jobs found");
        data = res.jobs;
      } catch (err) {
        return err;
      }
      apiData = data;
      filteredData = data;
      setCurrentPageData();
    }
  };

  // src/index.ts
  window.Webflow ||= [];
  window.onload = () => {
    greenhouse();
  };
})();
//# sourceMappingURL=index.js.map
