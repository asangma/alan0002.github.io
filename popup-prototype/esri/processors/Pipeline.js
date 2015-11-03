/**
 * A Pipeline chains together multiple Filters to form a workflow. It has an input Collection that is
 * the input of the first Filter. The output of a Pipeline is the output collection of the final
 * steps in the workflow.
 * @module esri/processors/Pipeline
 */

/**
 * @typedef {Object} WorkflowStep
 * @property {Object} processor - The {@link module:esri/processors/Filter|Filter} or
 * {@link module:esri/processors/Pipeline|Pipeline} that is run in the step.
 * @property {WorkflowStep} parent - The previous workflow step
 * @property {WorkflowStep[]} children - The workflow steps that run after this step.
 */
define([
  "../core/declare",

  "esri/core/Accessor",
  "esri/core/Collection",

  "esri/processors/Filter"
],
function(
  declare,
  Accessor, Collection,
  Filter
){

  /**
   * Make a new Pipeline. After making a new Pipeline, the input must be set.
   * @extends module:esri/core/Accessor
   * @constructor module:esri/processors/Pipeline
   */
  var Pipeline = declare([Accessor], {

    declaredClass: "esri.processors.Pipeline",

    classMetadata: {
      properties: {
        output: {
          readOnly: true
        },
        currentStep: {
          readOnly: true
        }
      }
    },

    //--------------------------------------------------------------------------
    //
    //  Lifecycle
    //
    //--------------------------------------------------------------------------

    constructor: function() {
      this._workflow = [];
    },

    /**
     * Destroy all the pieces controlled by the pipeline. This includes filters, inputs for all filters except the first one,
     * and outputs for all workflow steps that are intermediate steps.
     * @private
     */
    destroy: function(){
      var step,
        processor,
        incoll,
        outcolls,
        outcoll;
      for(var i = this._workflow.length - 1; i >= 0; i--){
        step = this._workflow[i];
        processor = step.processor;
        incoll = processor.input;

        //If workflow step processor is a pipeline, call destroy on it.
        if(processor.isInstanceOf(Pipeline)){
          processor.destroy();
          outcolls = processor.output;
        }
        else{
          outcolls = [{
            processor: processor,
            collection: processor.output
          }];

          //set input to null to remove handler
          processor.input = null;
        }

        //Delete the input if the step has no parent since this means it is not the first in the chain.
        //Delete the output(s) if the step has no children since this means it is not an output step.
        if(incoll && step.parent){
          incoll.clear();
          incoll = null;
        }

        if(outcolls && step.children.length){
          for(var j = 0, m = outcolls.length; j < m; j++) {
            outcoll = outcolls[j].collection;
            //outcoll.clear();
            outcoll = null;
          }
        }
      }
      this._workflow.splice(0, this._workflow.length);
      this._currentStep = null;
      this.notifyChange("currentStep");
    },

    //--------------------------------------------------------------------------
    //
    //  Variables
    //
    //--------------------------------------------------------------------------

    _workflow: null,

    _changeHandler: null,

    
    //--------------------------------------------------------------------------
    //
    //  Properties
    //
    //--------------------------------------------------------------------------

    //----------------------------------
    //  input
    //----------------------------------

    /**
     * The input collection.
     * @type {module:esri/core/Collection|Collection}
     */
    input: null,

    //TODO Add check to see if input was already set. Need to force clearing of old input data from steps in workflow
    _inputSetter: function(input){
      if(this._workflow.length){
        this._workflow[0].processor.input = input;
      }
      return input;
    },

    //----------------------------------
    //  output
    //----------------------------------

    /**
     * The output collection(s). It is the output of the
     * steps in the workflow that are not connected to other workflow steps. The output is an array of objects:
     * ```
     *   {
     *     collection: the output {@link module:esri/core/Collection|Collection},
     *     processor: the {@link module:esri/processors/Filter|Filter} that generated to output Collection
     *   }
     *   ```
     * @name output
     * @type {Object[]}
     */
    _outputGetter: function(){
      var outputs = [],
        workflowStep,
        processor;
      if(!this._workflow.length){
        return outputs;
      }

      //loop through workflow steps and get outputs for steps that do not have children
      for (var i = 0; i < this._workflow.length; i++){
        workflowStep = this._workflow[i];
        if(!workflowStep.children.length){
          processor = workflowStep.processor;
          if(processor.isInstanceOf(Filter)){
            outputs.push({
              collection: processor.output,
              processor: processor
            });
          }
          else{
            outputs = outputs.concat(workflowStep.processor.output);
          }
        }
      }
      return outputs;
    },

    //----------------------------------
    //  currentStep
    //----------------------------------

    /**
     * The current workflow step in the processor. Calling `branch` will create a branch pipeline from this workflow step.
     * @type {WorkflowStep}
     */
    _currentStep: null,

    _currentStepGetter: function(){
      return this._currentStep;
    },

    
    //--------------------------------------------------------------------------
    //
    //  Public Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Adds a workflow step to the end of the Pipeline's workflow.
     *
     * * If no filters are in the workflow
     *   * The input of the step's filter is set to be the input of the pipeline if it has been set.
     *   * If the pipeline has no input, but the step's filter does, the input of the pipeline is set to be the input of the step's filter
     * * If filters are in the workflow, the input for the filter is set to be the output of the pipeline's currentNode.
     *
     * @param {module:esri/processors/Filter} filter The {@link module:esri/processors/Filter|Filter} that is executed in the new workflow step.
     * @returns {Pipeline} This pipeline so that other workflow steps can be added by chaining `pipe` calls.
     */
    pipe: function(filter){
      if(!filter || !filter.isInstanceOf(Filter)){
        throw new TypeError("Invalid value for 'filter' argument");
      }

      var input,
        curStep,
        newStep;
      try{
        //make new workflow step
        newStep = {
          processor: filter,
          children: [],
          parent: null
        };

        //get current workflow step of pipeline
        curStep = this.currentStep;

        //chain new step with previous step or wire up pipeline input to new step
        if(curStep){
          //set input of passed in filter to be the output of the current workflow step
          input = curStep.processor.output;
          filter.input = input;

          //set parent child relationships
          curStep.children.push(newStep);
          newStep.parent = curStep;
        }
        else{
          if(this.input){
            newStep.processor.input = this.input;
          }
          else if(newStep.processor.input){
            this.input = newStep.processor.input;
          }
        }

        //set output of filter to be a new Collection
        newStep.processor.output = new Collection();

        //set pipeline's current step to be the new step
        this._currentStep = newStep;
        this.notifyChange("currentStep");

        //add the new step to the pipeline workflow
        this._workflow.push(newStep);
      }
      catch(err){
        throw err;
      }
      return this;
    },

    /**
     * Branch the pipeline's workflow. This creates a new workflow step that
     *   has a processor that is a Pipeline. The parent of the new workflow step is the
     *   Pipeline's current workflow step. After branching, the pipeline's currentStep property
     *   stays the same so that multiple branches can be created off of the current step.
     *   A pipeline is returned from the branch method so that it can be configured with a workflow.
     * @returns {Pipeline} The branch in the workflow
     *
     */
    branch: function(){
      var pipeline = new Pipeline(),
        curStep = this.currentStep,
        newStep;

      //if no workflow steps have been added yet, add a noop filter and use that as the first workflow step
      if(!curStep){
        this.pipe(new Filter());
        curStep = this.currentStep;
      }

      //make new workflow step and wire up parent child relationship
      newStep = {
        processor: pipeline,
        parent: this.currentStep,
        children: []
      };
      newStep.processor.input = curStep.processor.output;
      curStep.children.push(newStep);
      this._workflow.push(newStep);

      return pipeline;
    }

    //TODO Figure out the best way to allow a developer to access the filters in a workflow
    /*getFilter: function(index){
      var filter;
      if(typeof index === "number" && this._workflow.length > index){
        filter = this._workflow[index];
      }
      return filter;
    }*/
  });
  return Pipeline;
});
