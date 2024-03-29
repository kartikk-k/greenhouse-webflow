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

  const ALLOWED_FIELDS = ['department', 'title', 'location', 'content', 'link']

  // components required
  const mainElement = document.querySelector('[tc-greenhouse-element="main"]') as HTMLDivElement;
  const list = mainElement?.querySelector('[tc-greenhouse-element="list"]') as HTMLDivElement;
  const listElement = list?.querySelector('[tc-greenhouse-element="list-item"]') as HTMLDivElement;

  if (!mainElement || !list || !listElement) return // essentials/required

  const errorComponent = mainElement?.querySelector('[tc-greenhouse-element="error"]') as HTMLElement
  errorComponent?.remove()
  const emptyComponent = mainElement?.querySelector('[tc-greenhouse-element="empty-state"]') as HTMLElement
  emptyComponent?.remove()

  const searchElement = mainElement?.querySelectorAll('[tc-greenhouse-element="search"]')[0] as HTMLInputElement;
  // @ts-ignore
  searchElement && searchElement.addEventListener('input', e => handleInputChange(e.target.value))

  // settings
  let paginate: boolean = mainElement.getAttribute('tc-greenhouse-paginate') === 'true' ? true : false // default - false
  paginate ? addPagination() : addVerticalLoader()

  let resultsPerPage = Number(mainElement.getAttribute('tc-greenhouse-results-per-page')) || 5 // default - 5

  // --------------------- main api call ---------------------
  const loader = mainElement.querySelector('[tc-greenhouse-element="loader"]') as HTMLElement
  const mainParent = mainElement.parentElement as HTMLElement

  const mainDisplayStyle = mainElement.style.display
  mainElement.style.display = 'none'
  if (loader) mainParent.appendChild(loader)

  let componentData = await getDataFromGreenhouseAPI()
  if (loader) mainParent.removeChild(loader)
  if (componentData instanceof Error) return renderErrorComponent(componentData.message)
  mainElement.style.display = mainDisplayStyle

  setFilters()

  function renderErrorComponent(err: string) {
    mainElement.innerHTML = ''
    if (err === 'No jobs found') {
      if (emptyComponent) mainElement.appendChild(emptyComponent)
    } else if (errorComponent) {
      mainElement.appendChild(errorComponent)
    }
    mainElement.style.display = mainDisplayStyle
  }

  function renderList() {
    if (!listElement) return
    handlePaginateButtonStatus()

    let items: HTMLElement[] = []

    // creating list of elements
    paginatedData.forEach(item => {
      let newElement = listElement!.cloneNode(true) as HTMLElement
    
      ALLOWED_FIELDS.forEach(field => {
        // find all elements of the current field
        newElement.querySelectorAll(`[tc-greenhouse-element="${field}"]`).forEach(element => {
          // replacing with actual data
          if (field === 'location') {
            element.innerHTML = item.location.name
          } else if (field === 'department') {
            console.log(item.departments)
            element.innerHTML = item.departments[0]?.name
          } else if (field === 'link') {
            element.setAttribute('href', item.absolute_url || '#')
          }else if (field === 'content') {
            
          } 
          else {
            element.innerHTML = item[field as keyof job]
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
    if (paginate) {
      paginatedData = filteredData.slice((current_page - 1) * resultsPerPage, current_page * resultsPerPage)
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
    const nextButton = document.getElementsByClassName('w-pagination-next')[0]
    const previousButton = document.getElementsByClassName('w-pagination-previous')[0]

    nextButton?.addEventListener('click', handleNext)
    previousButton?.addEventListener('click', handlePrevious)
  }

  function handlePaginateButtonStatus() {
    if (paginate) {
      const nextButton = document.getElementsByClassName('w-pagination-next')[0] as HTMLElement
      const previousButton = document.getElementsByClassName('w-pagination-previous')[0] as HTMLElement
      if (!nextButton || !previousButton) return
      if (current_page === 1) {
        previousButton.style.display = 'none'
        nextButton.style.display = 'inline-block'
      } else if (current_page === Math.ceil(filteredData!.length / resultsPerPage)) {
        nextButton.style.display = 'none'
        previousButton.style.display = 'inline-block'
      } else if (filteredData?.length <= resultsPerPage) {
        nextButton.style.display = 'none'
        previousButton.style.display = 'none'
      } else {
        nextButton.style.display = 'inline-block'
        previousButton.style.display = 'inline-block'
      }
    } else {
      const loadMoreButton = mainElement?.querySelector('[tc-greenhouse-element="load-more"]') as HTMLElement
      if (!loadMoreButton) return
      if (current_page === Math.ceil(filteredData!.length / resultsPerPage) || filteredData?.length <= resultsPerPage) {
        loadMoreButton.style.display = 'none'
      } else {
        loadMoreButton.style.display = 'inline-block'
      }
    }
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

    filteredData = sortedData
    current_page = 1
    setCurrentPageData()
  }


  async function getDataFromGreenhouseAPI() {

    // fake await promise
    // await new Promise(resolve => setTimeout(resolve, 2000)); // waits for 2 seconds

    let data: job[] = []

    try {
      const board_id = mainElement.getAttribute('tc-greenhouse-board-id')
      if (!board_id) throw new Error('Board id not found')

      const fetch_content = mainElement.getAttribute('tc-greenhouse-content') === 'true' ? true : false

      let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board_id}/jobs?content=${true}`, {
        method: 'GET',
      }).then(res => res.json())

      // throw new Error('No jobs found')

      // throw new Error('Something went wrong')
      if (!res.jobs) throw new Error('No jobs found')
      data = res.jobs

    } catch (err) {
      return err
    }

    apiData = data
    filteredData = data
    setCurrentPageData()
  }
};
