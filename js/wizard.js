var wiz = class {
      constructor(obj,steps,opts) {
        this.elem = $(obj);
        this.steps = steps;
        this.opts = opts;
        this.data = [];
        this.current_step = 0;
        this.listeners = this.listeners();
        this.setup(steps);
        this.start();
      }

      listeners() {
        var l = new Object(),
        wiz = this;

        l.nextStep = $(this.elem).on("click","button.nextStep",function() {
          wiz.current_step++;
          wiz.goToStep(wiz.current_step,wiz.current_step-1);
        });

        l.prevStep = $(this.elem).on("click","button.prevStep",function() {
          wiz.current_step--;
          wiz.goToStep(wiz.current_step,wiz.current_step+1);
        });

        l.runStep = $(this.elem).on("click",".content button.runStep",function() {
            wiz.doAction(wiz.current_step);
        });

        l.enableNext = $(document).on("click","a.enableNext",function() {
            wiz.elem.find('.buttons button.nextStep').prop('disabled',false).trigger("click");
        });
      }

      goToStep(step,prev) {
        // $(this.elem).children('.buttons').children('button.nextStep').text(this.current_step);

        if(step > prev) {
          if(this.elem.find('form').length > 0) {
            // attach any formdata to the step
            this.steps[prev].formdata = this.elem.find('form').serializeArray();
            console.log(this.elem.find('form').serializeArray());
          }
        }

        $(this.elem).find('.steps a').removeClass('active');
        $(this.elem).find('.steps a[data-step="'+step+'"]').addClass('active');

        if(typeof(this.steps[step].response) != "undefined") {
          $(this.elem).find('.content .response').html(this.steps[step].response.innerHTML);
          $(this.elem).find('.content button.runStep').prop('disabled',true);
        }

        this.setContent(step);

        if(step > 0) {
          $(this.elem).find('div.buttons button.prevStep').prop('disabled',false);
        } else {
          $(this.elem).find('div.buttons button.prevStep').prop('disabled',true);
        }
        if(step+1 === this.steps.length) {
          $(this.elem).find('div.buttons button.nextStep').prop('disabled',true);
        } else {
          if((typeof(this.steps[step].action) == "string" || typeof(this.steps[step].action) == "function") && (step > prev && typeof(this.steps[step].response) == "undefined")) {
            $(this.elem).find('div.buttons button.nextStep').prop('disabled',true);
          } else {
            $(this.elem).find('div.buttons button.nextStep').prop('disabled',false);
          }
        }
      }

      doAction(step) {
        var pass = false;

        $(this.elem).find('.content .response').html('<div class="progress progress-striped active" role="progressbar"> \
                                                          <div class="progress-bar" style="width: 100%;">\
                                                              <span class="sr-only"></span>\
                                                          </div>\
                                                      </div>');

        if(typeof(this.steps[step].action) == "function") {
          var
          stepObj = this.steps[step],
          wiz = this,
          stepResp = function(s) {
            if (s === false) {
              wiz.checkPass(step,false);
            } else if (s === true) {
              wiz.checkPass(step,true);
            } else if (s === null) {
              // do nothing, disabled run step because it didn't exactly fail
              wiz.elem.find('.content .prompt button').prop('disabled',true);
            } else {
              wiz.checkPass(step,false);
              console.log('Valid response not received');
            }
          },
          status = function(resp) {
              wiz.elem.find('.response').html(resp);
          },
          resp = stepObj.action( wiz, stepResp, status );

          // var resp = $.when( this.steps[step].action() ).done(function( data, textStatus, jqXHR ) {
          //               console.log([data,textStatus,jqXHR]);
          //             });
          // if(resp == this.steps[step].pass || typeof(this.steps[step].pass) == "undefined") {
          //   pass = true;
          //   return this.checkPass(step,pass);
          // }
        } else {
          alert('Invalid action defined on step '+step);
        }
      }

      checkPass(step,bool) {
        if(bool) {
          if(typeof(this.steps[step].success) != "undefined") {
            $(this.elem).find('.content .response').html('<div class="alert alert-success" role="alert">'+this.steps[step].success+'</div>');
          } else {
            $(this.elem).find('.content .response').html('<div class="alert alert-success" role="alert">Step completed, click next.</div>');
          }
          console.log([step+1,this.steps.length]);
          if(step+1 < this.steps.length) {
            $(this.elem).find('div.buttons button.nextStep').prop('disabled',false);
            $(this.elem).find('div.content button').prop('disabled',true);
          }
          this.steps[step].response = $(this.elem).find('.content .response').html();
        } else {
          $(this.elem).find('.content .response').html('<div class="alert alert-danger" role="alert">There was an error. Please try again.</div>');
        }
      }

      createStep(index,step) {
        $(this.elem).find('div.steps').append('<a href="javascript:;" data-step="'+index+'" class="step"><i class="fa fa-'+step.icon+'"></i> '+step.title+'</a>');
      }

      async setup(steps) {
        this.elem.addClass('wizard_box');
        this.elem.append('<div class="steps"></div><div class="content"><div class="prompt"></div><div class="response"></div></div><div class="buttons"></div>');
        // this.elem.parent('div').before('<a href="javascript:;" class="enableNext">enable</a>');
        if(typeof(this.opts.title) != "undefined") {
            this.elem.prepend('<div class="title">'+this.opts.title+'</div>');
        }

        if(typeof(this.opts.back) == "undefined" || (this.opts.back && this.opts.back == true)) {
          this.elem.find('.buttons').append('<button type="button" disabled class="btn prevStep btn-default">Back</button>');
        }
        this.elem.find('.buttons').append('<button type="button" disabled class="btn nextStep btn-primary">Next</button>');
        this.elem.find('button').prop('disabled',true);
        var wiz = this;
        for(var i=0; i < steps.length; i++) {
            wiz.createStep(i,steps[i]);
        }
      }

      start() {
        this.elem.find('div.steps a.step').first().addClass('active');
        var first_id = this.elem.children('a.step.active').data('step');
        this.goToStep(0,0);
      }

      setContent(step) {

        var button = '';
        if(typeof(this.steps[step].action) != "undefined") {
          var button_text = (typeof(this.steps[step].action_text) != "undefined") ? this.steps[step].action_text : 'Run Step',
          button = '<div style="margin-top:10px;"><button class="btn btn-lg btn-success runStep">'+button_text+'</button></div>';
        }

        var resp = '';
        if(typeof(this.steps[step].response) != "undefined" && this.steps[step].response.length > 0) {
          resp = this.steps[step].response;
        }

        var text = this.steps[step].text;
        if(typeof(this.steps[step].text) == "function") {
          var text = this.steps[step].text(this,this.steps[step]);
        }

        this.elem.children('div.content').html('<h3>'+this.steps[step].title+'</h3><div class="prompt">'+text+button+'</div><div class="response">'+resp+'</div>');

        if(resp != "") {
          $(this.elem).find('.content button').prop('disabled',true);
        }
      }
    }
