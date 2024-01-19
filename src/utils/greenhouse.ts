type job = {
  department: string;
  position: string;
  location: string;
}

export const greenhouse = () => {
  const REQUIRED_FIELDS = ['department', 'position', 'location']

  // main greenhouse component - every other component should be inside this
  const mainElement = document.querySelectorAll('[tc-greenhouse-main="active"]')[0];
  // element that will be used to single job result
  const listElement = document.querySelectorAll('[tc-greenhouse-element="list-item"]')[0];

  // results/ list of elements to render
  let list: Element[] = []

  // temp data
  const data: job[] = [{
    department: 'Core Accounting',
    position: 'Accounts',
    location: 'New York, USA',
  }, {
    department: 'Information Technology',
    position: 'Software Engineer',
    location: 'San Francisco, USA'
  }, {
    department: 'Designing',
    position: '3D Designer',
    location: 'San Francisco, USA'
  }];

  renderList(data)

  function renderList(data: job[]) {
    if (!mainElement) return

    data.forEach(item => {
      let newElement = listElement.cloneNode(true) as Element
      // @ts-ignore
      newElement.style.opacity = '1'
      REQUIRED_FIELDS.forEach(field => {
        // find all elements of the current field
        newElement.querySelectorAll(`[tc-greenhouse-element="${field}"]`).forEach(element => {
          // replacing with actual data
          element.textContent = item[field as keyof job]
        })
      })
      console.log("adding")
      list.push(newElement)
    })

    listElement.remove()
    list.map(element => mainElement.appendChild(element))
  }

};

/* outline of the greenhouse component:
    -> main
        tc-main - manual
        tc-pagination - manual (optional)
        tc-results-per-page - manual (optional)

    -> filter
        filters[] - manual
            tc-filters-list - manual
             |- tc-filter-item - auto
             |- tc-filter-item - auto

    -> results (positions)
        tc-results-list - manual
            |- tc-position-item - auto
            |- tc-position-item - auto
    
    -> error component
        tc-error - manual
*/
