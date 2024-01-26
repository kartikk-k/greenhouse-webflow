
let results_per_page = 3;
let current_page = 1;

let allData: job[] = [] // all data from api response
let dataStore: undefined | null | job[] // all data with filters/search applied

let currentData: job[] = [] // paginated data

let filters: filter[] = [{
  name: 'department',
  options: ['All Departments']
}, {
  name: 'location',
  options: ['All Locations']
}]

// components required
let mainElement: Element | undefined
let list: Element | undefined
let listElement: Element | undefined
let searchElement: HTMLInputElement | undefined

let REQUIRED_FIELDS = ['department', 'title', 'location', 'content']

export const greenhouse = async () => {

  // Getting all the required elements
  mainElement = document.querySelectorAll('[tc-greenhouse-element="main"]')[0];
  list = mainElement?.querySelectorAll('[tc-greenhouse-element="list"]')[0];
  listElement = list?.querySelectorAll('[tc-greenhouse-element="list-item"]')[0];
  searchElement = mainElement?.querySelectorAll('[tc-greenhouse-element="search"]')[0] as HTMLInputElement;

  // @ts-ignore
  searchElement.addEventListener('input', e => handleInputChange(e.target.value))


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
  console.log("current_page", current_page)
  currentData = dataStore.slice((current_page - 1) * results_per_page, current_page * results_per_page)
  console.log("currentData", currentData)
  renderList()
}

function handleInputChange(value: string) {
  if (!dataStore) return
  console.log("hello")
  if (!value.trim()) {
    dataStore = allData
  } else {
    dataStore = dataStore!.filter(item => {
      return item.title.toLowerCase().includes(value.toLowerCase())
      // ||
      //   item.content.toLowerCase().includes(value.toLowerCase())
    })
  }
  setCurrentPageData()
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

  const locationFilter = document.querySelector('[tc-greenhouse-filter="location"]') as HTMLSelectElement
  const departmentFilter = document.querySelector('[tc-greenhouse-filter="department"]') as HTMLSelectElement

  let filteredData: job[] = []

  if (locationFilter?.value && departmentFilter?.value) {

    if (locationFilter.value === 'All Locations' && departmentFilter.value === 'All Departments') filteredData = allData
    else if (locationFilter.value === 'All Locations') {
      allData.forEach(item => {
        if (item.departments[0].name === departmentFilter.value) {
          filteredData.push(item)
        }
      })
    } else if (departmentFilter.value === 'All Departments') {
      allData.forEach(item => {
        if (item.location.name === locationFilter.value) {
          filteredData.push(item)
        }
      })
    } else {
      allData.forEach(item => {
        if (item.departments[0].name === departmentFilter.value && item.location.name === locationFilter.value) {
          filteredData.push(item)
        }
      })
    }
  }
  console.log(filteredData.length)
  dataStore = filteredData
  current_page = 1
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