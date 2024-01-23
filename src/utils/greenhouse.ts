
let results_per_page = 5;
let current_page = 1;

let dataStore: undefined | null | job[]

let currentData: job[] = []

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
};

function renderList() {
  if (!listElement) return

  let items: HTMLElement[] = []

  // creating list of elements
  currentData.forEach(item => {
    let newElement = listElement!.cloneNode(true) as HTMLElement

    newElement.style.display = 'block'
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

function setCurrentPageData(data: job[]) {
  currentData = data.slice((current_page - 1) * results_per_page, current_page * results_per_page)
  console.log("currentData", currentData)
  renderList()
}

function handlePrevious() {
  console.log("clicked previous")
  if (current_page > 1) {
    current_page--
    currentData = dataStore!.slice((current_page - 1) * results_per_page, current_page * results_per_page)
    renderList()
  }
  list?.scrollIntoView({ behavior: 'smooth' })
}

function handleNext() {
  console.log("clicked next")
  if (current_page < Math.ceil(dataStore!.length / results_per_page)) {
    current_page++
    currentData = dataStore!.slice((current_page - 1) * results_per_page, current_page * results_per_page)
    renderList()
  }
  list?.scrollIntoView({ behavior: 'smooth' })
}

async function getDataFromGreenhouseAPI() {
  let res = await fetch(`https://boards-api.greenhouse.io/v1/boards/mural/jobs?content=true`, {
    method: 'GET',
  }).then(res => res.json())

  dataStore = res.jobs
  setCurrentPageData(dataStore!)
  console.log(res)
}