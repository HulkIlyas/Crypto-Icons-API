const express = require('express')
const app = express()
const { convert } = require('convert-svg-to-png')
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window
const fs = require('fs');
const path = require('path');


app.use(express.static(__dirname + '/public'));

// GET Home page
app.get('/', function (req, res) {
  res.sendFile('index.html');
})

// GET png
app.get('/api/:style/:currency/:size/:color?', async (req, res) => {
  // Params
  const style = req.params.style
  const currency = req.params.currency
  const size = req.params.size
  const cacheKey = req.path
  const filename = currency + '-' + style + '-' + size + '.png'

  // Validate size is > 0
  if (size <= 0) {
    res.status(400).send({ 'error': 'Invalid size' });
    return
  }

  // Redis


  generatePNG(req, res, null)



})

// Functions

function sendPNG(response, png, filename) {
  response.set('Content-Type', 'image/png')
  response.header('Content-disposition', 'inline; filename=' + filename)
  response.send(png)
}

async function generatePNG(req, res, redis) {
  // Params
  const style = req.params.style
  const currency = req.params.currency
  const size = req.params.size
  const color = req.params.color
  const cacheKey = req.path
  const filename = currency + '-' + style + '-' + size + '.png'

  // SVG file path
  const svgPath = path.join(__dirname, 'public', 'svg', style, currency + '.svg');

  // Check if file exists
  if (!fs.existsSync(svgPath)) {
    res.status(404).send(null);
    return
  }

  const svg = fs.readFileSync(svgPath, 'utf8');
  const element = document.createElement('div')
  element.innerHTML = svg

  const svgElement = element.getElementsByTagName("svg")[0]

  // Define the circles
  const colorCircle = element.getElementsByTagName("circle")[0]
  const iconCircle = element.getElementsByTagName("use")[1]

  // Set viewBox so SVG resizes correctly
  const originalSize = svgElement.getAttribute('width')
  svgElement.setAttribute('viewBox', '0 0 ' + originalSize + ' ' + originalSize)

  // Set requested size
  svgElement.setAttribute('width', size)
  svgElement.setAttribute('height', size)

  // Set circle color, if `color` or `icon`
  if (color != null && style == 'color') {
    const colorString = '#' + color
    colorCircle.setAttribute('fill', colorString)
  } else if (color != null && style == 'icon') {
    const colorString = '#' + color
    iconCircle.setAttribute('fill', colorString)
  }
  const png = await convert(element.innerHTML, {
    'height': size,
    'width': size,
    // 'puppeteer' : {'args' : ['--no-sandbox', '--disable-setuid-sandbox']}
  });
  res.send(element.innerHTML)
  // sendPNG(res, png, filename)
}

// Listen
var port = process.env.PORT || 3210;
app.listen(port, () => console.log('Our app is running on http://localhost:' + port))
