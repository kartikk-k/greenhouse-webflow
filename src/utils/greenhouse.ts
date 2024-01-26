

export const greenhouse = async () => {
  let current_page = 1;

  let apiData: undefined | null | job[] = [] // all data from api response
  let dataStore: job[] = [] // used for search
  let filteredData: job[] = [] // all data with filters/search applied
  let paginatedData: job[] = [] // paginated data

  let filters: filter[] = [{
    name: 'department',
    options: ['All Departments']
  }, {
    name: 'location',
    options: ['All Locations']
  }]

  let REQUIRED_FIELDS = ['department', 'title', 'location', 'content']

  // components required
  let mainElement = document.querySelector('[tc-greenhouse-element="main"]');
  let list = mainElement?.querySelector('[tc-greenhouse-element="list"]');
  let listElement = list?.querySelector('[tc-greenhouse-element="list-item"]');

  if (!mainElement || !list || !listElement) return // essentials/required

  let searchElement = mainElement?.querySelectorAll('[tc-greenhouse-element="search"]')[0] as HTMLInputElement;
  // @ts-ignore
  searchElement && searchElement.addEventListener('input', e => handleInputChange(e.target.value))

  // settings
  let paginate: boolean = mainElement.getAttribute('tc-greenhouse-paginate') === 'true' ? true : false // default - false
  paginate ? addPagination() : addVerticalLoader()

  let contentSearch: boolean = mainElement.querySelector('[tc-greenhouse-content-search="true"]') ? true : false // default - false
  //  --- pending ----
  let resultsPerPage = Number(mainElement.querySelector('[tc-greenhouse-results-per-page]')?.getAttribute('tc-greenhouse-results-per-page')) || 3 // default - 3
  console.log((mainElement.querySelector('[tc-greenhouse-results-per-page]')?.getAttribute('tc-greenhouse-results-per-page')))



  await getDataFromGreenhouseAPI()
  setFilters()

  function renderList() {
    if (!listElement) return

    let items: HTMLElement[] = []

    // creating list of elements
    paginatedData.forEach(item => {
      let newElement = listElement!.cloneNode(true) as HTMLElement

      newElement.style.display = 'flex'
      newElement.style.opacity = '1'
      REQUIRED_FIELDS.forEach(field => {
        // find all elements of the current field
        newElement.querySelectorAll(`[tc-greenhouse-element="${field}"]`).forEach(element => {
          // replacing with actual data
          if (field === 'location') {
            element.innerHTML = item.location.name
          } else {
            element.textContent = item[field as keyof job]
          }
        })
      })
      items.push(newElement)
    })

    // clearing current list of elements
    list!.innerHTML = ''
    list?.append(...items)
  }

  function setCurrentPageData() {
    if (!filteredData) return
    console.log("current_page", current_page)
    if (paginate) {
      paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
      console.log("paginatedData", paginatedData)
    } else {
      if (!paginatedData.length) paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
      // change on search
      else {
        paginatedData = filteredData.slice(0, resultsPerPage * current_page)
      }
    }
    renderList()
  }

  function handleInputChange(value: string) {
    if (!apiData) return
    console.log(value.trim())
    if (!value.trim()) {
      filteredData = dataStore
      dataStore = []
    } else {
      if (!dataStore.length) dataStore = filteredData

      filteredData = dataStore.filter(item => {
        return item.title.trim().toLowerCase().includes(value.trim().toLowerCase())
        // ||
        //   item.content.toLowerCase().includes(value.toLowerCase())
      })
    }
    setCurrentPageData()
  }

  function addVerticalLoader() {
    const loadMoreButton = mainElement?.querySelector('[tc-greenhouse-element="load-more"]')
    console.log(loadMoreButton)
    loadMoreButton?.addEventListener('click', handleLoadMore)
  }

  function handleLoadMore() {
    if (current_page < Math.ceil(filteredData!.length / resultsPerPage)) {
      current_page++
      const newData = filteredData!.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
      paginatedData = paginatedData.concat(newData)
      renderList()
    }
  }

  function addPagination() {
    // add on click on next and previous buttons
    const nextButton = document.getElementsByClassName('wf-next')[0]
    const previousButton = document.getElementsByClassName('wf-previous')[0]

    nextButton?.addEventListener('click', handleNext)
    previousButton?.addEventListener('click', handlePrevious)
  }

  function handlePrevious() {
    if (current_page > 1) {
      current_page--
      paginatedData = filteredData!.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
      renderList()
    }
    list?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleNext() {
    if (current_page < Math.ceil(filteredData!.length / resultsPerPage)) {
      current_page++
      paginatedData = filteredData!.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
      renderList()
    }
    list?.scrollIntoView({ behavior: 'smooth' })
  }

  function setFilters() {
    let filter_options = filters.map(filter => filter.name)

    if (!apiData) return

    // set filters
    apiData.forEach(item => {
      let existing_department = filters[0].options.map(option => option)
      let existing_location = filters[1].options.map(option => option)

      // department
      let department = item.departments[0].name
      let location = item.location.name

      // department
      if (!existing_department.includes(department)) filters[0].options.push(item.departments[0].name)
      // location
      if (!existing_location.includes(location)) filters[1].options.push(item.location.name)
    })

    let filterElements = mainElement?.querySelectorAll('[tc-greenhouse-filter]') as NodeListOf<HTMLSelectElement>
    console.log(filterElements, "filterElements")

    if (filterElements?.length) filterElements.forEach(item => {

      let filter_type = item.getAttribute('tc-greenhouse-filter') as string

      if (filter_options.includes(filter_type)) { // check if valid filter
        let options = filters.find(filter => filter.name === filter_type)?.options
        if (options?.length) {
          options.forEach(option => {
            let newOption = document.createElement('option')
            newOption.value = option
            newOption.textContent = option
            item.appendChild(newOption)
          })
        }
      }

      item.onchange = (e) => { handleFilterChange(e) }
    })


  }

  function handleFilterChange(e: Event) {
    if (!apiData) return
    console.log(e.target)

    const locationFilter = document.querySelector('[tc-greenhouse-filter="location"]') as HTMLSelectElement
    const departmentFilter = document.querySelector('[tc-greenhouse-filter="department"]') as HTMLSelectElement

    let sortedData: job[] = []

    if (locationFilter?.value && departmentFilter?.value) {

      if (locationFilter.value === 'All Locations' && departmentFilter.value === 'All Departments') sortedData = apiData
      else if (locationFilter.value === 'All Locations') {
        apiData.forEach(item => {
          if (item.departments[0].name === departmentFilter.value) {
            sortedData.push(item)
          }
        })
      } else if (departmentFilter.value === 'All Departments') {
        apiData.forEach(item => {
          if (item.location.name === locationFilter.value) {
            sortedData.push(item)
          }
        })
      } else {
        apiData.forEach(item => {
          if (item.departments[0].name === departmentFilter.value && item.location.name === locationFilter.value) {
            sortedData.push(item)
          }
        })
      }
    }

    console.log(sortedData.length)
    filteredData = sortedData
    current_page = 1
    setCurrentPageData()
  }


  async function getDataFromGreenhouseAPI() {

    // fake await promise
    // await new Promise(resolve => setTimeout(resolve, 5000)); // waits for 2 seconds

    let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
      method: 'GET',
    }).then(res => res.json()).catch(err => console.log(err))

    apiData = res.jobs
    filteredData = res.jobs
    setCurrentPageData()
  }
};
