$(document).ready(function() {
    
    function resize() {
        var iframeWin = parent.document.getElementById("tax_calculator_frame");
        if (iframeWin) { iframeWin.height = document.body.scrollHeight + 20 + "px"; }
    }
    
    resize();
    $(window).resize(function() { resize(); });
    
    // YEAR
    //var today = new Date();
    //var year = today.getFullYear();
    ////year = year + 1;
    var year = 2022;    
    
    // Array unique value function
    function unique(list) {
        var result = [];
        $.each(list, function(i, e) { if ($.inArray(e, result) == -1) result.push(e); });
        return result;
    }
    
    function addSeparator(nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ' ' + '$2');
        }
        return x1 + x2;
    }
    
    var Option_txt = []; Option_txt['en'] = 'Option'; Option_txt['fi'] = 'Lisävarusteen';
    var Accessorie_txt = []; Accessorie_txt['en'] = 'Accessory'; Accessorie_txt['fi'] = 'Tarvikkeen';
    var price_txt = []; price_txt['en'] = 'price'; price_txt['fi'] = 'hinta';
    var Make_txt = []; Make_txt['en'] = 'Make'; Make_txt['fi'] = 'Merkki';
    var Model_txt = []; Model_txt['en'] = 'Model'; Model_txt['fi'] = 'Malli';
    var Description_txt = []; Description_txt['en'] = 'Model Description'; Description_txt['fi'] = 'Mallitarkenne';

    
	jQuery(document).on('click', '#add_option_button',  function() {
        //var option_number = $('div#options input').length + 1;
        $("div#options").append('<div class="input-group mb-1"><input type="number" step="0.01" class="form-control form-control-sm options_input" name="options" placeholder="' + Option_txt[lng] + ' ' + price_txt[lng] + '"><div class="input-group-append"><button class="btn btn-sm remove_option_button" type="button"><img src="minus.png"></button></div>');
        resize();
    })
    
    jQuery(':input[type=number]').on('mousewheel', function(e){
    jQuery(this).blur(); });
    
	jQuery(document).on('click', '.remove_option_button, .remove_accessory_button',  function() {
        jQuery(this).parent().parent().remove();
        calc(); resize();
    })
    
	jQuery(document).on('click', '#add_accessory_button',  function() {
        //var accessory_number = $('div#accessories input').length + 1;
        $("div#accessories").append('<div class="input-group mb-1"><input type="number" step="0.01" class="form-control form-control-sm accessories_input" name="accessories" placeholder="' + Accessorie_txt[lng] + ' ' + price_txt[lng] + '"><div class="input-group-append"><button class="btn btn-sm remove_accessory_button" type="button"><img src="minus.png"></button></div>');
        resize();
    })    

    $('#make').on('change', function () {
        selectModel();
        $("#models").removeClass("d-none");
        $("#descriptions").addClass("d-none");
        purge();
    }); // Models listing

    $('#models').on('change', function () {
        selectDescription();
        $("#descriptions").removeClass("d-none");
        purge();
    }); // Descriptions listing
    $('#descriptions').on('change', function () { resize(); calc(); }); // Description select + remove all the previous options/accessories

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Make from JSON file (jsoncalc.json) + select input injection
    $.getJSON('JSON/jsoncalc.json', function(data){
        var results = [];        
              
        $.each(data, function(index, x) { results.push(x['Vehicle Make']); });
        
        results = unique(results); // Unique
        results.sort(); // Sorting

        var make_select_options = "";

        for (var key in results) {
            make_select_options += '<option value="' + results[key] + '">' + results[key] + '</option>' // Option added
        }
        
        $("#make").append(make_select_options);
    });


    // Models from JSON file (jsoncalc.json) + select input injection
    function selectModel(){
        var selected_make = $("#make").val();
        var results = [];        

        $.getJSON('JSON/jsoncalc.json', function(data) {

            $.each(data,  function (index, x) { // Standard array
                if(x['Vehicle Make'] === selected_make) { results.push(x['Vehicle Model']); } // Result added only if the make is the selected one
            });

            results = unique(results); // Unique
            results.sort(); // Sorting
            
            var models_select_options = "";

            for(var key in results){
                models_select_options += '<option value="'+ results[key] +'">' + results[key] + '</option>';  // Option added
            }
            
            $("#models").html('<option>' + Model_txt[lng] + '</option>'); // Purge
            $("#models").append(models_select_options);
        })
    }

    // Models from JSON file (jsoncalc.json) + select input injection
    function selectDescription(){
        var selected_model = $("#models").val();
        var results = [];        

        $.getJSON('JSON/jsoncalc.json', function(data) {

            $.each(data,  function (index, x) { // Standard array
               
                if(x['Vehicle Model'] === selected_model) { results.push(x['Vehicle Description']); } // Result added only if the make is the selected one
            });

            results.sort(); // Sorting
            
            var descriptions_select_options = "";

            for(var key in results){
                descriptions_select_options += '<option value="'+ results[key] +'">' + results[key] + '</option>';  // Option added
            }
            
            $("#descriptions").html('<option>' + Description_txt[lng] + '</option>'); // Purge
            $("#descriptions").append(descriptions_select_options);
        })
    }
    
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Purge
    function purge() {
        $('#list_price').html('--- €');
        $('#co2_emission').html('--- g/km');
        $('#total_tax').html('--- €');
        $('#total_price').html('--- €');
        $('#unlimited_benefit').html('--- €');
        $('#limited_benefit').html('--- €');
        jQuery('div#options, div#accessories').html('');
        $("#descriptions").html('<option>' + Description_txt[lng] + '</option>');
    }

    // Calcul function
    function calc(){

        var Vehicle_Description = $("#descriptions").val();
        $("#box").html("");
        
        // Informations from JSON file (jsoncalc.json)
        $.getJSON('JSON/jsoncalc.json', function(data) {
            $.each(data,  function (index, x) {
                if(x['Vehicle Description'] === Vehicle_Description){ // We get the selected vehicle informations

                    var currentCO2 = parseInt(x['Vehicle CO2'], 10); // Fix
                    if (currentCO2 === 360) { var taxRate = 50; } // If CO2 == 360 >> taxRate = 50

                    // Informations from JSON file (CO2TAX.json)
                    $.getJSON('JSON/CO2TAX.json', function(data) {
                        var arr = [];
                        $.each(data[year], function (index, x){ arr.push(x); });
                        
                        for (var i in arr) {
                            if (parseInt(arr[i].CO2) === currentCO2) { taxRate = arr[i].TAX; } // We get the taxRate from the file
                        }

                       $(document).on('change', '.options_input, .accessories_input', function() { final_calcul(); }); // Calcul on option/accessorie change
                 

                        function final_calcul() {

                            // Options / Accessories values loop
                            var totalPriceOption = 0;                            
                            $(".options_input").each(function(index) {
                              totalPriceOption += parseInt($(this).val()) || 0;
                            });                            
                            
                            var totalTaxOption = ((totalPriceOption * 0.945) * (taxRate * 0.01)) / (1 - (taxRate * 0.01));
                            var totalOption = totalTaxOption + totalPriceOption;

                            var totalAcces = 0;
                            $(".accessories_input").each(function(index) {
                              totalAcces += parseInt($(this).val()) || 0;
                            });
                            
                            var effectiveTotalAccesOption = (totalAcces + totalPriceOption);
                            var displayed_effectiveTotalAccesOption = effectiveTotalAccesOption; // Useful for "displayed_totalprice"
                            if (effectiveTotalAccesOption > 1200 ) { effectiveTotalAccesOption -= 1200; } else { effectiveTotalAccesOption = 0; }

                            // Effective Price calculation
                            var effectivePrice = parseFloat(x['Vehicle Price'] / 100); // Fix

                            // Price Tax calculation + fix 20180927
                            var pricetax = (Math.floor((effectivePrice * 0.945) - 250)) * (taxRate * 0.01) / (1 - (taxRate * 0.01));
                            console.log(Math.floor((effectivePrice * 0.945) - 250));

                            // Effective Price calculation
                            var totaltax = pricetax + totalTaxOption;
                            totaltax = parseInt(totaltax * 100)/100;
                            // Modif winter 2021 - No taxes for 0 CO2 vehicles
                            //if (currentCO2 === 0) { pricetax = totaltax = 0; }

                            // Total Price calculation : vehicle price + taxes (options)
                            var displayed_totalprice = effectivePrice + displayed_effectiveTotalAccesOption + totaltax; // Price without "effectiveTotalAccesOption" reduction
                            var totalprice = effectivePrice + effectiveTotalAccesOption + totaltax;
                            totalprice = parseInt(totalprice * 100)/100;

                            var unlimitedBenefit = parseFloat ( ( parseInt ( ( ( totalprice - 3400 ) * 0.015 ) / 10 ) * 10 + 300 ) );
                            // Modif Summer 2019 - Unlimited Benefit Reduction (120) if CO2 = 0
                            // Modif Winter 2023 120 > 135 + 1.5% instead of 1.4%
                            if (currentCO2 === 0) { unlimitedBenefit -= 135; }

                            var limitedBenefit = parseFloat ( ( parseInt ( ( ( totalprice - 3400 ) * 0.015 ) / 10 ) * 10 + 105 ) );

                            // Modif Winter 2020 - Unlimited/Limited Benefits Reduction (170) if CO2 = 0
                            if (currentCO2 === 0) { unlimitedBenefit -= 170; limitedBenefit -= 170; }
                            
                            // Some vars
                            var vehicle_model = x['Vehicle Model'];
                            var vehicle_fuel_type = x['Fuel Type'];
                            var vehicle_fuel_type2 = x['Fuel Type 2'];
                            var vehicle_maximum_weight = parseInt(x['Maximum Weight'], 10);

                            // Modifs Winter 2021 - 3 new rules based on CO2 + fuel types
                            var vehicle_fuel_type = x['Fuel Type'];
                            // R1 - 1-100 CO2 discount
                            if (currentCO2 <= 100 && currentCO2 != 0) { unlimitedBenefit -= 85; limitedBenefit -= 85; }
                            // R2 - 1-100 CO2 + B/D + E fuel types
                            if (((vehicle_fuel_type == 'Petrol (unleaded)' || vehicle_fuel_type == 'Diesel') && vehicle_fuel_type2 == 'Electric' && currentCO2 <= 100) || ((vehicle_fuel_type == 'Compressed natural gas' || vehicle_fuel_type2 == 'Compressed natural gas') && currentCO2 <= 100)) { unlimitedBenefit -= 60; }
                            // R3 - 100+ CO2 + G/G fuel types
                            if (((vehicle_fuel_type == 'Compressed natural gas' || vehicle_fuel_type2 == 'Compressed natural gas') && currentCO2 > 100)) { unlimitedBenefit -= 60; }

                            // Injections
                            $('#list_price').html(addSeparator(effectivePrice) + ' €');
                            $('#co2_emission').html(addSeparator(currentCO2) + ' g/km');
                            $('#total_tax').html(addSeparator(totaltax) + ' €');
                            $('#total_price').html(addSeparator(displayed_totalprice) + ' €');
                            $('#unlimited_benefit').html(addSeparator(unlimitedBenefit) + ' €');
                            $('#limited_benefit').html(addSeparator(limitedBenefit) + ' €');                            

                        }
                        final_calcul();
                    });
                }
            })
        });
    }
 });