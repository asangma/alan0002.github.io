define(
  [
    "require",
    "../core/declare",
    "dojo/_base/lang",
    "dojo/has",
    "../kernel",

    "dojo/_base/array",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/query",

    "dijit/_Widget",
    "dijit/_TemplatedMixin",

    "dojo/text!./templates/Form.html"
  ], function (
    require, declare, lang, has, esriKernel,
    array, domStyle, domConstruct, domClass, query,
    _Widget, _TemplatedMixin,
    widgetTemplate
  ) {
    var Form = declare([_Widget, _TemplatedMixin], {
      declaredClass: "esri.widgets.Form",

      widgetsInTemplate: true,
      templateString: widgetTemplate,

      widgets: {},

      fieldTypes: {
        "string": {
          widget: "dijit/form/TextBox"
        },
        "date": {
          widget: "dijit/form/DateTextBox"
        },
        "number": {
          widget: "dijit/form/NumberTextBox"
        },
        "boolean": {
          widget: "dijit/form/Select",
          widgetParameters: {
            'options': [{
              'label': 'True',
              'value': 'true'
            }, {
              'label': 'False',
              'value': 'false'
            }]
          }
        }
      },

      fieldTemplate: '<div>' +
        '<div>{label}</div>' +
        '<div>{widget}</div>' +
        '</div>',

      constructor: function (params, srcNodeRef) {
        this.fieldTypes = lang.mixin(this.fieldTypes, params.fieldTypes);
      },

      postCreate: function () {
        this._fieldsLength = this.fields.length;
        array.forEach(this.fields, function (field) {
          //create label and widget
          this.addField(field);          
        }, this);
      },

      destroy: function () {
        this.inherited(arguments);
        var name, widget;
        for (name in this.widgets) {
          if (this.widgets.hasOwnProperty(name)) {
            widget = this.widgets[name];
            widget.destroy();            
          }
        }
        this.widgets = null;
      },

      /*****************
       * Public Methods
       *****************/
      addField: function (field) {
        var label, template, domHtml, node, widgetHolder, widgetParameters, widget, widgetId;
        var self = this;

        //create label and widget holder for the field
        template = field.template || this.fieldTemplate;
        label = field.label || field.name;
        domHtml = template.replace('{label}', '<span class="esriFormFieldLabel">'+label+'</span>');
        domHtml = domHtml.replace('{widget}', '<div class="esriFormFieldWidget"></div>');
        node = domConstruct.toDom(domHtml);
        domClass.add(node, "esriFormField");
        widgetHolder = query('.esriFormFieldWidget', node)[0];
        domStyle.set(node, {
          'display': field.visible === false ? 'none' : 'block'
        });
        widgetId = field.widget || this.fieldTypes[field.type].widget;
        require([widgetId], function (wCtor) {
          widgetParameters = field.widgetParameters || self.fieldTypes[field.type].widgetParameters || {};
          widget = new wCtor(widgetParameters, widgetHolder);
          widget.startup();
          //dojo dijit remove the place holder's div
          //so it has to re-add the class.
          domClass.add(widget.domNode, "esriFormFieldWidget");

          //add more properties to widget so that could be retrieved later
          widget.fieldNode = node;
          widget.initialState = {
            value: field.value || null,
            visible: field.visible || true,
            disabled: field.disabled || false
          };
          self.domNode.appendChild(node);
          self.widgets[field.name] = widget;
          self.setField(field);

          //pass change event from the field widget to the form widget          
          widget.on('change', lang.hitch(self, function (name, e) {
            var value, eventArg;
            if (e) {
              value = e.value || e;
              if (e.target && e.target.value) {
                value = e.target.value;
              }              
              
              eventArg = {
                fieldName: name,
                value: value
              };
              self.emit('value-change', eventArg);
            }
          }, field.name));

          //because widgets are lazy loaded, it may not honor the order or the fields
          //TODO: create a sort function
          self._fieldsLength--;
          var fieldNodes, i, j;
          if (self._fieldsLength === 0) {
            fieldNodes = query(".esriFormField", self.domNode);
            for (i = 0; i < fieldNodes.length; i++) {
              for (j = i; j < fieldNodes.length; j++) {
                //find the field
                if ((self.fields[i].label || self.fields[i].name) === query('.esriFormFieldLabel', fieldNodes[j])[0].innerHTML) {
                  domConstruct.place(fieldNodes[j], self.domNode, i);
                }
              }
            }
          }
        });
      },

      removeField: function(/*field name, Or, field object*/name){
        if (!lang.isString(name)) {
          name = name.name;
        }
        var widget = this.getWidget(name);
        widget.fieldNode.parentNode.removeChild(widget.fieldNode);
        widget.destroy();
      },

      getWidget: function (name) {
        return this.widgets[name];
      },

      reset: function () {
        var name, initialState;
        for (name in this.widgets) {
          if (this.widgets.hasOwnProperty(name)) {
            initialState = this.widgets[name].initialState;
            this.setField({
              name: name,
              value: initialState.value,
              visible: initialState.visible,
              disabled: initialState.disabled
            });
          }
        }
      },

      getField: function (name) {
        var widget = this.getWidget(name),
            label = query('.esriFormFieldLabel', widget.parentNode)[0].innerHTML;
        return {
          'label': label,
          'name': name,
          'value': widget.value || widget.getValue(),
          'visible': widget.visible,
          'disabled': widget.disabled
        };
      },

      setValues: function (obj) {
        var name;
        for (name in obj) {
          if (obj.hasOwnProperty(name)) {
            this.setValue(name, obj[name]);
          }
        }
      },

      setValue: function (name, value) {
        var widget = this.getWidget(name);
        if (widget.setValue){
          widget.setValue(value);
        }
        else if (widget.set) {
          widget.set('value', value);
        }        
      },

      setFields: function (fields) {
        array.forEach(fields, function(field){
          this.setField(field);
        });
      },

      setField: function (field) {
        var widget = this.getWidget(field.name);
        var labelNode = query('.esriFormFieldLabel', widget.fieldNode)[0];
        labelNode.innerHTML = field.label || field.name;
        if (field.visible === true || field.visible === false) {
          if (widget.setVisibility) {
            widget.setVisibility(field.visible);
          }
          else if (widget.set) {
            widget.set('visible', field.visible);
          }
        }
        if (field.disabled === true || field.disabled === false) {
          if (widget.setDisabled) {
            widget.setDisabled(field.disabled);
          }
          else if (widget.set) {
            widget.set('disabled', field.disabled);
          }
        }
        if (field.value !== undefined || field.value !== null) {
          if (widget.setValue){
            widget.setValue(field.value);
          }
          else if (widget.set) {
            widget.set('value', field.value);
          }
        }
      }
    });

    

    return Form;
  });