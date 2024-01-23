"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/greenhouse.ts
  var results_per_page = 3;
  var current_page = 1;
  var allData = [];
  var dataStore;
  var currentData = [];
  var filters = [{
    name: "department",
    options: ["All Departments"]
  }, {
    name: "location",
    options: ["All Locations"]
  }];
  var mainElement;
  var list;
  var listElement;
  var REQUIRED_FIELDS = ["department", "title", "location", "content"];
  var greenhouse = async () => {
    mainElement = document.querySelectorAll('[tc-greenhouse-element="main"]')[0];
    list = mainElement?.querySelectorAll('[tc-greenhouse-element="list"]')[0];
    listElement = list?.querySelectorAll('[tc-greenhouse-element="list-item"]')[0];
    if (!mainElement || !list || !listElement)
      return;
    const nextButton = document.getElementsByClassName("wf-next")[0];
    const previousButton = document.getElementsByClassName("wf-previous")[0];
    nextButton.addEventListener("click", handleNext);
    previousButton.addEventListener("click", handlePrevious);
    await getDataFromGreenhouseAPI();
    setFilters();
  };
  function renderList() {
    if (!listElement)
      return;
    let items = [];
    currentData.forEach((item) => {
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
    if (!dataStore)
      return;
    console.log("current_page", current_page);
    currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page);
    console.log("currentData", currentData);
    renderList();
  }
  function handlePrevious() {
    if (current_page > 1) {
      current_page--;
      currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page);
      renderList();
    }
    list?.scrollIntoView({ behavior: "smooth" });
  }
  function handleNext() {
    if (current_page < Math.ceil(dataStore.length / results_per_page)) {
      current_page++;
      currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page);
      renderList();
    }
    list?.scrollIntoView({ behavior: "smooth" });
  }
  function setFilters() {
    let filter_options = filters.map((filter) => filter.name);
    allData.forEach((item) => {
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
    const locationFilter = document.querySelector('[tc-greenhouse-filter="location"]');
    const departmentFilter = document.querySelector('[tc-greenhouse-filter="department"]');
    let filteredData = [];
    if (locationFilter?.value && departmentFilter?.value) {
      if (locationFilter.value === "All Locations" && departmentFilter.value === "All Departments")
        filteredData = allData;
      else if (locationFilter.value === "All Locations") {
        allData.forEach((item) => {
          if (item.departments[0].name === departmentFilter.value) {
            filteredData.push(item);
          }
        });
      } else if (departmentFilter.value === "All Departments") {
        allData.forEach((item) => {
          if (item.location.name === locationFilter.value) {
            filteredData.push(item);
          }
        });
      } else {
        allData.forEach((item) => {
          if (item.departments[0].name === departmentFilter.value && item.location.name === locationFilter.value) {
            filteredData.push(item);
          }
        });
      }
    }
    console.log(filteredData.length);
    dataStore = filteredData;
    current_page = 1;
    setCurrentPageData();
  }
  async function getDataFromGreenhouseAPI() {
    let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
      method: "GET"
    }).then((res2) => res2.json()).catch((err) => console.log(err));
    allData = res.jobs;
    dataStore = res.jobs;
    setCurrentPageData();
  }

  // src/index.ts
  window.Webflow ||= [];
  window.onload = () => {
    greenhouse();
  };
})();
//# sourceMappingURL=index.js.map
