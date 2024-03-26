// var linear = d3.scaleLinear()
//   .domain([0,10])
//   .range(["rgb(46, 73, 123)", "rgb(71, 187, 94)"]);

// var svg = d3.select("svg");

// svg.append("g")
//   .attr("class", "legendLinear")
//   .attr("transform", "translate(20,20)");

// var legendLinear = d3.legendColor()
//   .shapeWidth(30)
//   .cells([1, 2, 3, 6, 8])
//   .orient('horizontal')
//   .scale(linear);

// svg.select(".legendLinear")
//   .call(legendLinear);

// // Declare the chart dimensions and margins.
const width = 640;
const height = 400;
const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 40;

// Declare the x (horizontal position) scale.
const x = d3.scaleUtc()
    .domain([new Date("2023-01-01"), new Date("2024-01-01")])
    .range([marginLeft, width - marginRight]);

// Declare the y (vertical position) scale.
const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height - marginBottom, marginTop]);

// Create the SVG container.
const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height);

// Add the x-axis.
svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x));

// Add the y-axis.
svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y));

// Append the SVG element.
legend.append(svg.node());