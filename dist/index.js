"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`${"http://localhost:3000"}/esbuild`).addEventListener("change", () => location.reload());

  // src/utils/greenhouse.ts
  var results_per_page = 5;
  var current_page = 1;
  var dataStore;
  var currentData = [];
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
  };
  function renderList() {
    if (!listElement)
      return;
    let items = [];
    currentData.forEach((item) => {
      let newElement = listElement.cloneNode(true);
      newElement.style.display = "block";
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
  function setCurrentPageData(data) {
    currentData = data.slice((current_page - 1) * results_per_page, current_page * results_per_page);
    console.log("currentData", currentData);
    renderList();
  }
  function handlePrevious() {
    console.log("clicked previous");
    if (current_page > 1) {
      current_page--;
      currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page);
      renderList();
    }
    list?.scrollIntoView({ behavior: "smooth" });
  }
  function handleNext() {
    console.log("clicked next");
    if (current_page < Math.ceil(dataStore.length / results_per_page)) {
      current_page++;
      currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page);
      renderList();
    }
    list?.scrollIntoView({ behavior: "smooth" });
  }
  async function getDataFromGreenhouseAPI() {
    let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
      method: "GET"
    }).then((res2) => res2.json());
    dataStore = res.jobs;
    setCurrentPageData(dataStore);
    console.log(res);
  }

  // src/index.ts
  window.Webflow ||= [];
  window.onload = () => {
    greenhouse();
  };
})();
//# sourceMappingURL=index.js.map
