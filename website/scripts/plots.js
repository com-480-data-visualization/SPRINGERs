import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

(() => {
  const country_acronyms = {
    Poland: "PL",
    Romania: "RO",
    Spain: "ES",
    Greece: "GR",
    Germany: "DE",
    Belgium: "BE",
    Austria: "AT",
    Bulgaria: "BG",
    Latvia: "LV",
    Sweden: "SE",
    France: "FR",
    "United Kingdom": "GB",
    Hungary: "HU",
    Netherlands: "NL",
    Denmark: "DK",
    Lithuania: "LT",
    "Czech Republic": "CZ",
    Norway: "NO",
    Italy: "IT",
    Portugal: "PT",
    Malta: "MT",
    Cyprus: "CY",
    Slovakia: "SK",
    Iceland: "IS",
    Croatia: "HR",
  };

  const article_ids = [
    4, 5, 6, 7, 9, 12, 13, 14, 15, 17, 18, 21, 25, 28, 31, 32, 33, 34, 35, 36,
    37, 58, 83,
  ];

  function filterViolations(d3Violations) {
    const allowedCountries = GlobalFilterState.countries;
    const allowedArticles = GlobalFilterState.articles.map((a) => `|${a}|`);
    const dateRange = GlobalFilterState.dateRange;
    const dateRangeStart = dateRange.start ? new Date(dateRange.start) : null;
    const dateRangeEnd = dateRange.end ? new Date(dateRange.end) : null;

    if (
      !allowedCountries.length &&
      !allowedArticles.length &&
      !dateRange.start
    ) {
      // No filters applied, return all violations
      return d3Violations;
    }

    return d3Violations.filter((d) => {
      return (
        (!allowedCountries.length ||
          allowedCountries.includes(d.country_acronym)) &&
        (!allowedArticles.length ||
          allowedArticles.some((article) => d.article_ids.includes(article))) &&
        (!dateRangeStart || d.date_iso >= dateRangeStart) &&
        (!dateRangeEnd || d.date_iso <= dateRangeEnd)
      );
    });
  }

  // Utility functions
  function highlight(d) {
    d3.select(d)
      .attr("stroke", "#BEE4D0")
      .attr("stroke-width", 4)
      .attr("filter", "url(#glow)");

    // Add glow filter if not already present
    let defs = d3.select(d.ownerSVGElement).select("defs");
    if (defs.select("#glow").empty()) {
      defs
        .append("filter")
        .attr("id", "glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", 4)
        .attr("result", "coloredBlur");
      let feMerge = defs.select("#glow").append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    }
  }

  // Data visualization functions

  function countBrokenArticles(d3Violations) {
    const countEl = document
      .getElementById("count-articles-broken")
      .querySelector("h1");

    const uniqueArticles = new Set();

    d3Violations.forEach((d) => {
      d.article_ids.split("|").forEach((article) => {
        if (article) {
          uniqueArticles.add(article);
        }
      });
    });

    const count = uniqueArticles.size;
    countEl.textContent = count.toLocaleString("en-US");
  }

  function countOffendingCountries(d3Violations) {
    const countEl = document
      .getElementById("count-offending-countries")
      .querySelector("h1");

    const uniqueCountries = new Set(d3Violations.map((d) => d.country_acronym));

    const count = uniqueCountries.size;
    countEl.textContent = count.toLocaleString("en-US");
  }

  function sumTotalFines(d3Violations) {
    const countEl = document
      .getElementById("count-total-fines")
      .querySelector("h1");

    const totalFines = d3Violations.reduce((sum, d) => {
      return sum + (d.price ? parseFloat(d.price) : 0);
    }, 0);

    function formatWithUnits(value) {
      if (value >= 1_000_000_000) {
        return (
          (value / 1_000_000_000).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }) + "B"
        );
      } else if (value >= 1_000_000) {
        return (
          (value / 1_000_000).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }) + "M"
        );
      } else if (value >= 1_000) {
        return (
          (value / 1_000).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }) + "K"
        );
      }
      return value.toLocaleString("en-US");
    }

    countEl.textContent = "€" + formatWithUnits(totalFines);
  }

  function finesMap(d3Violations) {
    // computing total fines per country
    const totalFinesPerCountry = d3Violations.reduce((acc, d) => {
      if (!acc[d.name]) {
        acc[d.name] = 0;
      }

      acc[d.name] += d.price ? parseFloat(d.price) : 0;
      return acc;
    }, {});

    // clear the map container
    d3.select("#map").select("svg").remove();

    // drawing the map

    let width = 1200,
      height = 600;

    let svg = d3
      .select("#map")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    let europeProjection = d3
      .geoMercator()
      .center([13, 52])
      .scale([width / 1.5])
      .translate([width / 2, height / 2]);

    let pathGenerator = d3.geoPath().projection(europeProjection);
    let geoJsonUrl =
      "https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json";

    // color scale for the fines ignoring ZERO which will have no color
    let color = d3
      .scaleQuantize()
      .domain(
        d3.extent(Object.values(totalFinesPerCountry).filter((x) => x > 0))
      )
      .range([
        "#000",
        "#2f577d",
        "#33979e",
        "#a1ff82",
        "#f2fa78",
        "#fab778",
        "#FF8282",
      ]);

    // draw the scale legend
    let legendWidth = 350,
      legendHeight = 20;

    let legend = svg
      .append("g")
      .attr("class", "legend")
      .attr(
        "transform",
        `translate(${width - legendWidth - 20}, ${height - legendHeight - 20})`
      );
    let legendScale = d3
      .scaleLinear()
      .domain(
        d3.extent(Object.values(totalFinesPerCountry).filter((x) => x > 0))
      )
      .range([0, legendWidth]);
    let legendAxis = d3
      .axisBottom(legendScale)
      .ticks(5)
      .tickFormat((d) => "€" + d.toLocaleString("en-US"));
    legend
      .append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#gradient)");
    legend
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);

    // Create a gradient for the legend
    let defs = svg.append("defs");
    defs
      .append("linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%")
      .selectAll("stop")
      .data(d3.range(0, 1.01, 0.01))
      .enter()
      .append("stop")
      .attr("offset", (d) => `${d * 100}%`)
      .attr("stop-color", (d) => color(legendScale.invert(d * legendWidth)));

    // Load the GeoJSON data

    d3.json(geoJsonUrl).then((geojson) => {
      // Tell D3 to render a path for each GeoJSON feature

      svg
        .selectAll("path")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("d", pathGenerator) // This is where the magic happens
        .attr("stroke", "grey") // Color of the lines themselves
        .attr("fill", (d) => {
          if (
            d.properties.name in totalFinesPerCountry &&
            totalFinesPerCountry[d.properties.name] != 0
          ) {
            return color(totalFinesPerCountry[d.properties.name]);
          } else if (!(d.properties.name in totalFinesPerCountry)) {
            // Create a diagonal hash pattern if not already present
            let defs = svg.select("defs");
            if (defs.empty()) {
              defs = svg.append("defs");
            }
            if (svg.select("#hashPattern").empty()) {
              defs
                .append("pattern")
                .attr("id", "hashPattern")
                .attr("patternUnits", "userSpaceOnUse")
                .attr("width", 8)
                .attr("height", 8)
                .append("path")
                .attr("d", "M0,0 l8,8 M8,0 l-8,8")
                .attr("stroke", "#364a40")
                .attr("stroke-width", 2);
            }
            return "url(#hashPattern)";
          } else {
            return "#2c3e35";
          }
        })
        .on("mouseover", function (event, d) {
          if (!(d.properties.name in totalFinesPerCountry)) {
            // If the country has no fines, do not show tooltip
            return;
          }

          const mapContainer = d3.select("#map-section");
          const relativeX =
            event.x - mapContainer.node().getBoundingClientRect().left;
          const relativeY =
            event.y - mapContainer.node().getBoundingClientRect().top;

          // Show tooltip with country name and total fines
          const tooltip = d3.select("#map-tooltip");
          tooltip
            .style("display", "block")
            .html(
              `<strong>${d.properties.name}</strong><br>€${totalFinesPerCountry[
                d.properties.name
              ].toLocaleString("en-US")}`
            )
            .style("left", relativeX + 10 + "px")
            .style("top", relativeY + 10 + "px");

          // Highlight the country
          highlight(this);
        })
        .on("mouseout", function () {
          // Hide tooltip on mouse out
          d3.select("#map-tooltip").style("display", "none");

          // Remove highlight from the country
          d3.select(this)
            .attr("stroke", "grey")
            .attr("stroke-width", 1)
            .attr("filter", null);
        })
        .on("mousemove", function (event) {
          const mapContainer = d3.select("#map-section");
          const relativeX =
            event.x - mapContainer.node().getBoundingClientRect().left;
          const relativeY =
            event.y - mapContainer.node().getBoundingClientRect().top;

          // Update tooltip position
          d3.select("#map-tooltip")
            .style("left", relativeX + 10 + "px")
            .style("top", relativeY + 10 + "px");
        })
        .on("click", function (event, d) {
          // Dispatch a custom event with the country name
          const countryFilterChangeEvent = new CustomEvent(
            "CountryFilterChange",
            {
              detail: {
                countries: [country_acronyms[d.properties.name]],
                fromDropdown: false,
              },
            }
          );
          document.dispatchEvent(countryFilterChangeEvent);
        });
    });
  }

  function finesCorrelationCircle(d3Violations) {
    const correlationMatrix = [];
    const correlationCounts = [];

    for (let i = 0; i < article_ids.length; i++) {
      correlationMatrix[i] = [];
      correlationCounts[i] = [];
      for (let j = 0; j < article_ids.length; j++) {
        correlationMatrix[i][j] = 0;
        correlationCounts[i][j] = 0; // Initialize counts
      }
    }

    for (const violation of d3Violations) {
      const articles = violation.article_ids
        .split("|")
        .map(Number)
        .filter(Boolean);

      for (let i = 0; i < articles.length; i++) {
        for (let j = i + 1; j < articles.length; j++) {
          const article1 = articles[i];
          const article2 = articles[j];
          if (
            article_ids.includes(article1) &&
            article_ids.includes(article2)
          ) {
            const index1 = article_ids.indexOf(article1);
            const index2 = article_ids.indexOf(article2);
            correlationMatrix[index1][index2] += 1;
            correlationMatrix[index2][index1] += 1; // Ensure symmetry
            correlationCounts[index1][index2] += 1;
            correlationCounts[index2][index1] += 1; // Ensure symmetry
          }
        }
      }
    }

    // normalize the correlation matrix
    for (let i = 0; i < correlationMatrix.length; i++) {
      for (let j = 0; j < correlationMatrix[i].length; j++) {
        if (correlationMatrix[i][j] > 0) {
          correlationMatrix[i][j] /= d3Violations.length;
        }
      }
    }

    const names = article_ids.map((id) => `Article ${id}`);
    const color = d3
      .scaleOrdinal()
      .domain(article_ids)
      .range(d3.schemeCategory10);

    // Create the SVG container

    function groupTicks(d, step) {
      const k = (d.endAngle - d.startAngle) / d.value;
      return d3.range(0, d.value, step).map((value) => {
        return { value: value, angle: value * k + d.startAngle };
      });
    }

    const width = 400;
    const height = 400;

    const outerRadius = width * 0.5 - 60;
    const innerRadius = outerRadius - 10;
    const tickStep = d3.tickStep(0, d3.sum(correlationMatrix.flat()), 10);
    const formatValue = d3.format(".1~%");

    const chord = d3
      .chord()
      .padAngle(10 / innerRadius)
      .sortSubgroups(d3.descending)
      .sortChords(d3.descending);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    const ribbon = d3
      .ribbon()
      .radius(innerRadius - 1)
      .padAngle(1 / innerRadius);

    const svg = d3
      .create("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "width: 100%; height: auto; font: 10px sans-serif;");

    const chords = chord(correlationMatrix);
    const group = svg.append("g").selectAll().data(chords.groups).join("g");

    group
      .append("path")
      .attr("fill", (d) => color(article_ids[d.index]))
      .attr("d", arc);

    group.append("title").text((d) => {
      const article = article_ids[d.index];
      const count = d.value;
      return `Article ${article}: ${count} violations`;
    });

    const groupTick = group
      .append("g")
      .selectAll()
      .data((d) => groupTicks(d, tickStep))
      .join("g")
      .attr(
        "transform",
        (d) =>
          `rotate(${
            (d.angle * 180) / Math.PI - 90
          }) translate(${outerRadius},0)`
      );

    groupTick.append("line").attr("stroke", "currentColor").attr("x2", 6);

    groupTick
      .append("text")
      .attr("x", 8)
      .attr("dy", "0.35em")
      .attr("transform", (d) =>
        d.angle > Math.PI ? "rotate(180) translate(-16)" : null
      )
      .attr("text-anchor", (d) => (d.angle > Math.PI ? "end" : null))
      .text((d) => formatValue(d.value))
      .attr("fill", "#BEE4D0");

    group
      .select("text")
      .attr("font-weight", "bold")
      .attr("fill", "#BEE4D0")
      .text(function (d) {
        return this.getAttribute("text-anchor") === "end"
          ? `↑ ${names[d.index]}`
          : `${names[d.index]} ↓`;
      });

    svg
      .append("g")
      .attr("fill-opacity", 0.8)
      .selectAll("path")
      .data(chords)
      .join("path")
      .style("mix-blend-mode", "screen")
      .attr("fill", (d) => {
        return color(article_ids[d.source.index]);
      })
      .attr("d", ribbon)
      .on("mouseover", function (event, d) {
        const container = d3.select("#correlation-circle");
        const tooltip = d3.select("#correlation-tooltip");
        const relativeX =
          event.x - container.node().getBoundingClientRect().left;
        const relativeY =
          event.y - container.node().getBoundingClientRect().top;
        tooltip
          .style("display", "block")
          .html(
            `<strong>${names[d.source.index]} &lrarr; ${
              names[d.target.index]
            }</strong><br>${correlationCounts[d.source.index][
              d.target.index
            ].toLocaleString("en-US")} violations`
          )
          .style("left", relativeX + "px")
          .style("top", relativeY + "px");

        highlight(this);
      })
      .on("mouseout", function () {
        d3.select("#correlation-tooltip").style("display", "none");
        d3.select(this)
          .attr("stroke", "none")
          .attr("stroke-width", 0)
          .attr("filter", null);
      })
      .append("title")
      .text(
        (d) =>
          `${formatValue(d.source.value)} ${names[d.target.index]} → ${
            names[d.source.index]
          }${
            d.source.index === d.target.index
              ? ""
              : `\n${formatValue(d.target.value)} ${names[d.source.index]} → ${
                  names[d.target.index]
                }`
          }`
      );

    // Append the SVG to the container
    const container = d3.select("#correlation-circle");
    container.select("svg").remove(); // Clear previous SVG if any
    container.node().appendChild(svg.node());
  }

  function recividismChart(d3Violations) {
    const controllerFinesFrequency = {};

    d3Violations.forEach((d) => {
      const controller = d.controller;
      if (!controllerFinesFrequency[controller]) {
        controllerFinesFrequency[controller] = {
          totalFines: 0,
          nFines: 0,
          country_acronym: d.country_acronym,
          country: d.name,
        };
      }

      controllerFinesFrequency[controller].totalFines += d.price
        ? parseFloat(d.price)
        : 0;
      controllerFinesFrequency[controller].nFines += 1;
    });

    // aggregate per country
    const recividismCountPerCountry = {};

    Object.entries(controllerFinesFrequency).forEach(([controller, data]) => {
      if (!recividismCountPerCountry[data.country]) {
        recividismCountPerCountry[data.country] = {
          nControllers: 0,
          nRepeat: 0,
          nFinesRepeat: 0,
          nFines: 0,
        };
      }

      if (data.nFines > 1) {
        recividismCountPerCountry[data.country].nRepeat += 1;
        recividismCountPerCountry[data.country].nFinesRepeat += data.nFines;
      }

      recividismCountPerCountry[data.country].nControllers += 1;
      recividismCountPerCountry[data.country].nFines += data.nFines;
    });

    // add rate attributes
    Object.entries(recividismCountPerCountry).forEach(([country, data]) => {
      data.rate = data.nRepeat / data.nControllers;
      data.finesRate = data.nFinesRepeat / data.nFines;
    });

    // bar plot of recividism rates per country
    d3.select("#repeat-offenders-histogram").select("svg").remove(); // Clear previous SVG if any
    const recividismData = Object.entries(recividismCountPerCountry).map(
      ([country, data]) => ({
        country: country,
        nControllers: data.nControllers,
        nRepeat: data.nRepeat,
        rate: data.rate,
        finesRate: data.finesRate,
      })
    ).filter(
      (d) => d.nControllers > 0 && d.nRepeat > 0
    );
    recividismData.sort((a, b) => b.rate - a.rate);
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const svg = d3
      .select("#repeat-offenders-histogram")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    const x = d3
      .scaleBand()
      .domain(recividismData.map((d) => d.country))
      .range([0, width])
      .padding(0.1);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(recividismData, (d) => d.rate)])
      .nice()
      .range([height, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0, ${height})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((d) => d)
          .tickSize(0)
      )
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .attr("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "0.15em");

    svg
      .append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(10, "%"))
      .append("text")
      .attr("fill", "white")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -height / 2)
      .attr("dy", "0.75em")
      .style("text-anchor", "middle")
      .text("Recividism Rate");

    svg.selectAll(".bar")
      .data(recividismData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", (d) => x(d.country))
        .attr("y", (d) => y(d.rate))
        .attr("width", x.bandwidth())
        .attr("height", (d) => height - y(d.rate))
        .attr("fill", (d) => color(d.country))
    



  }

  function populateArticleContent(d3Text) {
    d3Text = d3Text.filter(
      (d) => article_ids.includes(+d.article) && d.sub_article == 1
    );

    const container = document.querySelector("#articles-section .content");
    const nav = container.querySelector("nav");

    function displayArticleContent(articleIndex) {
      const articleData = d3Text[articleIndex];

      const button = nav.querySelectorAll("a")[articleIndex];
      // Remove active class from all buttons
      nav
        .querySelectorAll("a")
        .forEach((btn) => btn.classList.remove("active"));
      // Add active class to the clicked button
      button.classList.add("active");

      // Fill info
      container.querySelector(
        ".article-name"
      ).innerText = `Article ${articleData.article} - ${articleData.article_title}`;

      container.querySelector(
        ".chapter-name"
      ).innerText = `Chapter ${articleData.chapter} - ${articleData.chapter_title}`;
      container.querySelector(".article-text").innerText =
        articleData.gdpr_text.slice(0, 500) + "...";
      container.querySelector(".article-link").href = articleData.href;
    }

    d3Text.forEach((d, i) => {
      const button = document.createElement("a");
      button.innerText = `Article ${d.article}`;
      button.addEventListener("click", (e) => {
        e.preventDefault();

        // Display the content for the clicked article
        displayArticleContent(i);
      });
      nav.appendChild(button);
    });

    // Display the first article content by default
    if (d3Text.length > 0) {
      displayArticleContent(0);
    } else {
      container.querySelector(".article-name").innerText = "No articles found";
    }
  }

  // Main function to load and process the data
  const dataDir = "./assets/data";
  const gdprTextFp = `${dataDir}/gdpr_text.csv`;
  const gdprViolationsFp = `${dataDir}/gdpr_violations.csv`;

  Promise.all([d3.csv(gdprTextFp), d3.csv(gdprViolationsFp)]).then(
    ([d3Text, d3Violations]) => {
      // convert date_iso
      d3Violations.forEach((d) => {
        d.date_iso = new Date(d.date_iso);
      });

      function displayFilteredStatistics() {
        let filteredViolations = filterViolations(d3Violations);

        // initial calls to visualizations
        countBrokenArticles(filteredViolations);
        countOffendingCountries(filteredViolations);
        sumTotalFines(filteredViolations);
        finesMap(filteredViolations);
        finesCorrelationCircle(filteredViolations);
        recividismChart(filteredViolations);
      }

      displayFilteredStatistics();
      populateArticleContent(d3Text);

      // responding to filter changes
      document.addEventListener(
        "CountryFilterChange",
        displayFilteredStatistics
      );
      document.addEventListener(
        "ArticleFilterChange",
        displayFilteredStatistics
      );
      document.addEventListener(
        "DateRangeFilterChange",
        displayFilteredStatistics
      );
    }
  );
})();
