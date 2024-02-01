### CDN link
```
<script src="https://cdn.jsdelivr.net/gh/kartikk-k/greenhouse-webflow@1.0.2/dist/index.js"></script>
```

## Main element
`tc-greenhouse-element="main"` - everything realted to greenhouse should be inside this element

### Requried attributes
`tc-greenhouse-board-id="{board_id}"` - board id from greenhouse

### Optional attributes (settings)

`tc-greenhouse-paginate="{true or false}"` - default value `false` | choose between pagination or load more format

`tc-greenhouse-results-per-page="{number}"` - default `5` | results per page

# Rendering list of jobs
`tc-greenhouse-element="list"` - main element for rendering list of jobs <br>
**NOTE:** this element should be inside **main** element

`tc-greenhouse-element="list-item"` - element for rendering a job (element with this attribute will be picked and used to render all jobs in the list) <br>
**NOTE:** this element should be inside **list** element

### Rendering values in list-item (everything is optional and should be inside **list-item** element)

`tc-greenhouse-value="title"` - job title

`tc-greenhouse-value="location"` - job location

`tc-greenhouse-element="department"` - job department

`tc-greenhouse-element="open"` - to open job on greenhouse when clicked

# Additional elements(everything inside **main** element and outside **list** element)
`tc-greenhouse-element="load-more"` - element for load more button <br>
**NOTE:** if pagination is set to false

`tc-greenhouse-element="loader"` - element for showing loader until data is fetched

`tc-greenhouse-element="empty-state"` - element for showing empty state when no jobs are found

`tc-greenhouse-element="error"` - element for showing error when something goes wrong or board is not found

`pagination buttons provided by webflow` - for pagination (if paginate is set to true)

# Structure
```
  -body----------------------
  |                         |
  |  -main------------------|
  |  |                      |
  |  |  -list---------------|
  |  |  |                   |
  |  |  |  -list-item-------|
  |  |  |  |                |
  |  |  |  |  -title--------|
  |  |  |  |  -location-----|
  |  |  |  |  -department---|
  |  |  |  |                |
  |  |  |  |  -open---------|
  |  |  |  |                |
  |  |  |  |                |
  |  |  -load-more----------|
  |  |  -loader-------------|
  |  |  -empty-state--------|
  |  |  -error--------------|
  |  |                      |
  |  -----------------------|
```
