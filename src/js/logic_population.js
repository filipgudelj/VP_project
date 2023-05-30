let year = 1960;
decade.textContent = year;
fetchData();

const previousDecadeBtn = document.getElementById("previous-decade-btn");
const nextDecadeBtn = document.getElementById("next-decade-btn");

previousDecadeBtn.addEventListener("click", previousDecade);
nextDecadeBtn.addEventListener("click", nextDecade);

previousDecadeBtn.disabled = true;
previousDecadeBtn.classList.add("disabled-btn");

function nextDecade() {
  if (year < 2011) {
    nextDecadeBtn.disabled = false;
    nextDecadeBtn.classList.remove("disabled-btn");
    year += 10;
  }
  if (year > 1969) {
    previousDecadeBtn.disabled = false;
    previousDecadeBtn.classList.remove("disabled-btn");
  }
  decade.textContent = year;
  if (year === 2020) {
    nextDecadeBtn.disabled = true;
    nextDecadeBtn.classList.add("disabled-btn");
  }
  fetchData();
}
function previousDecade() {
  if (year > 1969) {
    previousDecadeBtn.disabled = false;
    previousDecadeBtn.classList.remove("disabled-btn");
    year -= 10;
  }
  if (year < 2011) {
    nextDecadeBtn.disabled = false;
    nextDecadeBtn.classList.remove("disabled-btn");
  }
  decade.textContent = year;
  if (year === 1960) {
    previousDecadeBtn.disabled = true;
    previousDecadeBtn.classList.add("disabled-btn");
  }
  fetchData();
}

var width = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  ),
  height = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  );

var svg = d3.select("body").append("svg").style("cursor", "move");

svg
  .attr("viewBox", "0 0 0" + width + " " + height)
  .attr("preserveAspectRatio", "xMinYMin");

var zoom = d3.zoom().on("zoom", function () {
  var transform = d3.zoomTransform(this);
  map.attr("transform", transform);
});

svg.call(zoom);

var map = svg.append("g").attr("class", "map");

function fetchData() {
  d3.queue()
    .defer(d3.json, "src/data/geo_countries.json")
    .defer(d3.json, "src/data/countries_population.json")
    .await(function (error, world, data) {
      if (error) {
        console.error("Something went wrong: " + error);
      } else {
        drawMap(world, data);
      }
    });
}

function drawMap(world, data) {
  var projection = d3
    .geoMercator()
    .scale(130)
    .translate([width / 2, height / 2]);

  var path = d3.geoPath().projection(projection);

  var color = d3
    .scaleThreshold()
    .domain([
      10000, 100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000,
      500000000, 1500000000,
    ])
    .range([
      "#d7e1ee",
      "#cbd6e4",
      "#bfcbdb",
      "#b3bfd1",
      "#a4a2a8",
      "#df8879",
      "#c86558",
      "#b04238",
      "#991f17",
    ]);

  var features = topojson.feature(world, world.objects.countries).features;
  var populationById = {};

  data.forEach(function (d) {
    populationById[d["Country Name"]] = {
      population: +d[year],
      population1960: +d[1960],
      population1970: +d[1970],
      population1980: +d[1980],
      population1990: +d[1990],
      population2000: +d[2000],
      population2010: +d[2010],
      population2020: +d[2020],
    };
  });
  features.forEach(function (d) {
    d.details = populationById[d.properties.name]
      ? populationById[d.properties.name]
      : {};
  });

  map
    .append("g")
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("name", function (d) {
      return d.properties.name;
    })
    .attr("id", function (d) {
      return d.id;
    })
    .attr("d", path)
    .style("fill", function (d) {
      return d.details && d.details.population
        ? color(d.details.population)
        : undefined;
    })
    .on("mouseover", function (d) {
      d3.select(this)
        .style("stroke", "white")
        .style("stroke-width", 1.2)
        .style("cursor", "pointer");

      d3.select(".country").text(d.properties.name);

      d3.select(".population").text(
        (d.details &&
          d.details.population &&
          "Population: " + Number(d.details.population).toLocaleString()) ||
          "No Data"
      );

      const data = [
        { year: 1960, population: d.details.population1960 },
        { year: 1970, population: d.details.population1970 },
        { year: 1980, population: d.details.population1980 },
        { year: 1990, population: d.details.population1990 },
        { year: 2000, population: d.details.population2000 },
        { year: 2010, population: d.details.population2010 },
        { year: 2020, population: d.details.population2020 },
      ];

      var svgWidth = 330;
      var svgHeight = 250;
      var margin = { top: 20, right: 20, bottom: 30, left: 85 };
      var graphWidth = svgWidth - margin.left - margin.right;
      var graphHeight = svgHeight - margin.top - margin.bottom;

      d3.select(".graph").selectAll("svg").remove();

      var svg = d3
        .select(".graph")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

      var graph = svg
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      var xScale = d3.scaleTime().range([0, graphWidth]);
      var yScale = d3.scaleLinear().range([graphHeight, 0]);

      xScale.domain([new Date(1960, 0, 1), new Date(2020, 0, 1)]);
      yScale.domain([
        0,
        d3.max(data, function (d) {
          return d.population;
        }),
      ]);

      var line = d3
        .line()
        .x(function (d) {
          return xScale(new Date(d.year, 0, 1));
        })
        .y(function (d) {
          return yScale(d.population);
        });

      graph.append("path").datum(data).attr("class", "line").attr("d", line);

      graph
        .append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(d3.axisBottom(xScale).ticks(d3.timeYear.every(20)));

      graph.append("g").attr("class", "y-axis").call(d3.axisLeft(yScale));

      svg
        .selectAll(".x-axis text")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "700");
      svg
        .selectAll(".y-axis text")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("font-weight", "700");

      d3.select(".details").style("visibility", "visible");
      d3.select(".graph").style("visibility", "visible");
    })
    .on("mouseout", function (d) {
      d3.select(this).style("stroke", null).style("stroke-width", 0.5);

      d3.select(".details").style("visibility", "hidden");
      d3.select(".graph").style("visibility", "hidden");
    });
}
