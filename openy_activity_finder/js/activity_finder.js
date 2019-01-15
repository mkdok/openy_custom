(function ($) {
  Vue.config.devtools = true;
  if (!$('#activity-finder-app').length) {
    return;
  }

  var router = new VueRouter({
    mode: 'history',
    routes: []
  });

  new Vue({
    el: '#activity-finder-app',
    router: router,
    data: {
      step: 0,
      loading: false,
      noResults: false,
      isStep1NextDisabled: true,
      isStep2NextDisabled: true,
      isStep3NextDisabled: true,
      keywords: '',
      step_1_query: '',
      step_2_query: '',
      step_3_query: '',
      afResultsRef: '',
      table: {
        count: 0,
        facets: {
          field_session_min_age: [],
          field_session_max_age: [],
          field_session_time_days: [],
          field_category_program: [],
          field_activity_category: [],
          field_session_location: []
        }
      },
      checkedAges: [],
      checkedDays: [],
      checkedProgramTypes: [],
      checkedActivities: [],
      checkedLocations: [],
      checkedStep1Filters: '',
      checkedStep2Filters: '',
      checkedStep3Filters: '',
      categories: {},
      checked: false
    },
    methods: {
      toStep: function(s) {
        this.step = s;
        this.updateStepsViewAll(s);
      },
      skip: function() {
        this.step++;
      },
      prev: function() {
        this.step--;
      },
      next: function() {
        if (this.step == 3) {
          // Redirect to Search page.
          window.location.pathname = this.afResultsRef;
        }
        this.step++;
        this.runAjaxRequest();
      },
      startOver: function() {
        var component = this;
        router.push({ query: {}});
        component.step = 0;
        component.keywords = '';
        component.checkedAges = [];
        component.checkedDays = [];
        component.checkedProgramTypes = [];
        component.checkedActivities = [];
        component.checkedLocations = [];
        component.checkedStep1Filters = '';
        component.checkedStep2Filters = '';
        component.checkedStep3Filters = '';
        this.runAjaxRequest();
      },
      updateStepsViewAll: function(step) {
        var component = this;
        switch (step) {
          case 1:
            component.step_1_query = window.location.search;
            break;
          case 2:
            component.step_2_query = window.location.search;
            break;
          case 3:
            component.step_3_query = window.location.search;
            break;
        }
      },
      updateSearchQuery: function() {
        var component = this;
        router.push({ query: {
          keywords: encodeURIComponent(component.keywords),
          ages: encodeURIComponent(component.checkedAges),
          program_types: encodeURIComponent(component.checkedProgramTypes),
          activities: encodeURIComponent(component.checkedActivities),
          days: encodeURIComponent(component.checkedDays),
          locations: encodeURIComponent(component.checkedLocations)
        }});
      },
      checkFilters: function(step) {
        var component = this,
            filters = [];
        switch (step) {
          case 1:
            component.checkedStep1Filters = '';
            component.isStep1NextDisabled = true;
            if (component.checkedAges.length > 0 ||
              component.checkedDays.length > 0 ||
              component.checkedProgramTypes.length > 0) {

              component.isStep1NextDisabled = false;
              component.checkedAges.length > 0 ? filters.push(component.checkedAges.join(', ')) : '';
              component.checkedDays.length > 0 ? filters.push(component.checkedDays.join(', ')) : '';
              component.checkedProgramTypes.length > 0 ? filters.push(component.checkedProgramTypes.join(', ')) : '';
              component.checkedStep1Filters = filters.join(', ');
            }
            break;
          case 2:
            component.checkedStep2Filters = '';
            component.isStep1NextDisabled = true;
            if (
              component.checkedActivities.length > 0) {

              component.checkedStep2Filters = false;
              // Map ids to titles.
              var checkedMapActivities = [];
              for (key in component.checkedActivities) {
                if (parseInt(component.checkedActivities[key]) && $('input[value="' + component.checkedActivities[key] + '"]')) {
                  checkedMapActivities.push($('input[value="' + component.checkedActivities[key] + '"]').parent().find('label').text());
                }
              }
              filters.push(checkedMapActivities.join(', '));
              component.checkedStep2Filters = filters.join(', ');
            }
            break;
          case 3:
            component.checkedStep3Filters = '';
            component.isStep1NextDisabled = true;
            if (
              component.checkedLocations.length > 0) {

              component.checkedStep3Filters = false;

              // Map ids to titles.
              var checkedMapLocations = [];
              for (key in component.checkedLocations) {
                if (parseInt(component.checkedLocations[key]) && $('input[value="' + component.checkedLocations[key] + '"]')) {
                  checkedMapLocations.push($('input[value="' + component.checkedLocations[key]+'"]').parent().find('label span').text());
                }
              }
              filters.push(checkedMapLocations.join(', '));
              component.checkedStep3Filters = filters.join(', ');
            }
            break;
        }
      },
      runAjaxRequest: function() {
        var component = this;

        var url = drupalSettings.path.baseUrl + 'af/get-data';

        if (window.location.search !== '') {
          url += window.location.search;
        }

        component.loading = true;
        $.getJSON(url, function(data) {
          component.table = data;
          component.loading = false;
        });
      },
      locationCounter: function(locationId) {
        var component = this;
        component.noResults = false;

        if (typeof this.table.facets.locations == 'undefined') {
          component.noResults = true;
          return 0;
        }
        for (key in this.table.facets.locations) {
          if (this.table.facets.locations[key].id == locationId) {
            return this.table.facets.locations[key].count;
          }
        }
        return 0;
      },
      toggleCardState: function(e) {
        var element = $(e.target);
        if(!element.parents('.openy-card__item').hasClass('selected')) {
          element.parents('.openy-card__item').addClass('selected');
        }
        else {
          element.parents('.openy-card__item').removeClass('selected');
        }
      }
    },
    computed: {
      topLevelCategories: function() {
        var topLevel = [];
        for (key in this.categories) {
          if (this.categories[key].label) {
            topLevel.push(this.categories[key].label);
          }
        }
        return topLevel;
      },
      selectedCategories: function() {
        var selected = [];
        for (key in this.categories) {
          if (this.checkedProgramTypes.indexOf(this.categories[key].label) != -1) {
            selected.push(this.categories[key]);
          }
        }
        return selected;
      }
    },
    mounted: function() {
      var component = this;
      component.categories = drupalSettings.activityFinder.categories;
      this.runAjaxRequest();
      component.$watch('keywords', function(){
        component.updateSearchQuery();
      });
      component.$watch('checkedAges', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedDays', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedProgramTypes', function(){
        component.updateSearchQuery();
        component.checkFilters(1);
      });
      component.$watch('checkedActivities', function(){
        component.updateSearchQuery();
        component.checkFilters(2);
      });
      component.$watch('checkedLocations', function(){
        component.updateSearchQuery();
        component.checkFilters(3);
      });
      // Get url from paragraph's field.
      component.afResultsRef = $('.field-prgf-af-results-ref a').attr('href');
    },
    delimiters: ["${","}"]
  });
})(jQuery);
