sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/Device",
    "ch/unige/fi/uialmamodule/model/models",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/m/MessageBox"
  ],
  function (UIComponent, NumberFormat, Device, models,MessageToast, Filter, MessageBox) {
    "use strict";

    return UIComponent.extend(
      "ch.unige.fi.uialmamodule.Component",
      {
        metadata: {
          manifest: "json",
        },


        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */

      init: function () {

          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);
  
          // enable routing
          this.getRouter().initialize();

          // Set Global Posting.json Model 
          sap.ui.getCore().setModel(this.getModel("Posting"), "Posting");
 
          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          // 1. Get the Task Properties
          var startupParameters = this.getComponentData().startupParameters;
          var taskModel = startupParameters.taskModel;
          var taskData = taskModel.getData();
          var taskId = taskData.InstanceID;


          // 2. Read the Task Data
          var that = this;
          var contextModel = new sap.ui.model.json.JSONModel("/alma_mng_approuter.chunigefiuialmamodule/bpmworkflowruntime/v1/task-instances/" + taskId + "/context");
          var contextData = contextModel.getData();

 
          // 3. Update UI Context Model with Task Properties Data
            contextModel.attachRequestCompleted(function () {

                contextData = contextModel.getData();

                var processContext = {};
                processContext.context = contextData;
                processContext.context.task = {};
                processContext.context.task.Title = taskData.TaskTitle;
                processContext.context.task.Priority = taskData.Priority;
                processContext.context.task.Status = taskData.Status;
                processContext.context.task.taskId = taskData.InstanceID;
                
                if (taskData.Priority === "HIGH") {
                    processContext.context.task.PriorityState = "Warning";
                } else if (taskData.Priority === "VERY HIGH") {
                    processContext.context.task.PriorityState = "Error";
                } else {
                    processContext.context.task.PriorityState = "Success";
                }

                processContext.context.task.CreatedOn = taskData.CreatedOn.toDateString();
                // https://help.sap.com/doc/72317aec52144df8bc04798fd232a585/Cloud/en-US/wfs-core-api-docu.html#api-UserTaskInstances-v1TaskInstancesGet
                //processor: The user who is processing (has claimed) the user task instance. The user ID is at most 255 characters long.

                // get task description and add it to the model
                startupParameters.inboxAPI.getDescription("NA", taskData.InstanceID).done(function (dataDescr) {
                    processContext.context.task.Description = dataDescr.Description;
                    contextModel.setProperty("/task/Description", dataDescr.Description);
                }).
                    fail(function (errorText) {});


                // Load data from the backend 
                that.LoadData(processContext.context);


                contextModel.setData(processContext.context);
                that.setModel(contextModel);

            });



               var that = this;


                  // Button =>>> "Sauvegarder Facture"
                   
                  that.getInboxAPI().addAction(
                      {
                        action: "SAVE",
                        label: "Sauvegarder Facture",
                        type: "accept", // (Optional property) Define for positive appearance
                      },
                 
                      function () {
                          var viewModel = that.getModel();
                          var contxt = viewModel.getData();
      
                                        
                          if ( that._checkdefaultvalue(contxt) === true ){ 
 
                                MessageBox.information(
                                    'Voulez-vous remplacer le montant initial de la facture?', {
                                        id: "serviceErrorsMessageBoxconf",
                                            
                                        textAlignment: "Center",
                    
                                        actions: [MessageBox.Action.OK, MessageBox.Action.NO],

                                        onClose: function(sAction) {



                                            if( sAction === MessageBox.Action.OK ) {

                                                // replace the AMOUNT of the Invoice
                                                that._changeamount(that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, contxt);

                                                  // Action 1 =>   - Save Parked Document
                                                  that.SaveDocument(true);
                                                } else {
                                                  //do nothing, just close the dialog ;)
                                                }

                                        }.bind(this)
                                    }
                                );
                        
                    
            

                          } else {

                                  // Action 1 =>   - Save Parked Document
                                  that.SaveDocument(true)
                          }


                              ///// this.SaveDocument(true);
                        }

                  );



                  // Button =>>> "Comptabiliser"
                  this.getInboxAPI().addAction(
                    {
                      action: "APPROVE",
                      label: "Comptabiliser",
                      type: "accept", // (Optional property) Define for negative appearance
                    },
                    function () {
                      var viewModel = that.getModel();
                      var contxt = viewModel.getData();

                        
                      if (that._checkdefaultvalue(contxt) === true ){ 

                              MessageBox.information(
                                'Voulez-vous remplacer le montant initial de la facture?', {
                                    id: "serviceErrorsMessageBoxconf",
                                        
                                    textAlignment: "Center",
                
                                    actions: [MessageBox.Action.OK, MessageBox.Action.NO],

                                    onClose: function(sAction) {

                                        if( sAction === MessageBox.Action.OK ) {


                                        // replace the AMOUNT of the Invoice
                                        that._changeamount(that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, contxt);

                                        that.PostDocument(true);
                                        that.completeTask(false);

                            
                                      } else {
                                              //do nothing, just close the dialog ;)
                                        }

                                      }.bind(this)
                                  }
                                );
  
        
                           } else {


                                  // Post data to Backend
                                  that.PostDocument(true);
                                  that.completeTask(false);
  
  
  
                            }
                      }
                  
                  );


                  // Delete Button 

                  that.getInboxAPI().addAction(
                    {
                      action: "Supprimer",
                      label: "Supprimer",
                      type: "Reject", // (Optional property) Define for negative appearance
                    },
                    function () {
                      var viewModel = that.getModel();
                      var contxt = viewModel.getData();

         
                      MessageBox.information(
                        'Voulez-vous supprimer la facture?', {
                            id: "serviceErrorsMessageBoxconf",
                                        
                                    textAlignment: "Center",
                
                                    actions: [MessageBox.Action.OK, MessageBox.Action.NO],

                                    onClose: function(sAction) {

                                        if( sAction === MessageBox.Action.OK ) {


  
                                     // Post data to Backend to delete the parked document
                                
                                     that._save_parked_document(that.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, contxt, "D", false);

                            
                                      } else {
                                              //do nothing, just close the dialog ;)
                                        }

                                      }.bind(this)
                                  }
                                );
  
        
               
                      }
                  
                  );

        },  //   init: function ()



                      /**
                     * replace the Header Amount
                     * @param {contxt}   
                     * @return        
                     **/
                      _changeamount: function (taskId, contxt){

                        var oRegularizeLines =  contxt.toItems;

                        // calculate TOTAL
                        var sTotal = 0.00;
                        var Divise = "";
                        var Charnumber = 0.00;
 


                        for (var r = 0; r < oRegularizeLines.length; r++) {

                            Charnumber = oRegularizeLines[r].Montant;
                            var number = Number.parseFloat(Charnumber);
                            sTotal = sTotal + number;
                            Divise = oRegularizeLines[r].Divise
                        }
                        contxt.demande_amount  =  sTotal ;
 

                      // Total de la Demande -> Defaul = valuer de la pièce + Total Items
                      var oTotal = sap.ui.getCore().getModel("Total");


                      var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                        currencyCode: false
                       });
                      var tot_format = oCurrencyFormat.format(contxt.demande_amount, Divise); // returns ¥1,235

                        oTotal.setProperty("/Total_Reg",  tot_format );
                        oTotal.refresh();

 
                        var owf_context = this.getModel();

                        this._store_demande_amount(taskId, contxt.demande_amount);



                        owf_context.refresh();
                      },



              /**
              * check the amout contex !== tital amount of the items
              * @param {contxt} 
              * @return true/false        
              **/
              _checkdefaultvalue: function (contxt){
 
                var oRegularizeLines =  contxt.toItems;
       
                // calculate TOTAL
                var sTotal = 0.00;
                var sDivise = "";
                var Charnumber = 0.00;

                var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                    currencyCode: false
                  });


                for (var r = 0; r < oRegularizeLines.length; r++) {
                    Charnumber = oRegularizeLines[r].Montant;
                    var number = Number.parseFloat(Charnumber);

                    sTotal = sTotal + number;
                    sDivise = oRegularizeLines[r].Divise;
                    }

                    
               var tot_format = oCurrencyFormat.format(sTotal, sDivise); // returns ¥1,235
               var tot_format2 = oCurrencyFormat.format(contxt.demande_amount , sDivise); // returns ¥1,235


                if (  tot_format  !==  tot_format2 ){

                    return true;

                } else {  
                    return false;
                }
              },


                /**
                * check if the Total Amount 
                * @param {contxt} 
                * @return true/false        
                **/

                _checkmontant: function (contxt){
                  var oRegularizeLines =  contxt.toItems;

                  // calculate TOTAL
                  var sTotal = 0.00;
                  var sDivise = "";
                  var Charnumber = 0.00;


                  var oCurrencyFormat = NumberFormat.getCurrencyInstance({
                  currencyCode: false
                  });


                  for (var r = 0; r < oRegularizeLines.length; r++) {

                      Charnumber = oRegularizeLines[r].Montant;
                      var number = Number.parseFloat(Charnumber);

                      sTotal = sTotal + number;

                      sDivise = oRegularizeLines[r].Divise;

                  }
         

                  var tot_format = oCurrencyFormat.format(sTotal, sDivise); // returns ¥1,235
                   var tot_format2 = oCurrencyFormat.format(contxt.demande_amount, sDivise); // returns ¥1,235

                  if (  tot_format  ===  tot_format2 ){

                      return true;

                    } else {  
                      return false;
                    }
                },
               

                // 10. Store new demande_amount into workflow context
                /** _store_demande_amount
                *  
                * @param {taskIdn}
                * @param {contxt} 
                * @return {} 
                * @private
                * */
                _store_demande_amount: function (taskId, demande_amount){

                  var that = this;
              
                  var token = this._fetchToken();
                 // Step 1:
                // Retrieves the user task instance with the specified task instance ID. => we get the WF Instance ID
                //https://help.sap.com/doc/80205e0dc75945538b451284fdcc935b/Cloud/en-US/wfs-core-api-docu-cf.html#api-UserTaskInstances-v1TaskInstancesTaskInstanceIdGet
                ///v1/task-instances/{taskInstanceId}
              
                var Api_endpoint = "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/bpmworkflowruntime/v1/task-instances/" +  taskId ;
       
                $.ajax({
                  url: Api_endpoint,
                  method: "GET",
                  contentType: "application/json",
                  async: true,
                   headers: {
                      "X-CSRF-Token": token
                  },
                    // @ts-ignore
                    success: function (result2, xhr2, data2) {
                
                      debugger;

                          var RequestContent = {
                              demande_amount:  demande_amount 
                          };
                      
                      //result2.workflowInstanceId

                      // Step 2:
                      // Retrieves the user task instance with the specified task instance ID. => we get the WF Instance ID
                      //https://help.sap.com/doc/80205e0dc75945538b451284fdcc935b/Cloud/en-US/wfs-core-api-docu-cf.html#api-UserTaskInstances-v1TaskInstancesTaskInstanceIdGet
                      //v1/workflow-instances/{workflowInstanceId}/context

                         Api_endpoint = "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/bpmworkflowruntime/v1/workflow-instances/" + result2.workflowInstanceId + "/context";

                        $.ajax({
                            url: Api_endpoint,
                            method: "PATCH",
                            contentType: "application/json",
                            data: JSON.stringify(RequestContent),
                            async: true,
                            headers: {
                                "X-CSRF-Token": token
                            },
                            // @ts-ignore
                            success: function (result2, xhr2, data2) {
                            //Status: 204 - The context has been updated.
                            debugger;

                            },

                              // @ts-ignore
                              error: function (err) {

                                  MessageToast.show("Error submiting the request");
                              }
                         });

                    },

                    // @ts-ignore
                    error: function (err) {

                        MessageToast.show("Error submiting the request");
                    }

                });

              },


            // get data from Backend
            /**  
            * get data from Backend
            * @param {contxt} 
            * @return {} 
            * @private
            * */

            LoadData: function (context) {
                
              //   context.Ausbk
              //   context.Belnr
              //   context.Bukrs
              //   context.Gjahr
               
                  var that = this;

                 // get the BTP User ID 
                  $.ajax({
                     method: "GET",
                     url: "/alma_mng_approuter.chunigefiuialmamodule/user-api/currentUser",
                     async: false,
                       success: function (result, xhr, data) {
                         that._user_name = data.responseJSON.name;
                    
                         context.user_name = {};
                         context.user_name  =  that._user_name ;
 
                       
 
                       },
                       error: function (error) {
                         MessageToast.show("Error extraction de l'utilisateur");
                       }
                     
                   });
 
 
 
                   
                  // get the Backend Data
                  var key_query = '(Ausbk=' +  "'" + context.Ausbk +  "'"  + ',Bukrs=' +  "'"  
                  + context.Bukrs  + "'"  + ',Belnr=' +  "'"  + context.Belnr +  "'"  + ',Gjahr=' +  "'"  +  context.Gjahr  +  "'"  + ")";
                  
                  
                    // HEADER PARKET DOCUMENT AJAX
                    //(Ausbk='1000',Bukrs='1000',Belnr='1900000175',Gjahr='2023') -> Example
                      var key_query2 = key_query  + '?$format=json' ;
    
          
                      $.ajax({
                        url: "/alma_mng_approuter.chunigefiuialmamodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/ParkDocHeaderSet"+ key_query2,
                        method: "GET",
                        cache: false,
                        async: false,
                        success: function (result, xhr, data) {
    
    
                            var oParkedinvoiceH = data.responseJSON.d;
                       
                            context.customer_name = {};
                            context.customer_name = oParkedinvoiceH.Name;
    
    
                            context.ParkedinvoiceH = {};

                                 
                           // Bldat : "/Date(1698105600000)/"  - JSON Date Object - milliseconds
                           // Budat : "/Date(1698105600000)/"  - JSON Date Object - milliseconds
 

                           var Bldat_str = oParkedinvoiceH.Bldat.replace('/Date(','');
                               Bldat_str = Bldat_str.replace(')/','');
                           var Bldat = new Date(0); // Unix EPOCH time
                               Bldat.setUTCMilliseconds(Bldat_str);


                          var Budat_str = oParkedinvoiceH.Budat.replace('/Date(','');
                              Budat_str = Budat_str.replace(')/','');
                          var Budat = new Date(0); // Unix EPOCH time
                              Budat.setUTCMilliseconds(Bldat_str);
                        
                          var Duedate_str = oParkedinvoiceH.Duedate.replace('/Date(','');
                              Duedate_str = Duedate_str.replace(')/','');
                          var Duedate = new Date(0); // Unix EPOCH time
                              Duedate.setUTCMilliseconds(Duedate_str);




                              context.ParkedinvoiceH = oParkedinvoiceH;
          
                              context.ParkedinvoiceH.Bldat = Bldat.toLocaleDateString(); // "12/07/2023"    UI5    Short Date
                              context.ParkedinvoiceH.Bldat = context.ParkedinvoiceH.Bldat.replaceAll('/','-');  // "12-07-2023"    UI5   Picker Format date


                              context.ParkedinvoiceH.Budat = Budat.toLocaleDateString(); // "12/07/2023"    UI5    Short Date
                              context.ParkedinvoiceH.Budat = context.ParkedinvoiceH.Budat.replaceAll('/','-'); // "12-07-2023"    UI5   Picker Format date


                              context.ParkedinvoiceH.Duedate = Duedate.toLocaleDateString(); // "12/07/2023"    UI5    Short Date
                              context.ParkedinvoiceH.Duedate = context.ParkedinvoiceH.Duedate.replaceAll('/','-'); // "12-07-2023"    UI5   Picker Format date



                               // data Picker 
                               // displayFormat="dd-MM-yyyy" valueFormat="yyyy-MM-dd"
                               // Istore in the context  valueFormat="yyyy-MM-dd"
                               context.ParkedinvoiceH.Bldat = that._format_date_from_DatePicker(context.ParkedinvoiceH.Bldat);
                               context.ParkedinvoiceH.Budat = that._format_date_from_DatePicker(context.ParkedinvoiceH.Budat);
    

                              // Only form Ms EDGE

                              if(context.ParkedinvoiceH.Bldat.includes('undefined-undefined-')){
                                const myArray1 = context.ParkedinvoiceH.Bldat.split("undefined-undefined-");
                                context.ParkedinvoiceH.Bldat = that._invert_date(myArray1[1]); // dd.mm.yyyy to yyyy-mm-dd
                              }

                              if(context.ParkedinvoiceH.Budat.includes('undefined-undefined-')){
                                const myArray2 = context.ParkedinvoiceH.Budat.split("undefined-undefined-");
                                context.ParkedinvoiceH.Budat = that._invert_date(myArray2[1]); // dd.mm.yyyy to yyyy-mm-dd
                              }
                              
                              if(context.ParkedinvoiceH.Duedate.includes('undefined-undefined-')){
                                const myArray3 = context.ParkedinvoiceH.Duedate.split("undefined-undefined-");
                                context.ParkedinvoiceH.Duedate = that._invert_date(myArray3[1]); // dd.mm.yyyy to yyyy-mm-dd
                              }





                              // Get  Bank if exists
 
                              if(context.ParkedinvoiceH.Vendor !== '') {
 
                                var vend_filter = 'BankSet?$filter=Partner eq' + "'"  + context.ParkedinvoiceH.Vendor  + "'" + '&$format=json';
                 
                                 $.ajax({
                                     url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/" + vend_filter ,
                                     method: "GET",
                                     cache: false,
                                     async: false,
                                     success: function (result, xhr, data) {
 
                                         // check if i get some entries 
                                         if(result.d.results.length > 0){ 
 
                                              var oBankVendor = result.d.results;   // get the array                                  
                                      
                                              //context.BankVendor = oBankVendor[0];
                                   
                                              context.ArrayBankVendor = [];
                                           
                                             var JBanque = 
                                             '{"Counter": "0000", "Bankaccount": "","Bankcountry": "","Bankkey": "", "Iban": "","Swift": "", "Text": "" }';
 
                                                var obj_JBanque = JSON.parse(JBanque); //to convert the string into a JavaScript object
                                            
                                                context.ArrayBankVendor.push(obj_JBanque);  
 
 
                                             // dans la pièce il y a la Banque du payment 
                                            // if(context.ParkedinvoiceH.Bankcounter !== ''){
 
                                           
                                                 for (var d = 0; d < result.d.results.length; d++) {
              
                                                    if(context.ParkedinvoiceH.Bankcounter ===
                                                      result.d.results[d].Counter ){
 
                                                         context.BankVendor = result.d.results[d];
                                                      }
                                                      var oJBanque = JSON.parse(JBanque);
                                                      oJBanque.Counter =  result.d.results[d].Counter ;
                                                      oJBanque.Bankaccount =  result.d.results[d].Bankaccount ;
                                                      oJBanque.Bankcountry =  result.d.results[d].Bankcountry ;
                                                      oJBanque.Bankkey =  result.d.results[d].Bankkey  ;
                                                      oJBanque.Iban  =  result.d.results[d].Iban  ;
                                                      oJBanque.Swift  =  result.d.results[d].Swift ;
                                                      oJBanque.Text =  result.d.results[d].Text ;
 
                                                      context.ArrayBankVendor.push(oJBanque);
 
                                               
                                                 }
 
 
 
                                           //  } else {
 
 
 
                                                 
                                          //  }
 
                                         } else { // check if i get some entries 
 
 
 
 
                                         } // check if i get some entries 
 
                                     },
 
                                     // @ts-ignore
                                     error: function (err) {
                                     MessageToast.show("Error submiting Bank Update request");
                                     }
                                 
                                 });
                 
 
                               }
 

                              // GET THE FILES PARKET DOCUMENT AJAX
                              var key_query3 =  key_query +   "/toFiles?$format=json" ;
    
                              $.ajax({
                                      url: "/alma_mng_approuter.chunigefiuialmamodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/ParkDocHeaderSet"+key_query3,
                                      method: "GET",
                                      cache: false,
                                      async: false,
                                      success: function (result, xhr, data) {
                                          var oParkedinvoiceFiles = result.d.results;        
                                         
                                          context.toFiles = [];
                                          context.toFiles = oParkedinvoiceFiles;
    
                                          that._setRouterPrefix_in_Files(context.toFiles);
    
                                          },
    
                                          // @ts-ignore
                                          error: function (err) {
                                            MessageToast.show("FILES: Error submiting the request");
                                           }
                                       
                                });
    
                                // GET the ITEMS PARKET DOCUMENT AJAX
                                var key_query4 = key_query + '/toItems?$format=json' ;
    
                                $.ajax({
                                    url: "/alma_mng_approuter.chunigefiuialmamodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/ParkDocHeaderSet"+key_query4,
                                    method: "GET",
                                    cache: false,
                                    async: false,
                                    success: function (result, xhr, data) {
    
                                        var oParkedinvoiceItems = result.d.results;                                     
 
                                        context.toItems = [];
                                        context.toItems = oParkedinvoiceItems;
                                        
                                       // set enabled=false for the Currency CBOX
                                        context.cboxdevise = false ;
                                      },
    
                                     // @ts-ignore
                                     error: function (err) {
                                       MessageToast.show("ITEMS: Error submiting the request");
                                      }
                                  
                                     
                                });
                            

                                // get Currencies
                                  
                                $.ajax({
                                  url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/CurrencyDescriptionSet?$format=json",
                                  method: "GET",
                                  cache: false,
                                  async: false,
                                  success: function (result, xhr, data) {

                                      var oCurrencies = result.d.results;                                     
                                  
                                      
                                      context.Currencies = [];
                                      context.Currencies = oCurrencies;


                                    },

                                  // @ts-ignore
                                  error: function (err) {
                                    MessageToast.show("Currencies: Error submiting the request");
                                    }
                                
                              });




                                // get TVA
                                  
                                $.ajax({
                                  url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/TaxSet?$format=json",
                                  method: "GET",
                                  cache: false,
                                  async: false,
                                  success: function (result, xhr, data) {

                                      var oTva = result.d.results;                                     
                                  
                                      
                                      context.Tva = [];
                                      context.Tva = oTva ;


                                    },

                                  // @ts-ignore
                                  error: function (err) {
                                    MessageToast.show("TVA: Error submiting the request");
                                    }
                                
                              });



                             //PaymentCondition

                             $.ajax({
                              url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/PaymentConditionSet?$format=json",
                              method: "GET",
                              cache: false,
                              async: false,
                              success: function (result, xhr, data) {

                                  var oPaymentCondition = result.d.results;                                     
                              
                                  
                                  context.PaymentCondition = [];
                                  context.PaymentCondition = oPaymentCondition ;


                                },

                               // @ts-ignore
                               error: function (err) {
                                 MessageToast.show("PaymentCondition: Error submiting the request");
                                }
                             
                           });


                            // PaymentMethod


                            $.ajax({
                              url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/PaymentMethodSet?$format=json",
                              method: "GET",
                              cache: false,
                              async: false,
                              success: function (result, xhr, data) {

                                  var oPaymentMethod= result.d.results;                                     
                              
                                  
                                  context.PaymentMethod = [];
                                  context.PaymentMethod = oPaymentMethod ;


                                },

                              // @ts-ignore
                              error: function (err) {
                                MessageToast.show("PaymentMethod: Error submiting the request");
                                }
                            
                          });

 
                              // TaxSet

                              $.ajax({
                                url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV/TaxSet?$format=json",
                                method: "GET",
                                cache: false,
                                async: false,
                                success: function (result, xhr, data) {

                                    var oTax= result.d.results;                                     
                                
                                    
                                    context.Tax = [];
                                    context.Tax = oTax ;

                                  },

                                 // @ts-ignore
                                 error: function (err) {
                                   MessageToast.show("TaxSet: Error submiting the request");
                                  }

                                });





                              // Add Debit credit
                              //   text="Débit" key="0" 
                              //   text="Crédit" key="1" 


                              context.Debitcredit =
                              [
                                 {
                                  "key": "0",
                                  "text": "Débit",
                                 },
                                {
                                  "key": "1",
                                  "text": "Crédit",
                                  } 
                              ];



                         } //HEADER PARKET DOCUMENT AJAX - Success
    
                      });
    
 
 
            },

            
                /**
                  * Save Files into Posting.json
                  * @param {object} [] oFiles  
                  * @public
                **/
              
                _setRouterPrefix_in_Files: function (oFiles) {

                  // add APP Router Prefix
  
                  for (var j = 0; j < oFiles.length; j++) {
                    var oAttachmentURL =  "/alma_mng_approuter.chunigefiuialmamodule" + oFiles[j].Url;
                    oFiles[j].Url = oAttachmentURL;
                
                  }
      
                },

                          /**
                          * Post the Parked Document
                          * @param {approvalStatus} boolen
                          * @public
                          **/
                                  
                        PostDocument: function (approvalStatus) {


                          var viewModel =  this.getModel();
                          var contxt = viewModel.getData();
        
                          this._save_parked_document(this.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, contxt, "Q", true);
        
           
                          this._refreshTaskList();
        
        
                        },


                /**
                  * Save the Parked Document
                  * @param {approvalStatus} boolen
                  * @public
                **/
                SaveDocument: function (approvalStatus) {


                  var viewModel =  this.getModel();
                  var contxt = viewModel.getData();

                  this._save_parked_document(this.oComponentData.inboxHandle.attachmentHandle.detailModel.getData().InstanceID, contxt, "T", true);

   
                  this._refreshTaskList();


                },


            // 8. Post data to Backend
            _save_parked_document: function (taskId, contxt, Action, only_save) {

                var that = this ;
                var oPostingModel = sap.ui.getCore().getModel("Posting");
     
                var JModel_Posting=   this._JModel_Load(oPostingModel, contxt, Action);

                var su =  this._getCPIRuntimeBaseURL() ; 
                var oODataModel = new sap.ui.model.odata.ODataModel(su, true);
                
              
                sap.ui.core.BusyIndicator.show();

                oODataModel.create("/ParkDocHeaderSet", JModel_Posting.oData, {

                  method:"POST",    

                    success: function(oData, response) {
                      sap.ui.core.BusyIndicator.hide();
        
                      // response header
                      var hdrMessage = response.headers["sap-message"];
                      var hdrMessageObject = JSON.parse(hdrMessage);


                          //message: "La pièce ne peut pas être comptabilisée, car solde pièce différent de 0"
                          //severity : "error"

                          if(hdrMessageObject.severity === "error") {

                              that._showServiceError(hdrMessageObject.message);


                          } else { 
                              if(Action === 'T'){   // when i save the data
                                
                                  if (only_save){    // The Sauvgarger button has been pushed


                                          // fetch FILES URLs from Response
                                          that._fetchFiles(contxt, response.data.toFiles.results);
 

                                          // fetch Duedate from Response
                                           that._fetchDuedate(contxt, oData);

                                          // fetch center number from Response
                                          that._fetchCentre(contxt, oData);
                                          
                               

                                          let str_msg = "La facture Préenregistréé " + contxt.Belnr + " enregistré"
                                          MessageToast.show(str_msg );


                                  }
                          
                               } else {   // when i've Posted the Document -->// Action === 'Q'
                             
                                  // Complete the User task L2 
  
                                  that._showSuccessMessageSave(contxt.Belnr, contxt.Gjahr, contxt, taskId);
                                 
              
                              }
  

                          }       
                     },

                    error: function (oData, response){
                        sap.ui.core.BusyIndicator.hide();
                      
                        that._showServiceError("Erreur à la sauvgarde");
    
                    },
              
                });
           
                contxt.refresh;

            },



                  /**
                  * Error POPUP
                  * @param {responseText}  
                  * @public
                  **/
                  _showServiceError: function(responseText) {

                    MessageBox.error(
                        responseText, {
        
                            id: "serviceErrorsMessageBoxCR",
                            title: "Erreur",
                            
                            textAlignment: "Center",
        
                            actions: [sap.m.MessageBox.Action.OK],
                            onClose: function() {
                       
                            }.bind(this)
                        }
                    );
        
                },

                 /**
                  * _showSuccessMessageSave
                  * Generic Confirmation Dialog for reuse
                   * @param  oRegularisationResponse
                  * */
                  _showSuccessMessageSave: function (NewDocumentnumber, NewGjahr, contxt, taskId) {
                                          
                    var  that = this;

                    MessageBox.confirm(
                        'La Facture: ' + NewDocumentnumber  + ' ' + NewGjahr + ' a été créée!' , {
                            
                        title: "Creation Facture",

                        actions: [sap.m.MessageBox.Action.OK],

                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                            
                                that._completewf(contxt, taskId, "Yes");
                            } 
                    
                        }.bind(this)
                    }
                    );

                    return false;
                  },

                    //  Setting WF Completion 
                    _completewf: function (contxt, taskId, approvalStatus) {
                                              
                   
                      var empty = "";

                      var token = this._fetchToken();
                      $.ajax({
                          url: "/zunige_ui_kofax_approuter.chunigefikofaxuimodule/bpmworkflowruntime/v1/task-instances/" + taskId,
                          method: "PATCH",
                          contentType: "application/json",
                          async: false,
                          data: "{\"status\": \"COMPLETED\", \"context\": {\"to\":\""  + empty + "\"  }}",
                          headers: {
                              "X-CSRF-Token": token
                          },
                          // @ts-ignore
                          success: function (result2, xhr2, data2) {
 

                          },
                          // @ts-ignore
                          error: function (err) {
                          
                              MessageToast.show("Error submiting the request");
                          }
                      });
                  
                      this._refreshTask(taskId);
                    },

 
            /**
            * refresh Inbox
            * @param {taskId} taskId

            * */ 
            _refreshTask: function (taskId) {

                  this.getComponentData().startupParameters.inboxAPI.updateTask("NA", taskId);

             },


            /**
            * Get FILES from ODATA response 
            * @param {contxt} Fiori APP contxt
            * @param {oData} response from ODATA Save
            * @return {contxt} 
            * */
            _fetchFiles: function (contxt, toFiles){

              // delete contect Item Array and populate with the Item Array received from the Odata.Post

              contxt.toFiles = [];
                            


              if (toFiles.length > 0) {
      
               

                for (var d = 0; d < toFiles.length; d++) {
               
                  contxt.toFiles.push(toFiles[d]);
                  delete contxt.toFiles[d].__metadata;

                }


              } 



            return contxt;
            },


            /**
            * Get Fin Center from ODATA response 
            * @param {contxt} Fiori APP contxt
            * @param {oData} response from ODATA Read
            * @return {contxt} 
            * */
            _fetchCentre: function (contxt, oData){

              // delete contect Item Array and populate with the Item Array received from the Odata.Post

              contxt.toItems = [];
              contxt.toItems = oData.toItems.results;
                     
              return contxt;
             },

            /**
            * Prepare JSON for posting to backend
            * @param {oPostingModel}  
            * @param {contxt} 
            * @param {Action} 
            * @return {oPostingModel}  
            * @public
             **/
           _JModel_Load: function (oPostingModel, contxt, Action) {
         
        
              oPostingModel.setProperty("/Ausbk",   contxt.Ausbk);
              oPostingModel.setProperty("/Bukrs",   contxt.Bukrs);
              oPostingModel.setProperty("/Belnr",   contxt.Belnr);
              oPostingModel.setProperty("/Gjahr",   contxt.Gjahr);

              oPostingModel.setProperty("/Action",  Action);

              oPostingModel.setProperty("/Name",    contxt.ParkedinvoiceH.Name);
              oPostingModel.setProperty("/Vendor",  contxt.ParkedinvoiceH.Vendor);
              oPostingModel.setProperty("/Street",  contxt.ParkedinvoiceH.Street);
              oPostingModel.setProperty("/City",    contxt.ParkedinvoiceH.City);
              oPostingModel.setProperty("/Country", contxt.ParkedinvoiceH.Country);

              oPostingModel.setProperty("/Paymentconditioncode", contxt.ParkedinvoiceH.Paymentconditioncode);
              oPostingModel.setProperty("/Paymentmethodcode", contxt.ParkedinvoiceH.Paymentmethodcode);
              oPostingModel.setProperty("/QrRef", contxt.ParkedinvoiceH.QrRef);
              oPostingModel.setProperty("/Qriban", contxt.ParkedinvoiceH.Qriban);
           
              oPostingModel.setProperty("/Calctva", contxt.ParkedinvoiceH.Calctva);

              oPostingModel.setProperty("/Bktxt", contxt.ParkedinvoiceH.Bktxt);
              oPostingModel.setProperty("/Xblnr", contxt.ParkedinvoiceH.Xblnr);
      
              oPostingModel.setProperty("/Blart", contxt.ParkedinvoiceH.Blart);
              oPostingModel.setProperty("/Divise", contxt.ParkedinvoiceH.Divise);

              if  (contxt.ParkedinvoiceH.Bankcounter === '0000') {

                oPostingModel.setProperty("/Bankcounter", '');
             } else { 
               oPostingModel.setProperty("/Bankcounter", contxt.ParkedinvoiceH.Bankcounter);
            } 

                    // Date ---> 12-07-2023 date format from date Picker on UI5 Page
                    // Date ---> 2023-07-12T00:00:00 date format to ODATA Post

                    var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                      pattern: "yyyy-MM-dd"
                   });

                     // date Bldat formatted for Posting to Backend 
                     var oDateBldat = contxt.ParkedinvoiceH.Bldat + "T00:00:00";
                     oPostingModel.setProperty("/Bldat", oDateBldat );

                    // date Budat formatted for Posting to Backend 
                    var  oDateBudat =contxt.ParkedinvoiceH.Budat + "T00:00:00";
                    oPostingModel.setProperty("/Budat",  oDateBudat);


             //  "toFiles": []
              if (contxt.toFiles.length > 0) {
      
                  oPostingModel.oData.toFiles = [];

                  for (var d = 0; d < contxt.toFiles.length; d++) {
                      delete contxt.toFiles[d].__metadata;
                      oPostingModel.oData.toFiles.push(contxt.toFiles[d]);
                  }
              } else {

                  delete  oPostingModel.toFiles;

              };

             //  "toItems": []
              if (contxt.toItems.length > 0) {
        
                oPostingModel.oData.toItems = [];

                for (var d = 0; d < contxt.toItems.length; d++) {
                  
                    if( contxt.toItems[d].__metadata !== undefined ){
                        delete contxt.toItems[d].__metadata;

                    }

                    oPostingModel.oData.toItems.push(contxt.toItems[d]);
                }
                } else {

                  oPostingModel.oData.toItems = [];
                  //delete  oPostingModel.toItems;

                };


             return oPostingModel;

          },
            
             /**
             * Format Date from UI5 Date DatePicker in format "2023-06-01"
             * @param {date} in date   "01-06-2023"
             * @return {date} out date  "2023-06-01"
             * @private
             * */

             _format_date_from_DatePicker: function (date) {
     

              const myArray = date.split("-");

               var  dd  =  myArray[0]; 
               var  mm  =  myArray[1];
               var  yyyy = myArray[2];    

              date = yyyy + '-' + mm + '-' + dd ;


           return date;
          },

            /**
             * gat Array_CentreFin from the CTR of the Parked Document
             * @param {to} String with all the recipeint
             * @return {Array_CentreFin}  ARRAY
             * @private
             * */

            _get_Array_CentreFin: function (Items) {
             
              let Array_CentreFin = [];
         

              for (var d = 0; d < Items.length; d++) {
                Array_CentreFin.push(Items[d].Centre );    
             }
 

            return  Array_CentreFin;

          },



        setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getCPIRuntimeBaseURL: function () {
          var appId = "ch.unige.fi.uialmamodule";
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);
          return appModulePath + "/sap/opu/odata/sap/Z_KOFAX_INVOICE_SRV" ;
        },
        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          var appId = this.getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);

          return appModulePath + "/bpmworkflowruntime/v1";
        },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        completeTask: function (approvalStatus) {
          this.getModel("context").setProperty("/approved", approvalStatus);
          this._patchTaskInstance();
          this._refreshTaskList();
        },

        _patchTaskInstance: function () {
          var data = {
            status: "COMPLETED",
            context: this.getModel("context").getData(),
          };

          jQuery.ajax({
            url: this._getTaskInstancesBaseURL(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
          });
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

            /**
            * Get FILES from ODATA response 
            * @param {contxt} Fiori APP contxt
            * @param {oData} response from ODATA Read
            * @return {contxt} 
            * */
            _fetchFiles: function (contxt, oData){

              // delete contect Item Array and populate with the Item Array received from the Odata.Post
              contxt.toFiles = [];

              if(oData.toFile  !==  undefined) { 
              contxt.toFiles = oData.toFiles.results;
              }

            return contxt;
          },

          /**
          * From dd.mm.yyyy to yyyy-mm-dd
          * @param {mydate} Fiori APP contxt
          * @return {mydate} 
          * */
           _invert_date: function (mydate){
              const myArray = mydate.split(".");
              let dd = myArray[0];
              let mm = myArray[1];
              let yyyy = myArray[2];


              let new_date = yyyy + '-' + mm + '-' + dd ;

              return new_date;
            },


          /**
          * Get Fin Center from ODATA response 
          * @param {contxt} Fiori APP contxt
          * @param {oData} response from ODATA Read
          * @return {contxt} 
          * */
          _fetchCentre: function (contxt, oData){

              // delete contect Item Array and populate with the Item Array received from the Odata.Post

              contxt.toItems = [];
              contxt.toItems = oData.toItems.results;
                     
            return contxt;
          },




        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());

          
        },
  

          /**
                    * Get Duedate ODATA response 
                    * @param {contxt} Fiori APP contxt
                    * @param {oData} response from ODATA Read
                    * @return {contxt} 
                    * */
          _fetchDuedate: function (contxt, oData){

            contxt.ParkedinvoiceH.Duedate =  oData.Duedate ;
                          
                contxt.ParkedinvoiceH.Duedate = oData.Duedate.toLocaleDateString();  
                contxt.ParkedinvoiceH.Duedate = contxt.ParkedinvoiceH.Duedate.replaceAll('/','-');  

                contxt.ParkedinvoiceH.Duedate  = this._format_date_from_DatePicker(contxt.ParkedinvoiceH.Duedate );
              

                var owf_context = this.getModel();
                owf_context.setProperty("/ParkedinvoiceH/Duedate",  contxt.ParkedinvoiceH.Duedate);
            
                owf_context.refresh();










          return contxt;
        }


      }
    );
  }
);
