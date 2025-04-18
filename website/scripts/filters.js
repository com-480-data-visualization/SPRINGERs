// Events to consider
// - CountryFilterChange
// - ArticleFilterChange
// - DateRangeFilterChange

function MultiSelectTag(e, t) {
  var n,
    l,
    r,
    i,
    a,
    o = [],
    c = t.onChange || function () {},
    d = t.required || !1,
    u = "number" == typeof t.maxSelection ? t.maxSelection : 1 / 0,
    s = t.placeholder || "Search",
    f = [],
    v = [],
    p = -1;
  if (!(n = document.getElementById(e)))
    throw new Error("Select element not found.");
  if ("SELECT" !== n.tagName)
    throw new Error("Element is not a select element.");
  n.style.display = "none";
  for (var h = 0; h < n.options.length; h++) {
    var g = n.options[h];
    o.push({
      id: g.value,
      label: g.text,
      preselected: g.selected,
    });
  }
  ((l = document.createElement("div")).className = "multi-select-tag"),
    n.parentNode.insertBefore(l, n.nextSibling);
  for (var m = 0; m < o.length; m++)
    o[m].preselected &&
      f.push({
        id: o[m].id,
        label: o[m].label,
      });
  function E() {
    a.innerHTML = "";
    var e = v.filter(function (e) {
      return !f.find(function (t) {
        return t.id === e.id;
      });
    });
    if (0 !== e.length) {
      if (
        (e.forEach(function (e, t) {
          var n = document.createElement("li");
          (n.textContent = e.label),
            (n.className = "li"),
            t === p && n.classList.add("li-arrow"),
            n.addEventListener("click", function () {
              L(e);
            }),
            a.appendChild(n);
        }),
        a.classList.remove("hidden"),
        p > -1)
      ) {
        var t = a.children[p];
        t &&
          t.scrollIntoView({
            block: "nearest",
          });
      }
    } else a.classList.add("hidden");
  }
  function w() {
    for (var e = r.querySelectorAll(".tag-item"), t = 0; t < e.length; t++)
      e[t].remove();
    f.forEach(function (e) {
      var t = document.createElement("span");
      (t.className = "tag-item"), (t.textContent = e.label);
      var n = document.createElement("span");
      (n.className = "cross"),
        (n.innerHTML = "&times;"),
        n.addEventListener("click", function () {
          !(function (e) {
            (f = f.filter(function (t) {
              return t.id !== e.id;
            })),
              w(),
              E(),
              b(),
              c(f);
          })(e);
        }),
        t.appendChild(n),
        r.insertBefore(t, i);
    });
  }
  function L(e) {
    f.length >= u ||
      (f.find(function (t) {
        return t.id === e.id;
      }) ||
        f.push({
          id: e.id,
          label: e.label,
        }),
      (i.value = ""),
      (v = o.filter(function (e) {
        return e.label.toLowerCase().includes(i.value.toLowerCase());
      })),
      (p = -1),
      w(),
      E(),
      b(),
      c(f));
  }
  function b() {
    for (var e = 0; e < n.options.length; e++) {
      var t = n.options[e],
        l = f.find(function (e) {
          return e.id === t.value;
        });
      t.selected = !!l;
    }
    i.required = !!d && !f.length;
  }
  return (
    (v = o.slice()),
    (l.innerHTML = `\n        <div class="wrapper">\n          <div id="selected-tags" class="tag-container">\n            <input type="text" id="tag-input" placeholder="${s}" class="tag-input" autocomplete="off">\n          </div>\n          <ul id="dropdown" class="dropdown hidden"></ul>\n        </div>`),
    (r = l.querySelector("#selected-tags")),
    (i = l.querySelector("#tag-input")),
    (a = l.querySelector("#dropdown")),
    i.addEventListener("input", function (e) {
      var t = e.target.value.toLowerCase();
      (v = o.filter(function (e) {
        return e.label.toLowerCase().includes(t);
      })),
        (p = -1),
        E();
    }),
    i.addEventListener("keydown", function (e) {
      var t = a.querySelectorAll("li");
      if ("Backspace" === e.key && "" === i.value && f.length > 0)
        return f.pop(), w(), E(), b(), c(f), void e.preventDefault();
      if ("ArrowDown" === e.key) {
        if ((e.preventDefault(), 0 === t.length)) return;
        (p = (p + 1) % t.length), E();
      } else if ("ArrowUp" === e.key) {
        if ((e.preventDefault(), 0 === t.length)) return;
        (p = (p - 1 + t.length) % t.length), E();
      } else if ("Enter" === e.key && (e.preventDefault(), p > -1 && t[p])) {
        var n = t[p].textContent,
          l = o.find(function (e) {
            return e.label === n;
          });
        l && L(l);
      }
    }),
    document.addEventListener("click", function (e) {
      l.contains(e.target) || ((p = -1), a.classList.add("hidden"));
    }),
    i.addEventListener("focus", function () {
      E();
    }),
    w(),
    b(),
    {
      selectAll: function () {
        for (var e = 0; e < o.length && !(f.length >= u); e++) {
          var t = o[e];
          f.find(function (e) {
            return e.id === t.id;
          }) ||
            f.push({
              id: t.id,
              label: t.label,
            });
        }
        (i.value = ""), (v = o.slice()), (p = -1), w(), E(), b(), c(f);
      },
      select: function (ids) {
        for (var e = 0; e < o.length && !(f.length >= u); e++) {
          var t = o[e];
          ids.includes(t.id) &&
            (f.find(function (e) {
              return e.id === t.id;
            }) ||
              f.push({
                id: t.id,
                label: t.label,
              }));
        }
        (i.value = ""), (v = o.slice()), (p = -1), w(), E(), b(), c(f);
      },

      clearAll: function () {
        (f = []), w(), E(), b(), c(f);
      },
      getSelectedTags: function () {
        return f;
      },
    }
  );
}

