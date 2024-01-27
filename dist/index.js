"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/greenhouse.ts
  var greenhouse = async () => {
    let current_page = 1;
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
    const REQUIRED_FIELDS = ["department", "title", "location", "content"];
    const mainElement = document.querySelector('[tc-greenhouse-element="main"]');
    const list = mainElement?.querySelector('[tc-greenhouse-element="list"]');
    const listElement = list?.querySelector('[tc-greenhouse-element="list-item"]');
    if (!mainElement || !list || !listElement)
      return;
    const errorComponent = mainElement?.querySelector('[tc-greenhouse-element="error"]');
    errorComponent.remove();
    const searchElement = mainElement?.querySelectorAll('[tc-greenhouse-element="search"]')[0];
    searchElement && searchElement.addEventListener("input", (e) => handleInputChange(e.target.value));
    let paginate = mainElement.getAttribute("tc-greenhouse-paginate") === "true" ? true : false;
    paginate ? addPagination() : addVerticalLoader();
    let contentSearch = mainElement.querySelector('[tc-greenhouse-content-search="true"]') ? true : false;
    let resultsPerPage = Number(mainElement.querySelector("[tc-greenhouse-results-per-page]")?.getAttribute("tc-greenhouse-results-per-page")) || 3;
    console.log(mainElement.querySelector("[tc-greenhouse-results-per-page]")?.getAttribute("tc-greenhouse-results-per-page"));
    const loader = mainElement?.querySelector('[tc-greenhouse-element="loader"]');
    const mainParent = mainElement.parentElement;
    const mainDisplayStyle = mainElement.style.display;
    mainElement.style.display = "none";
    mainParent.appendChild(loader);
    let componentData = await getDataFromGreenhouseAPI();
    mainParent.removeChild(loader);
    if (componentData instanceof Error)
      return renderErrorComponent();
    mainElement.style.display = mainDisplayStyle;
    setFilters();
    function renderErrorComponent() {
      mainElement.innerHTML = "";
      if (errorComponent)
        mainElement.appendChild(errorComponent);
      mainElement.style.display = mainDisplayStyle;
    }
    function renderList() {
      if (!listElement)
        return;
      let items = [];
      paginatedData.forEach((item) => {
        let newElement = listElement.cloneNode(true);
        newElement.style.display = "flex";
        newElement.style.opacity = "1";
        REQUIRED_FIELDS.forEach((field) => {
          newElement.querySelectorAll(`[tc-greenhouse-element="${field}"]`).forEach((element) => {
            if (field === "location") {
              element.innerHTML = item.location.name;
            } else {
              element.textContent = item[field];
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
        let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
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
  window.Webflow.push(() => {
    greenhouse();
  });
})();
//# sourceMappingURL=index.js.map
