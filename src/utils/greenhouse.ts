
let results_per_page = 3;
let current_page = 1;

let allData: job[] = []
let dataStore: undefined | null | job[]

let currentData: job[] = []

let filters: filter[] = [{
  name: 'department',
  options: ['All Departments']
}, {
  name: 'location',
  options: ['All Locations']
}]

let activeFilters: activeFilter[] = []

// components required
let mainElement: Element | undefined
let list: Element | undefined
let listElement: Element | undefined

let REQUIRED_FIELDS = ['department', 'title', 'location', 'content']

export const greenhouse = async () => {

  // Getting all the required elements
  mainElement = document.querySelectorAll('[tc-greenhouse-element="main"]')[0];
  list = mainElement?.querySelectorAll('[tc-greenhouse-element="list"]')[0];
  listElement = list?.querySelectorAll('[tc-greenhouse-element="list-item"]')[0];

  if (!mainElement || !list || !listElement) return

  // add on click on next and previous buttons
  const nextButton = document.getElementsByClassName('wf-next')[0]
  const previousButton = document.getElementsByClassName('wf-previous')[0]

  nextButton.addEventListener('click', handleNext)
  previousButton.addEventListener('click', handlePrevious)

  await getDataFromGreenhouseAPI()
  setFilters()
};

function renderList() {
  if (!listElement) return

  let items: HTMLElement[] = []

  // creating list of elements
  currentData.forEach(item => {
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
  if (!dataStore) return
  currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page)
  console.log("currentData", currentData)
  renderList()
}

function handlePrevious() {
  if (current_page > 1) {
    current_page--
    currentData = dataStore!.slice((current_page - 1) * results_per_page, current_page * results_per_page)
    renderList()
  }
  list?.scrollIntoView({ behavior: 'smooth' })
}

function handleNext() {
  if (current_page < Math.ceil(dataStore!.length / results_per_page)) {
    current_page++
    currentData = dataStore!.slice((current_page - 1) * results_per_page, current_page * results_per_page)
    renderList()
  }
  list?.scrollIntoView({ behavior: 'smooth' })
}

function setFilters() {
  let filter_options = filters.map(filter => filter.name)

  // set filters
  allData.forEach(item => {
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
  const value = (e.target as HTMLSelectElement).value

  if (value === 'All Departments' || value === 'All Locations') {
    dataStore = allData
    setCurrentPageData()
    activeFilters = []
    return
  }

  let filter_type = (e.target as HTMLSelectElement).getAttribute('tc-greenhouse-filter') as string

  activeFilters.push({
    name: filter_type,
    options: value
  })

  applyFilters()
}

function applyFilters() {
  let filteredData: job[] = []

  activeFilters.forEach(filter => {
    filteredData = allData.filter(item => {
      let isExists = false
      if (currentData.find(data => data.id === item.id)) isExists = true
      if (!isExists) {
        if (filter.name === 'department') {
          return item.departments[0].name === filter.options
        } else if (filter.name === 'location') {
          return item.location.name === filter.options
        }
      }

    })
  })

  console.log(filteredData.length)

  dataStore = filteredData
  setCurrentPageData()
}

async function getDataFromGreenhouseAPI() {
  let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
    method: 'GET',
  }).then(res => res.json()).catch(err => console.log(err))

  allData = res.jobs
  dataStore = res.jobs
  setCurrentPageData()
}