class FilterState {
  countries = [];
  articles = [];
  dateRange = {};

  constructor() {
    this.countries = [];
    this.articles = [];
    this.dateRange = {};
  }

  setCountries(countries) {
    this.countries = countries;
  }

  setArticles(articles) {
    this.articles = articles;
  }

  setDateRange(dateRange) {
    this.dateRange = dateRange;
  }
}

const GlobalFilterState = new FilterState();

function onCountryFilterChange(newCountries, fromDropdown = false) {
  // Handle the event when the country filter changes
  document.dispatchEvent(
    new CustomEvent("CountryFilterChange", {
      detail: {
        countries: newCountries,
        fromDropdown: fromDropdown,
      },
    })
  );
}

function onArticleFilterChange(newArticles, fromDropdown = false) {
  // Handle the event when the article filter changes
  document.dispatchEvent(
    new CustomEvent("ArticleFilterChange", {
      detail: {
        articles: newArticles,
        fromDropdown: fromDropdown,
      },
    })
  );
}

function onDateRangeFilterChange(newDateRange, fromDropdown = false) {
  // Handle the event when the date range filter changes
  document.dispatchEvent(
    new CustomEvent("DateRangeFilterChange", {
      detail: {
        dateRange: newDateRange,
        fromDropdown: fromDropdown,
      },
    })
  );
}

(() => {
  const CountriesFilter = new MultiSelectTag("countries", {
    placeholder: "Select countries",
    onChange: function (selected) {
      onCountryFilterChange(
        selected.map((tag) => tag.id),
        true
      );
    },
  });

  document.addEventListener("CountryFilterChange", function (event) {
    const { countries, fromDropdown } = event.detail;

    if (!fromDropdown) {
      CountriesFilter.select(countries);
    }
  });

  const ArticlesFilter = new MultiSelectTag("articles", {
    placeholder: "Select articles",
    onChange: function (selected) {
      onArticleFilterChange(
        selected.map((tag) => tag.id),
        true
      );
    },
  });

  document.addEventListener("ArticleFilterChange", function (event) {
    const { articles, fromDropdown } = event.detail;

    if (!fromDropdown) {
      ArticlesFilter.select(articles);
    }
  });

  $('input[name="datefilter"]').daterangepicker(
    {
      //   opens: "left",
      autoUpdateInput: false,
      locale: {
        cancelLabel: "Clear",
      },
    },
    function (start, end, label) {
      const dateRange = {
        start: start.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD"),
      };
      onDateRangeFilterChange(dateRange, true);
    }
  );

  $('input[name="datefilter"]').on(
    "apply.daterangepicker",
    function (ev, picker) {
      $(this).val(
        picker.startDate.format("MM/DD/YYYY") +
          " - " +
          picker.endDate.format("MM/DD/YYYY")
      );
    }
  );

  $('input[name="datefilter"]').on(
    "cancel.daterangepicker",
    function (ev, picker) {
      $(this).val("");
    }
  );

  // update global filter state
  document.addEventListener("CountryFilterChange", function (event) {
    const { countries } = event.detail;
    GlobalFilterState.setCountries(countries);
  });
  document.addEventListener("ArticleFilterChange", function (event) {
    const { articles } = event.detail;
    GlobalFilterState.setArticles(articles);
  });
  document.addEventListener("DateRangeFilterChange", function (event) {
    const { dateRange } = event.detail;
    GlobalFilterState.setDateRange(dateRange);
  });

  // handle the scrolling

  const articlesSection = document.getElementById("articles-section");
  const filtersSection = document.getElementById("filters-section");
  const filtersHeight = filtersSection.offsetHeight;
  const filtersHeading = filtersSection.querySelector("h1");

  document.addEventListener("scroll", function () {
    const position = articlesSection.getBoundingClientRect();
    const boundaryY = position.top - filtersHeight;

    if (boundaryY <= 0 && !filtersSection.classList.contains("floating")) {
      filtersSection.classList.add("floating");
      filtersSection.classList.remove("closed");
      articlesSection.style.marginTop = `${filtersHeight}px`;
    } else if (boundaryY > 0 && filtersSection.classList.contains("floating")) {
      filtersSection.classList.remove("floating");
      filtersSection.classList.remove("closed");
      articlesSection.style.marginTop = "auto";
    }
  });

  filtersHeading.addEventListener("click", function () {
    if (filtersSection.classList.contains("floating")) {
      // check if any filter is applied
      const isAnyFilterApplied =
        GlobalFilterState.countries.length > 0 ||
        GlobalFilterState.articles.length > 0 ||
        Object.keys(GlobalFilterState.dateRange).length > 0;
      if (isAnyFilterApplied) {
        filtersSection.classList.add("active");
      } else {
        filtersSection.classList.remove("active");
      }

      filtersSection.classList.toggle("closed");
    }
  });
})();
