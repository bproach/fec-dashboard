(function() {
  var Filing, FilingView, Filings, SaveSettingsView, Settings, appSettings, committeeTypes, filings, requestPermission, title, windowFocused;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  filings = null;
  appSettings = null;
  title = '';
  windowFocused = true;
  committeeTypes = {
    'C': 'Communication Cost',
    'D': 'Delegate',
    'E': 'Electioneering Communication',
    'H': 'House',
    'I': 'Independent Expenditor (Person or Group)',
    'N': 'PAC - Nonqualified',
    'O': 'Independent Expenditure-Only (Super PAC)',
    'P': 'Presidential',
    'Q': 'PAC - Qualified',
    'S': 'Senate',
    'U': 'Single Candidate Independent Expenditure',
    'X': 'Party Nonqualified',
    'Y': 'Party Qualified',
    'Z': 'National Party Nonfederal Account'
  };
  requestPermission = function(callback) {
    return window.webkitNotifications.requestPermission(callback);
  };
  Filing = (function() {
    __extends(Filing, Backbone.Model);
    function Filing() {
      Filing.__super__.constructor.apply(this, arguments);
    }
    Filing.prototype.initialize = function() {
      this.set({
        committee_id: this.get('fec_committee_id')
      });
      this.set({
        full_committee_type: committeeTypes[this.get('committee_type')]
      });
      this.set({
        raised: this.format_amount(this.get('receipts_total'))
      });
      this.set({
        spent: this.format_amount(this.get('disbursements_total'))
      });
      this.set({
        view: new FilingView({
          model: this
        })
      });
      if (!this.get('initialLoad')) {
        return this.alert();
      }
    };
    Filing.prototype.format_amount = function(n) {
      var regex, x, x1, x2;
      if (!n) {
        return;
      }
      n += '';
      x = n.split('.');
      x1 = x[0];
      x2 = x.length > 1 ? '.' + x[1] : '';
      regex = /(\d+)(\d{3})/;
      while (regex.test(x1)) {
        x1 = x1.replace(regex, '$1' + ',' + '$2');
      }
      return x1 + x2;
    };
    Filing.prototype.alert = function() {
      var amendment, icon, popup;
      if (!appSettings.get('showNotifications')) {
        return;
      }
      if (!window.webkitNotifications) {
        console.log('No support for desktop notifications');
      }
      if (window.webkitNotifications.checkPermission() > 0) {
        requestPermission(this.alert);
      }
      icon = 'http://query.nictusa.com/images/fec1.gif';
      amendment = '';
      if (this.get('is_amendment')) {
        amendment = ' [amendment] ';
      }
      popup = window.webkitNotifications.createNotification(icon, this.get('committee_name'), "" + (this.get('report_title')) + amendment);
      return popup.show();
    };
    return Filing;
  })();
  Filings = (function() {
    __extends(Filings, Backbone.Collection);
    function Filings() {
      Filings.__super__.constructor.apply(this, arguments);
    }
    Filings.prototype.model = Filing;
    Filings.prototype.getFilings = function(initialLoad, date) {
      var month, newFilings, url;
      if (initialLoad == null) {
        initialLoad = false;
      }
      if (date == null) {
        date = null;
      }
      if (!(appSettings.get('apikey').length > 0)) {
        return;
      }
      if (date) {
        month = date.getMonth();
        if (month < 12) {
          month += 1;
        } else {
          month = 1;
        }
        url = "http://api.nytimes.com/svc/elections/us/v3/finances/2012/filings/" + (date.getFullYear()) + "/" + month + "/" + (date.getDate()) + ".json";
      } else {
        url = 'http://api.nytimes.com/svc/elections/us/v3/finances/2012/filings.json';
      }
      newFilings = false;
      $.ajax({
        dataType: 'jsonp',
        url: url,
        data: {
          'api-key': $("#apikey").val()
        },
        success: __bind(function(data) {
          var result, _i, _len, _ref, _results;
          if (data.status !== 'OK') {
            throw new Error("Error. Status: " + data.status);
          }
          _ref = data.results;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            result = _ref[_i];
            _results.push(!this.get(result.fec_uri) ? (result = _(result).extend({
              id: result.fec_uri,
              timestamp: new Date(),
              initialLoad: initialLoad
            }), this.add(result), newFilings = true) : void 0);
          }
          return _results;
        }, this)
      });
      if (newFilings) {
        if (!initialLoad) {
          if (!windowFocused) {
            $("title").html("[*] " + title);
          }
        }
      }
      return setTimeout((__bind(function() {
        return this.getFilings();
      }, this)), 900000);
    };
    return Filings;
  })();
  FilingView = (function() {
    __extends(FilingView, Backbone.View);
    function FilingView() {
      FilingView.__super__.constructor.apply(this, arguments);
    }
    FilingView.prototype.tagName = 'tr';
    FilingView.prototype.initialize = function() {
      this.template = _.template($("#filing-row-template").html());
      this.mobileTemplate = _.template($("#mobile-filing-row-template").html());
      return this.render();
    };
    FilingView.prototype.render = function() {
      var mobileEl;
      $(this.el).html(this.template(this.model.toJSON()));
      if (this.model.get('initialLoad')) {
        $("#filings tbody").append(this.el);
      } else {
        $("#filings tbody").prepend(this.el);
      }
      mobileEl = this.$el.clone();
      $(mobileEl).html(this.mobileTemplate(this.model.toJSON()));
      if (this.model.get('initialLoad')) {
        return $("#mobile-filings tbody").append(mobileEl);
      } else {
        return $("#mobile-filings tbody").prepend(mobileEl);
      }
    };
    return FilingView;
  })();
  Settings = (function() {
    __extends(Settings, Backbone.Model);
    function Settings() {
      Settings.__super__.constructor.apply(this, arguments);
    }
    Settings.prototype.defaults = {
      apikey: '',
      showNotifications: false
    };
    Settings.prototype.initialize = function() {
      var args;
      args = this.getQs();
      if (args.apikey != null) {
        $("#apikey").val(args.apikey);
        this.set({
          apikey: args.apikey
        });
      }
      return this.set({
        showNotifications: args.notify === 'true'
      });
    };
    Settings.prototype.getQs = function() {
      var args, k, pair, pairs, qs, v, _i, _len, _ref;
      qs = window.location.search.substring(1);
      pairs = qs.split('&');
      args = {};
      for (_i = 0, _len = pairs.length; _i < _len; _i++) {
        pair = pairs[_i];
        _ref = pair.split('='), k = _ref[0], v = _ref[1];
        args[k] = unescape(v);
      }
      return args;
    };
    Settings.prototype.save = function(callback) {
      this.set({
        apikey: $("#apikey").val(),
        showNotifications: $("#show-notifications").attr('checked') === 'checked'
      });
      if (this.get('apikey').length > 0) {
        window.location.search = "?apikey=" + (this.get('apikey')) + "&notify=" + (this.get('showNotifications'));
      }
      return filings.getFilings(true);
    };
    return Settings;
  })();
  SaveSettingsView = (function() {
    __extends(SaveSettingsView, Backbone.View);
    function SaveSettingsView() {
      SaveSettingsView.__super__.constructor.apply(this, arguments);
    }
    SaveSettingsView.prototype.el = "#save-settings";
    SaveSettingsView.prototype.events = {
      'click': 'handleClick'
    };
    SaveSettingsView.prototype.handleClick = function(e) {
      e.preventDefault();
      if ($("#show-notifications").attr('checked', 'checked') && window.webkitNotifications.checkPermission() > 0) {
        requestPermission(function() {});
      }
      return $("#settings").modal('hide');
    };
    return SaveSettingsView;
  })();
  $(document).ready(function() {
    var month, today;
    title = $("title").html();
    filings = new Filings();
    appSettings = new Settings();
    filings.getFilings(true);
    if (appSettings.get('apikey')) {
      $("#filing-content").show();
    } else {
      $("#welcome").show();
    }
    $("#settings").on('shown', function() {
      var saveSettingsView;
      saveSettingsView = new SaveSettingsView();
      if (appSettings.get('showNotifications') === true) {
        return $("#show-notifications").attr('checked', 'checked');
      }
    });
    $("#settings").on('hide', function() {
      return appSettings.save();
    });
    $("#update-now").bind('click', function() {
      return filings.getFilings();
    });
    $("#welcome-enter-api-key").bind('click', function() {
      return $("#settings").modal('show');
    });
    $(window).blur(function() {
      return windowFocused = false;
    });
    $(window).focus(function() {
      return windowFocused = true;
    });
    $(window).bind('focus', function() {
      return $("title").html(title);
    });
    today = new Date();
    month = today.getMonth();
    if (month < 12) {
      month += 1;
    } else {
      month = 1;
    }
    $("#datepicker-input").val("" + (today.getFullYear()) + "-" + month + "-" + (today.getDate()));
    return $("#datepicker").datepicker({
      format: 'yyyy-mm-dd',
      endDate: new Date(),
      autoclose: true
    }).on('changeDate', function(ev) {
      var date;
      date = new Date(ev.date.valueOf());
      date.setDate(date.getDate() + 1);
      $("#filings tbody tr").remove();
      filings.reset();
      return filings.getFilings(true, date);
    });
  });
}).call(this);
